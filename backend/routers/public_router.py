from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List

from backend.database import get_db
import backend.models_db as models_db
import backend.schemas as schemas
from backend.services.file_storage import FileStorageService
from backend.routers.auth_router import get_current_user

router = APIRouter(prefix="/api/public", tags=["public"])
storage = FileStorageService()

def get_optional_user(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    try:
        return get_current_user(db=db, token=auth_header.split(" ", 1)[1])
    except HTTPException:
        return None

@router.get("/dubs", response_model=List[schemas.PublicDubResponse])
def get_public_dubs(db: Session = Depends(get_db), current_user: models_db.User | None = Depends(get_optional_user)):
    projects = db.query(models_db.DubbingProject, models_db.User).join(
        models_db.User, models_db.DubbingProject.user_id == models_db.User.id
    ).filter(
        models_db.DubbingProject.visibility == "public",
        models_db.DubbingProject.status == "completed",
        models_db.DubbingProject.moderation_status == "visible"
    ).order_by(models_db.DubbingProject.created_at.desc()).all()
    
    result = []
    for project, user in projects:
        export = db.query(models_db.DubbingExport).filter(
            models_db.DubbingExport.project_id == project.id
        ).first()
        
        if export and export.output_video_id:
            try:
                storage.get_output_path(export.output_video_id)
                
                # Check like count and my like
                like_count = db.query(models_db.DubbingLike).filter(models_db.DubbingLike.project_id == project.id).count()
                liked_by_me = False
                if current_user:
                    liked_by_me = db.query(models_db.DubbingLike).filter(
                        models_db.DubbingLike.project_id == project.id,
                        models_db.DubbingLike.user_id == current_user.id
                    ).count() > 0
                
                result.append(schemas.PublicDubResponse(
                    project_id=project.id,
                    title=project.title,
                    display_name=user.display_name,
                    created_at=project.created_at,
                    duration_seconds=project.duration_seconds,
                    download_url=export.download_url,
                    view_count=project.view_count,
                    like_count=like_count,
                    liked_by_me=liked_by_me
                ))
            except HTTPException:
                pass
                
    return result

@router.get("/dubs/{project_id}", response_model=schemas.PublicDubResponse)
def get_public_dub(project_id: str, db: Session = Depends(get_db), current_user: models_db.User | None = Depends(get_optional_user)):
    record = db.query(models_db.DubbingProject, models_db.User).join(
        models_db.User, models_db.DubbingProject.user_id == models_db.User.id
    ).filter(
        models_db.DubbingProject.id == project_id,
        models_db.DubbingProject.visibility == "public",
        models_db.DubbingProject.status == "completed",
        models_db.DubbingProject.moderation_status == "visible"
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Dublaj bulunamadı veya gizli.")
        
    project, user = record
    
    export = db.query(models_db.DubbingExport).filter(
        models_db.DubbingExport.project_id == project.id
    ).first()
    
    if not export or not export.output_video_id:
        raise HTTPException(status_code=404, detail="Dublaj dosyası bulunamadı.")
        
    try:
        storage.get_output_path(export.output_video_id)
    except HTTPException:
        raise HTTPException(status_code=404, detail="Dublaj dosyası silinmiş.")
        
    like_count = db.query(models_db.DubbingLike).filter(models_db.DubbingLike.project_id == project.id).count()
    liked_by_me = False
    if current_user:
        liked_by_me = db.query(models_db.DubbingLike).filter(
            models_db.DubbingLike.project_id == project.id,
            models_db.DubbingLike.user_id == current_user.id
        ).count() > 0
        
    return schemas.PublicDubResponse(
        project_id=project.id,
        title=project.title,
        display_name=user.display_name,
        created_at=project.created_at,
        duration_seconds=project.duration_seconds,
        download_url=export.download_url,
        view_count=project.view_count,
        like_count=like_count,
        liked_by_me=liked_by_me
    )

@router.post("/dubs/{project_id}/report", status_code=201)
def report_public_dub(
    project_id: str,
    payload: schemas.ContentReportCreate,
    db: Session = Depends(get_db),
    current_user: models_db.User | None = Depends(get_optional_user)
):
    project = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.id == project_id,
        models_db.DubbingProject.visibility == "public"
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı.")
        
    report = models_db.ContentReport(
        project_id=project_id,
        reporter_user_id=current_user.id if current_user else None,
        reason=payload.reason,
        details=payload.details
    )
    db.add(report)
    db.commit()
    return {"message": "Rapor başarıyla alındı."}

@router.post("/dubs/{project_id}/like")
def like_public_dub(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(get_current_user)
):
    project = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.id == project_id,
        models_db.DubbingProject.visibility == "public",
        models_db.DubbingProject.status == "completed",
        models_db.DubbingProject.moderation_status == "visible"
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı veya gizli.")
        
    existing_like = db.query(models_db.DubbingLike).filter(
        models_db.DubbingLike.project_id == project_id,
        models_db.DubbingLike.user_id == current_user.id
    ).first()
    
    if not existing_like:
        new_like = models_db.DubbingLike(project_id=project_id, user_id=current_user.id)
        db.add(new_like)
        db.commit()
        
    return {"message": "Beğenildi."}

@router.delete("/dubs/{project_id}/like")
def unlike_public_dub(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(get_current_user)
):
    existing_like = db.query(models_db.DubbingLike).filter(
        models_db.DubbingLike.project_id == project_id,
        models_db.DubbingLike.user_id == current_user.id
    ).first()
    
    if existing_like:
        db.delete(existing_like)
        db.commit()
        
    return {"message": "Beğeni kaldırıldı."}

@router.post("/dubs/{project_id}/view")
def view_public_dub(
    project_id: str,
    db: Session = Depends(get_db)
):
    project = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.id == project_id,
        models_db.DubbingProject.visibility == "public",
        models_db.DubbingProject.status == "completed",
        models_db.DubbingProject.moderation_status == "visible"
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı veya gizli.")
        
    project.view_count += 1
    db.commit()
    
    return {"message": "Görüntüleme kaydedildi."}

@router.get("/dubs/{project_id}/comments", response_model=List[schemas.CommentResponse])
def get_public_dub_comments(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: models_db.User | None = Depends(get_optional_user)
):
    project = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.id == project_id,
        models_db.DubbingProject.visibility == "public",
        models_db.DubbingProject.status == "completed",
        models_db.DubbingProject.moderation_status == "visible"
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı veya gizli.")
        
    comments = db.query(models_db.DubbingComment, models_db.User).join(
        models_db.User, models_db.DubbingComment.user_id == models_db.User.id
    ).filter(
        models_db.DubbingComment.project_id == project_id,
        models_db.DubbingComment.status == "visible"
    ).order_by(models_db.DubbingComment.created_at.asc()).all()
    
    result = []
    for comment, user in comments:
        result.append(schemas.CommentResponse(
            id=comment.id,
            project_id=comment.project_id,
            user_id=comment.user_id,
            display_name=user.display_name,
            body=comment.body,
            created_at=comment.created_at,
            is_mine=current_user is not None and comment.user_id == current_user.id
        ))
    return result

@router.post("/dubs/{project_id}/comments", response_model=schemas.CommentResponse, status_code=201)
def add_public_dub_comment(
    project_id: str,
    payload: schemas.CommentCreate,
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(get_current_user)
):
    project = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.id == project_id,
        models_db.DubbingProject.visibility == "public",
        models_db.DubbingProject.status == "completed",
        models_db.DubbingProject.moderation_status == "visible"
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı veya gizli.")
        
    body = payload.body.strip()
    if len(body) < 1 or len(body) > 500:
        raise HTTPException(status_code=400, detail="Yorum 1 ile 500 karakter arasında olmalıdır.")
        
    comment = models_db.DubbingComment(
        project_id=project_id,
        user_id=current_user.id,
        body=body
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    return schemas.CommentResponse(
        id=comment.id,
        project_id=comment.project_id,
        user_id=comment.user_id,
        display_name=current_user.display_name,
        body=comment.body,
        created_at=comment.created_at,
        is_mine=True
    )

@router.delete("/dubs/{project_id}/comments/{comment_id}")
def delete_public_dub_comment(
    project_id: str,
    comment_id: str,
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(get_current_user)
):
    from datetime import datetime, timezone
    
    comment = db.query(models_db.DubbingComment).filter(
        models_db.DubbingComment.id == comment_id,
        models_db.DubbingComment.project_id == project_id
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı.")
        
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Sadece kendi yorumunuzu silebilirsiniz.")
        
    comment.status = "hidden"
    comment.hidden_at = datetime.now(timezone.utc)
    comment.hidden_by = current_user.id
    db.commit()
    
    return {"message": "Yorum silindi."}
