from __future__ import annotations

import asyncio
from pathlib import Path
from threading import RLock
from uuid import uuid4

from backend.models import DubbingLine, JobResponse, JobStatus, ProcessRequest
from backend.services.ffmpeg_service import FFmpegService
from backend.services.file_storage import FileStorageService
from backend.services.subtitle_service import SubtitleService
from backend.services.tts_service import TTSService


class JobRegistry:
    """Thread-safe in-memory registry replaceable by a persistent queue later."""

    def __init__(self) -> None:
        self._jobs: dict[str, JobResponse] = {}
        self._lock = RLock()

    def create(self, message: str = "Export sırasına alındı.") -> JobResponse:
        job = JobResponse(
            job_id=str(uuid4()),
            status=JobStatus.QUEUED,
            progress=0,
            message=message,
        )
        with self._lock:
            self._jobs[job.job_id] = job
        return job.model_copy(deep=True)

    def get(self, job_id: str) -> JobResponse | None:
        with self._lock:
            job = self._jobs.get(job_id)
            return job.model_copy(deep=True) if job else None

    def update(
        self,
        job_id: str,
        *,
        status: JobStatus | None = None,
        progress: int | None = None,
        message: str | None = None,
    ) -> JobResponse:
        with self._lock:
            current = self._jobs[job_id]
            updated = current.model_copy(
                update={
                    "status": status if status is not None else current.status,
                    "progress": progress if progress is not None else current.progress,
                    "message": message if message is not None else current.message,
                }
            )
            self._jobs[job_id] = updated
            return updated.model_copy(deep=True)

    def complete(self, job_id: str, output_video_id: str) -> JobResponse:
        with self._lock:
            current = self._jobs[job_id]
            updated = current.model_copy(
                update={
                    "status": JobStatus.COMPLETED,
                    "progress": 100,
                    "message": "Dublaj videosu hazır.",
                    "output_video_id": output_video_id,
                    "download_url": f"/api/video/download/{output_video_id}",
                    "error": None,
                }
            )
            self._jobs[job_id] = updated
            return updated.model_copy(deep=True)

    def fail(self, job_id: str, error: str) -> JobResponse:
        with self._lock:
            current = self._jobs[job_id]
            updated = current.model_copy(
                update={
                    "status": JobStatus.FAILED,
                    "message": "Export tamamlanamadı.",
                    "error": error,
                }
            )
            self._jobs[job_id] = updated
            return updated.model_copy(deep=True)


class DubbingJobService:
    def __init__(
        self,
        registry: JobRegistry,
        storage_service: FileStorageService | None = None,
        ffmpeg_service: FFmpegService | None = None,
        tts_service: TTSService | None = None,
        subtitle_service: SubtitleService | None = None,
    ) -> None:
        self.registry = registry
        self.storage_service = storage_service or FileStorageService()
        self.ffmpeg_service = ffmpeg_service or FFmpegService()
        self.tts_service = tts_service or TTSService()
        self.subtitle_service = subtitle_service or SubtitleService()

    async def run_ai_job(self, job_id: str, payload: ProcessRequest) -> None:
        output_path: Path | None = None
        audio_path = self.storage_service.audio_path(job_id)
        subtitle_path = self.storage_service.subtitle_path(job_id)
        try:
            self.registry.update(
                job_id,
                status=JobStatus.PROCESSING,
                progress=10,
                message="AI ses hazırlanıyor.",
            )
            video_path = self.storage_service.get_video_path(payload.video_id)
            metadata = self.storage_service.get_video_metadata(payload.video_id)
            await self.tts_service.generate_voiceover(
                payload.text,
                payload.voice_style,
                audio_path,
            )
            self.registry.update(job_id, progress=35, message="Altyazı hazırlanıyor.")
            self.subtitle_service.create_ass(
                text=payload.text,
                duration_seconds=float(metadata["duration_seconds"]),
                output_path=subtitle_path,
                burn_subtitles=payload.burn_subtitles,
            )
            output_id, output_path = self.storage_service.new_output_path()
            self.registry.update(
                job_id,
                progress=55,
                message="Video, ses ve altyazı birleştiriliyor.",
            )
            await asyncio.to_thread(
                self.ffmpeg_service.process_video,
                video_path,
                audio_path,
                subtitle_path,
                output_path,
                float(metadata["duration_seconds"]),
                payload.mute_original_audio,
                bool(metadata.get("has_audio", False)),
            )
            self.registry.update(job_id, progress=90, message="MP4 çıktısı kaydediliyor.")
            self.storage_service.register_output(
                output_id,
                {
                    "stored_filename": output_path.name,
                    "source_video_id": payload.video_id,
                    "original_filename": metadata["original_filename"],
                    "job_id": job_id,
                    "mode": "ai_voice",
                },
            )
            self.registry.complete(job_id, output_id)
        except Exception as exc:
            if output_path:
                output_path.unlink(missing_ok=True)
            self.registry.fail(job_id, str(exc) or "Video işlenirken bilinmeyen hata oluştu.")
        finally:
            audio_path.unlink(missing_ok=True)
            subtitle_path.unlink(missing_ok=True)

    async def run_recording_job(
        self,
        job_id: str,
        video_id: str,
        lines: list[DubbingLine],
        recording_paths: list[Path],
        mute_original_audio: bool,
        burn_subtitles: bool,
    ) -> None:
        output_path: Path | None = None
        subtitle_path = self.storage_service.subtitle_path(job_id)
        try:
            self.registry.update(
                job_id,
                status=JobStatus.PROCESSING,
                progress=15,
                message="Ses kayıtları doğrulandı.",
            )
            video_path = self.storage_service.get_video_path(video_id)
            metadata = self.storage_service.get_video_metadata(video_id)
            duration = float(metadata["duration_seconds"])
            self.subtitle_service.create_timeline_ass(
                lines=lines,
                duration_seconds=duration,
                output_path=subtitle_path,
                burn_subtitles=burn_subtitles,
            )
            self.registry.update(job_id, progress=35, message="Altyazılar hazırlandı.")
            output_id, output_path = self.storage_service.new_output_path()
            self.registry.update(
                job_id,
                progress=55,
                message="Kayıtlar zaman çizelgesine yerleştiriliyor.",
            )
            await asyncio.to_thread(
                self.ffmpeg_service.process_recordings,
                video_path,
                recording_paths,
                [(line.start, line.end) for line in lines],
                subtitle_path,
                output_path,
                duration,
                mute_original_audio,
                bool(metadata.get("has_audio", False)),
            )
            self.registry.update(job_id, progress=90, message="MP4 çıktısı kaydediliyor.")
            self.storage_service.register_output(
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
            self.registry.complete(job_id, output_id)
        except Exception as exc:
            if output_path:
                output_path.unlink(missing_ok=True)
            self.registry.fail(job_id, str(exc) or "Video işlenirken bilinmeyen hata oluştu.")
        finally:
            subtitle_path.unlink(missing_ok=True)
            for recording_path in recording_paths:
                recording_path.unlink(missing_ok=True)


job_registry = JobRegistry()
dubbing_job_service = DubbingJobService(job_registry)
