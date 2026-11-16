from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import os

from backend.database import get_db
from backend.config import METADATA_DIR
import backend.models_db as models_db
import backend.schemas as schemas
from backend.routers.auth_router import get_current_user
from backend.auth import verify_password
from backend.services.engagement_service import build_engagement_progress
from backend.services.file_storage import FileStorageService
from backend.services.media_access import retention_has_expired
from backend.services import storage_provider

router = APIRouter()


def _delete_project_and_media(db: Session, project: models_db.DubbingProject) -> None:
    storage = FileStorageService()
    provider = storage_provider.get_storage_provider()
    exports = db.query(models_db.DubbingExport).filter(
        models_db.DubbingExport.project_id == project.id
    ).all()

    for export in exports:
        safe_id = storage._validate_uuid(export.output_video_id, "Çıktı videosu")
        filename = f"{safe_id}.mp4"
        try:
            metadata = storage.get_output_metadata(safe_id)
        except HTTPException as error:
            if error.status_code != status.HTTP_404_NOT_FOUND:
                raise
        else:
            filename = str(metadata.get("stored_filename") or filename)

        if Path(filename).name != filename:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Çıktı videosu depolama bilgisi geçersiz.",
            )
        if not provider.delete_file(filename):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Proje dosyaları silinemedi. Lütfen daha sonra tekrar deneyin.",
            )

        try:
            output_path = storage.get_output_path(safe_id)
        except HTTPException as error:
            if error.status_code != status.HTTP_404_NOT_FOUND:
                raise
        else:
            output_path.unlink(missing_ok=True)
        (METADATA_DIR / f"output-{safe_id}.json").unlink(missing_ok=True)

        db.delete(export)

    db.query(models_db.DubbingLike).filter(
        models_db.DubbingLike.project_id == project.id
    ).delete(synchronize_session=False)
    db.query(models_db.DubbingComment).filter(
        models_db.DubbingComment.project_id == project.id
    ).delete(synchronize_session=False)
    db.query(models_db.ContentReport).filter(
        models_db.ContentReport.project_id == project.id
    ).delete(synchronize_session=False)
    db.delete(project)


@router.get("/engagement", response_model=schemas.EngagementProgressResponse)
def get_engagement_progress(
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(get_current_user),
):
    return build_engagement_progress(db, current_user.id)

@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(body: schemas.AccountDeleteRequest, db: Session = Depends(get_db), current_user: models_db.User = Depends(get_current_user)):
    if body.confirmation.strip() != current_user.display_name:
        raise HTTPException(status_code=400, detail="Kullanıcı adı eşleşmiyor.")

    if current_user.password_hash and (
        not body.password or not verify_password(body.password, current_user.password_hash)
    ):
        raise HTTPException(status_code=400, detail="Geçersiz şifre.")

    projects = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.user_id == current_user.id
    ).all()
    for project in projects:
        _delete_project_and_media(db, project)

    FileStorageService().delete_owned_uploads(current_user.id)
    db.query(models_db.DubbingLike).filter(
        models_db.DubbingLike.user_id == current_user.id
    ).delete(synchronize_session=False)
    db.query(models_db.DubbingComment).filter(
        models_db.DubbingComment.user_id == current_user.id
    ).delete(synchronize_session=False)
    db.query(models_db.ContentReport).filter(
        models_db.ContentReport.reporter_user_id == current_user.id
    ).delete(synchronize_session=False)
    db.delete(current_user)
    db.commit()
    return None

@router.patch("/profile", response_model=schemas.UserResponse)
def update_profile(
    profile: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(get_current_user),
):
    current_user.display_name = profile.display_name.strip()
    current_user.avatar_url = profile.avatar_url.strip() if profile.avatar_url else None
    db.commit()
    db.refresh(current_user)

    from backend.services.membership_service import has_active_vip
    response = schemas.UserResponse.model_validate(current_user)
    return response.model_copy(update={
        "has_active_vip": has_active_vip(current_user),
        "has_password": bool(current_user.password_hash),
        "discord_linked": bool(current_user.discord_id),
    })

@router.get("/projects", response_model=List[schemas.ProjectResponse])
def get_user_projects(db: Session = Depends(get_db), current_user: models_db.User = Depends(get_current_user)):
    projects = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.user_id == current_user.id
    ).order_by(models_db.DubbingProject.created_at.desc()).all()
    return projects

@router.get("/projects/{project_id}", response_model=schemas.ProjectResponse)
def get_user_project(project_id: str, db: Session = Depends(get_db), current_user: models_db.User = Depends(get_current_user)):
    project = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.id == project_id,
        models_db.DubbingProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı.")
    return project

@router.patch("/projects/{project_id}", response_model=schemas.ProjectResponse)
def update_user_project(project_id: str, project_update: schemas.ProjectUpdate, db: Session = Depends(get_db), current_user: models_db.User = Depends(get_current_user)):
    project = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.id == project_id,
        models_db.DubbingProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı.")

    if project_update.title is not None:
        project.title = project_update.title.strip()
    if project_update.visibility is not None:
        if project_update.visibility == "public":
            if project.moderation_status != "visible":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="İnceleme nedeniyle gizlenen proje yeniden yayınlanamaz. Destek ekibine itiraz edebilirsiniz.",
                )
            export = db.query(models_db.DubbingExport).filter(
                models_db.DubbingExport.project_id == project.id
            ).order_by(models_db.DubbingExport.created_at.desc()).first()
            if project.status != "completed" or not export or not export.output_video_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Yalnızca tamamlanmış ve oynatılabilir projeler yayınlanabilir.",
                )
            if retention_has_expired(export.retention_expires_at):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Saklama süresi dolmuş bir video yayınlanamaz.",
                )

            from backend.services.file_storage import FileStorageService
            from backend.services.storage_provider import get_storage_provider

            storage = FileStorageService()
            provider = get_storage_provider()
            filename = f"{export.output_video_id}.mp4"
            try:
                metadata = storage.get_output_metadata(export.output_video_id)
                filename = str(metadata.get("stored_filename") or filename)
            except HTTPException:
                if provider.provider_name != "s3":
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Video dosyası bulunamadığı için proje yayınlanamadı.",
                    ) from None
            if not provider.file_exists(filename):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Video dosyası bulunamadığı için proje yayınlanamadı.",
                )
        project.visibility = project_update.visibility

    db.commit()
    db.refresh(project)
    return project

@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_project(project_id: str, db: Session = Depends(get_db), current_user: models_db.User = Depends(get_current_user)):
    project = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.id == project_id,
        models_db.DubbingProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı.")

    _delete_project_and_media(db, project)
    db.commit()
    return None

@router.get("/exports", response_model=List[schemas.ExportResponse])
def get_user_exports(db: Session = Depends(get_db), current_user: models_db.User = Depends(get_current_user)):
    projects = db.query(models_db.DubbingProject.id).filter(
        models_db.DubbingProject.user_id == current_user.id
    ).all()
    project_ids = [p.id for p in projects]

    if not project_ids:
        return []

    exports = db.query(models_db.DubbingExport).filter(
        models_db.DubbingExport.project_id.in_(project_ids)
    ).order_by(models_db.DubbingExport.created_at.desc()).all()

    from backend.services.file_storage import FileStorageService
    storage = FileStorageService()

    from backend.services.storage_provider import get_storage_provider
    provider = get_storage_provider()

    # Check if files still exist, if not set download_url to None
    for exp in exports:
        if exp.output_video_id and exp.download_url:
            if retention_has_expired(exp.retention_expires_at):
                exp.download_url = None
                continue
            filename = f"{exp.output_video_id}.mp4"
            try:
                meta = storage.get_output_metadata(exp.output_video_id)
                filename = str(meta.get("stored_filename") or filename)
            except HTTPException:
                if provider.provider_name != "s3":
                    exp.download_url = None
                    continue
            if not provider.file_exists(filename):
                exp.download_url = None
            else:
                exp.download_url = provider.get_public_url(filename)

    return exports
