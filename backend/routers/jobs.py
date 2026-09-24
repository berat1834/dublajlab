from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile, status
from pydantic import TypeAdapter, ValidationError

from backend.models import DubbingLine, JobResponse, ProcessRequest
from backend.services.ffmpeg_service import MediaProcessingError
from backend.services.job_service import dubbing_job_service, job_registry


router = APIRouter(prefix="/api/jobs", tags=["jobs"])
timeline_adapter = TypeAdapter(list[DubbingLine])


def ensure_media_tools() -> None:
    try:
        dubbing_job_service.ffmpeg_service.ensure_available()
    except MediaProcessingError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


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
    if any(line.end > duration + 0.05 for line in lines):
        raise HTTPException(status_code=422, detail="Replik zamanları video süresini aşamaz.")
    return lines, parsed_recording_ids


@router.post(
    "/dubbing-ai",
    response_model=JobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_ai_job(
    payload: ProcessRequest,
    background_tasks: BackgroundTasks,
) -> JobResponse:
    ensure_media_tools()
    dubbing_job_service.storage_service.get_video_path(payload.video_id)
    dubbing_job_service.storage_service.get_video_metadata(payload.video_id)
    job = job_registry.create("AI dublaj export sırasına alındı.")
    background_tasks.add_task(dubbing_job_service.run_ai_job, job.job_id, payload)
    return job


@router.post(
    "/dubbing-recordings",
    response_model=JobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_recording_job(
    background_tasks: BackgroundTasks,
    video_id: str = Form(...),
    timeline: str = Form(...),
    recording_ids: str = Form(...),
    mute_original_audio: bool = Form(True),
    burn_subtitles: bool = Form(True),
    recordings: list[UploadFile] = File(...),
) -> JobResponse:
    ensure_media_tools()
    storage = dubbing_job_service.storage_service
    storage.get_video_path(video_id)
    metadata = storage.get_video_metadata(video_id)
    lines, parsed_recording_ids = validate_recording_timeline(
        timeline,
        recording_ids,
        float(metadata["duration_seconds"]),
    )
    job = job_registry.create("Mikrofon kayıtları export sırasına alındı.")
    recording_paths: list[Path] = []
    try:
        recording_paths = await storage.save_recordings(
            recordings,
            parsed_recording_ids,
            job.job_id,
        )
    except Exception as exc:
        job_registry.fail(job.job_id, str(exc) or "Ses kayıtları kaydedilemedi.")
        raise
    background_tasks.add_task(
        dubbing_job_service.run_recording_job,
        job.job_id,
        video_id,
        lines,
        recording_paths,
        mute_original_audio,
        burn_subtitles,
    )
    return job


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str) -> JobResponse:
    job = job_registry.get(job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Export işi bulunamadı.",
        )
    return job
