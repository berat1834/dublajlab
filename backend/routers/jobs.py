from __future__ import annotations

import json
from pathlib import Path

from fastapi import (
    APIRouter,
    BackgroundTasks,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
    Depends,
)
from sqlalchemy.orm import Session
from backend.database import get_db, SessionLocal
import backend.models_db as models_db
from backend.routers.auth_router import get_current_user, get_current_user_optional
from pydantic import TypeAdapter, ValidationError

from backend.models import DubbingLine, JobResponse, ProcessRequest
from backend.services.ffmpeg_service import MediaProcessingError
from backend.services.job_service import dubbing_job_service, job_registry
from backend.services.rate_limit_service import enforce_public_demo_export_limit
from backend.services.membership_service import has_active_vip, require_active_vip
from backend import config as app_config

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

from datetime import datetime, timedelta, timezone

TIMELINE_DURATION_EPSILON_SECONDS = 0.001
LIP_SYNC_VIP_REQUIRED_ERROR = "Bu özellik sadece VIP kullanıcılara özeldir."
TIMELINE_DURATION_ERROR = (
    "Replik bitiş zamanı video süresini aşıyor. "
    "Lütfen son repliği video bitişinden önce tamamlayın."
)
timeline_adapter = TypeAdapter(list[DubbingLine])

def get_retention_date(membership_tier: str) -> datetime:
    if membership_tier == "vip":
        return datetime.now(timezone.utc) + timedelta(days=30)
    return datetime.now(timezone.utc) + timedelta(hours=24)

async def run_ai_job_with_db(job_id: str, payload: ProcessRequest, project_id: str | None = None, membership_tier: str = "vip"):
    await dubbing_job_service.run_ai_job(job_id, payload, membership_tier)
    if project_id:
        db = SessionLocal()
        try:
            job = await job_registry.get(job_id)
            project = db.query(models_db.DubbingProject).filter(models_db.DubbingProject.id == project_id).first()
            if project and job:
                if job.status == "completed" and job.output_video_id:
                    project.status = "completed"
                    export = models_db.DubbingExport(
                        project_id=project_id,
                        output_video_id=job.output_video_id,
                        download_url=job.download_url,
                        retention_expires_at=get_retention_date(membership_tier)
                    )
                    db.add(export)
                elif job.status == "failed":
                    project.status = "failed"
                db.commit()
        finally:
            db.close()

async def run_recording_job_with_db(
    job_id: str,
    video_id: str,
    lines: list[DubbingLine],
    recording_paths: list[Path],
    mute_original: bool,
    burn_subtitles: bool,
    project_id: str | None = None,
    max_video_width: int = 1280,
    max_video_height: int = 720,
    membership_tier: str = "free",
    apply_lip_sync: bool = False,
):
    await dubbing_job_service.run_recording_job(
        job_id,
        video_id,
        lines,
        recording_paths,
        mute_original,
        burn_subtitles,
        max_video_width,
        max_video_height,
        membership_tier,
        apply_lip_sync,
    )
    if project_id:
        db = SessionLocal()
        try:
            job = await job_registry.get(job_id)
            project = db.query(models_db.DubbingProject).filter(models_db.DubbingProject.id == project_id).first()
            if project and job:
                if job.status == "completed" and job.output_video_id:
                    project.status = "completed"
                    export = models_db.DubbingExport(
                        project_id=project_id,
                        output_video_id=job.output_video_id,
                        download_url=job.download_url,
                        retention_expires_at=get_retention_date(membership_tier)
                    )
                    db.add(export)
                elif job.status == "failed":
                    project.status = "failed"
                db.commit()
        finally:
            db.close()


def ensure_media_tools() -> None:
    try:
        dubbing_job_service.ffmpeg_service.ensure_available()
    except MediaProcessingError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


def enforce_lip_sync_vip(
    apply_lip_sync: bool,
    current_user: models_db.User | None,
) -> None:
    if not apply_lip_sync:
        return

    is_available, unavailable_reason = app_config.lip_sync_availability()
    if not is_available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=unavailable_reason,
        )

    if not has_active_vip(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=LIP_SYNC_VIP_REQUIRED_ERROR,
        )


def validate_recording_timeline(
    timeline: str,
    recording_ids: str,
    duration: float,
) -> tuple[list[DubbingLine], list[str]]:
    try:
        lines = timeline_adapter.validate_json(timeline)
        parsed_recording_ids = json.loads(recording_ids)
    except (ValidationError, json.JSONDecodeError, TypeError):
        raise HTTPException(
            status_code=422,
            detail="Replik zaman çizelgesi geçersiz.",
        ) from None

    if not isinstance(parsed_recording_ids, list) or not all(
        isinstance(item, str) for item in parsed_recording_ids
    ):
        raise HTTPException(status_code=422, detail="Ses kaydı kimlikleri geçersiz.")
    if not 1 <= len(lines) <= 20:
        raise HTTPException(status_code=422, detail="1 ile 20 arasında replik ekleyin.")
    line_ids = [line.id for line in lines]
    if len(set(line_ids)) != len(line_ids):
        raise HTTPException(status_code=422, detail="Replik kimlikleri benzersiz olmalıdır.")
    if parsed_recording_ids != line_ids:
        raise HTTPException(
            status_code=422,
            detail="Her replik için sıralı bir ses kaydı gönderilmelidir.",
        )
    if any(line.end <= line.start for line in lines):
        raise HTTPException(
            status_code=422,
            detail="Replik bitişi başlangıcından sonra olmalıdır.",
        )
    if any(
        line.end > duration + TIMELINE_DURATION_EPSILON_SECONDS for line in lines
    ):
        raise HTTPException(status_code=422, detail=TIMELINE_DURATION_ERROR)

    normalized_lines = [
        line.model_copy(update={"end": min(line.end, duration)}) for line in lines
    ]
    return normalized_lines, parsed_recording_ids


@router.post(
    "/dubbing-ai",
    response_model=JobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_ai_job(
    request: Request,
    payload: ProcessRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models_db.User = Depends(get_current_user)
) -> JobResponse:
    enforce_lip_sync_vip(payload.apply_lip_sync, current_user)
    require_active_vip(current_user)
    ensure_media_tools()
    dubbing_job_service.storage_service.get_video_path(payload.video_id)
    metadata = dubbing_job_service.storage_service.get_video_metadata(payload.video_id)
    await enforce_public_demo_export_limit(request)
    job = await job_registry.create("AI dublaj export sırasına alındı.")

    project_id = None
    if current_user:
        project = models_db.DubbingProject(
            user_id=current_user.id,
            source_type="upload",
            title=metadata.get("original_filename", "AI Dublaj Projesi"),
            duration_seconds=str(metadata.get("duration_seconds", "")),
            status="processing"
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        project_id = project.id

    background_tasks.add_task(run_ai_job_with_db, job.job_id, payload, project_id, "vip")
    return job


@router.post(
    "/dubbing-recordings",
    response_model=JobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_recording_job(
    request: Request,
    background_tasks: BackgroundTasks,
    video_id: str = Form(...),
    timeline: str = Form(...),
    recording_ids: str = Form(...),
    mute_original_audio: bool = Form(True),
    burn_subtitles: bool = Form(True),
    apply_lip_sync: bool = Form(False),
    recordings: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: models_db.User | None = Depends(get_current_user_optional)
) -> JobResponse:
    enforce_lip_sync_vip(apply_lip_sync, current_user)
    ensure_media_tools()
    storage = dubbing_job_service.storage_service
    storage.get_video_path(video_id)
    metadata = storage.get_video_metadata(video_id)
    lines, parsed_recording_ids = validate_recording_timeline(
        timeline,
        recording_ids,
        float(metadata["duration_seconds"]),
    )
    await enforce_public_demo_export_limit(request)
    job = await job_registry.create("Mikrofon kayıtları export sırasına alındı.")

    project_id = None
    vip_enabled = has_active_vip(current_user)
    max_video_width = 1920 if vip_enabled else 1280
    max_video_height = 1080 if vip_enabled else 720
    membership_tier = "vip" if vip_enabled else "free"
    if current_user:
        project = models_db.DubbingProject(
            user_id=current_user.id,
            source_type="upload",
            title=metadata.get("original_filename", "Kayıt Dublaj Projesi"),
            duration_seconds=str(metadata.get("duration_seconds", "")),
            status="processing"
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        project_id = project.id

    recording_paths: list[Path] = []
    try:
        recording_paths = await storage.save_recordings(
            recordings,
            parsed_recording_ids,
            job.job_id,
        )
    except Exception as exc:
        await job_registry.fail(job.job_id, str(exc) or "Ses kayıtları kaydedilemedi.")
        if project_id:
            db_project = db.query(models_db.DubbingProject).filter(models_db.DubbingProject.id == project_id).first()
            if db_project:
                db_project.status = "failed"
                db.commit()
        raise
    background_tasks.add_task(
        run_recording_job_with_db,
        job.job_id,
        video_id,
        lines,
        recording_paths,
        mute_original_audio,
        burn_subtitles,
        project_id,
        max_video_width,
        max_video_height,
        membership_tier,
        apply_lip_sync,
    )
    return job


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str) -> JobResponse:
    job = await job_registry.get(job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export işi bulunamadı.",
        )
    return job
