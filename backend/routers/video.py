from __future__ import annotations

import asyncio
import json
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import TypeAdapter, ValidationError

from backend.config import MAX_VIDEO_DURATION
from backend.models import DubbingLine, ProcessRequest, ProcessResponse, UploadResponse
from backend.services.ffmpeg_service import FFmpegService, MediaProcessingError
from backend.services.file_storage import FileStorageService
from backend.services.subtitle_service import SubtitleService
from backend.services.tts_service import TTSService


router = APIRouter(prefix="/api/video", tags=["video"])
storage_service = FileStorageService()
ffmpeg_service = FFmpegService()
tts_service = TTSService()
subtitle_service = SubtitleService()
timeline_adapter = TypeAdapter(list[DubbingLine])


def ensure_media_tools() -> None:
    try:
        ffmpeg_service.ensure_available()
    except MediaProcessingError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(file: UploadFile = File(...)) -> UploadResponse:
    ensure_media_tools()
    video_id, path, size, original_filename = await storage_service.save_upload(file)
    try:
        info = await asyncio.to_thread(ffmpeg_service.probe, path)
        if info.duration_seconds > MAX_VIDEO_DURATION:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Video süresi en fazla 60 saniye olabilir.",
            )
        storage_service.save_video_metadata(
            video_id,
            {
                "stored_filename": path.name,
                "original_filename": original_filename,
                "duration_seconds": info.duration_seconds,
                "size_bytes": size,
                "has_audio": info.has_audio,
            },
        )
    except HTTPException:
        path.unlink(missing_ok=True)
        raise
    except MediaProcessingError as exc:
        path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return UploadResponse(
        video_id=video_id,
        original_filename=original_filename,
        duration_seconds=round(info.duration_seconds, 2),
        size_bytes=size,
        preview_url=f"/api/video/preview/{video_id}",
    )


@router.post("/process", response_model=ProcessResponse)
async def process_video(payload: ProcessRequest) -> ProcessResponse:
    ensure_media_tools()
    video_path = storage_service.get_video_path(payload.video_id)
    metadata = storage_service.get_video_metadata(payload.video_id)
    job_id = str(uuid4())
    audio_path = storage_service.audio_path(job_id)
    subtitle_path = storage_service.subtitle_path(job_id)
    output_id, output_path = storage_service.new_output_path()

    try:
        await tts_service.generate_voiceover(
            payload.text,
            payload.voice_style,
            audio_path,
        )
        subtitle_service.create_ass(
            text=payload.text,
            duration_seconds=float(metadata["duration_seconds"]),
            output_path=subtitle_path,
            burn_subtitles=payload.burn_subtitles,
        )
        await asyncio.to_thread(
            ffmpeg_service.process_video,
            video_path,
            audio_path,
            subtitle_path,
            output_path,
            float(metadata["duration_seconds"]),
            payload.mute_original_audio,
            bool(metadata.get("has_audio", False)),
        )
        storage_service.register_output(
            output_id,
            {
                "stored_filename": output_path.name,
                "source_video_id": payload.video_id,
                "original_filename": metadata["original_filename"],
                "job_id": job_id,
            },
        )
    except (MediaProcessingError, RuntimeError) as exc:
        output_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        audio_path.unlink(missing_ok=True)
        subtitle_path.unlink(missing_ok=True)

    return ProcessResponse(
        job_id=job_id,
        status="completed",
        output_video_id=output_id,
        download_url=f"/api/video/download/{output_id}",
    )


@router.post("/process-recordings", response_model=ProcessResponse)
async def process_recordings(
    video_id: str = Form(...),
    timeline: str = Form(...),
    recording_ids: str = Form(...),
    mute_original_audio: bool = Form(True),
    burn_subtitles: bool = Form(True),
    recordings: list[UploadFile] = File(...),
) -> ProcessResponse:
    ensure_media_tools()
    video_path = storage_service.get_video_path(video_id)
    metadata = storage_service.get_video_metadata(video_id)
    duration = float(metadata["duration_seconds"])

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
    for line in lines:
        if line.end <= line.start:
            raise HTTPException(
                status_code=422,
                detail=f"'{line.text}' repliğinin bitişi başlangıcından sonra olmalıdır.",
            )
        if line.end > duration + 0.05:
            raise HTTPException(
                status_code=422,
                detail="Replik zamanları video süresini aşamaz.",
            )

    job_id = str(uuid4())
    subtitle_path = storage_service.subtitle_path(job_id)
    output_id, output_path = storage_service.new_output_path()
    recording_paths: list[Path] = []
    try:
        recording_paths = await storage_service.save_recordings(
            recordings,
            parsed_recording_ids,
            job_id,
        )
        subtitle_service.create_timeline_ass(
            lines=lines,
            duration_seconds=duration,
            output_path=subtitle_path,
            burn_subtitles=burn_subtitles,
        )
        await asyncio.to_thread(
            ffmpeg_service.process_recordings,
            video_path,
            recording_paths,
            [(line.start, line.end) for line in lines],
            subtitle_path,
            output_path,
            duration,
            mute_original_audio,
            bool(metadata.get("has_audio", False)),
        )
        storage_service.register_output(
            output_id,
            {
                "stored_filename": output_path.name,
                "source_video_id": video_id,
                "original_filename": metadata["original_filename"],
                "job_id": job_id,
                "mode": "user_voice",
                "timeline": [line.model_dump() for line in lines],
            },
        )
    except HTTPException:
        output_path.unlink(missing_ok=True)
        raise
    except MediaProcessingError as exc:
        output_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        subtitle_path.unlink(missing_ok=True)
        for recording_path in recording_paths:
            recording_path.unlink(missing_ok=True)

    return ProcessResponse(
        job_id=job_id,
        status="completed",
        output_video_id=output_id,
        download_url=f"/api/video/download/{output_id}",
    )


@router.get("/preview/{video_id}")
async def preview_video(video_id: str) -> FileResponse:
    path = storage_service.get_video_path(video_id)
    return FileResponse(path, media_type=_media_type(path), content_disposition_type="inline")


@router.get("/download/{output_video_id}")
async def download_video(output_video_id: str) -> FileResponse:
    path = storage_service.get_output_path(output_video_id)
    metadata = storage_service.get_output_metadata(output_video_id)
    filename = storage_service.safe_download_name(metadata.get("original_filename", "meme"))
    return FileResponse(path, media_type="video/mp4", filename=filename)


def _media_type(path: Path) -> str:
    return {
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".webm": "video/webm",
    }.get(path.suffix.lower(), "application/octet-stream")
