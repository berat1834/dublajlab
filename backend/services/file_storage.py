from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from fastapi import HTTPException, UploadFile, status

from backend.config import (
    ALLOWED_EXTENSIONS,
    AUDIO_DIR,
    MEGABYTE,
    METADATA_DIR,
    OUTPUT_DIR,
    RECORDING_DIR,
    SUBTITLE_DIR,
    UPLOAD_DIR,
    ALLOWED_RECORDING_EXTENSIONS,
    active_max_file_size_bytes,
    active_max_recording_size_bytes,
    ensure_media_directories,
)


class FileStorageService:
    chunk_size = 1024 * 1024

    def __init__(self) -> None:
        ensure_media_directories()

    @staticmethod
    def _validate_uuid(value: str, label: str) -> str:
        try:
            return str(UUID(value))
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{label} bulunamadı.",
            ) from None

    async def save_upload(self, upload: UploadFile) -> tuple[str, Path, int, str]:
        original_filename = Path(upload.filename or "").name
        extension = Path(original_filename).suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Desteklenmeyen video formatı. MP4, MOV veya WEBM yükleyin.",
            )

        video_id = str(uuid4())
        destination = UPLOAD_DIR / f"{video_id}{extension}"
        max_file_size = active_max_file_size_bytes()
        size = 0
        try:
            with destination.open("wb") as output:
                while chunk := await upload.read(self.chunk_size):
                    size += len(chunk)
                    if size > max_file_size:
                        raise HTTPException(
                            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail=(
                                "Video en fazla "
                                f"{max_file_size // MEGABYTE} MB olabilir."
                            ),
                        )
                    output.write(chunk)
        except Exception:
            destination.unlink(missing_ok=True)
            raise
        finally:
            await upload.close()

        if size == 0:
            destination.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Boş video dosyası yüklenemez.",
            )

        return video_id, destination, size, original_filename

    def save_video_metadata(self, video_id: str, metadata: dict[str, Any]) -> None:
        self._write_metadata("video", video_id, metadata)

    def register_output(self, output_id: str, metadata: dict[str, Any]) -> None:
        self._write_metadata("output", output_id, metadata)

    def _write_metadata(self, kind: str, item_id: str, metadata: dict[str, Any]) -> None:
        path = METADATA_DIR / f"{kind}-{item_id}.json"
        path.write_text(
            json.dumps(metadata, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    def _read_metadata(self, kind: str, item_id: str, label: str) -> dict[str, Any]:
        safe_id = self._validate_uuid(item_id, label)
        path = METADATA_DIR / f"{kind}-{safe_id}.json"
        if not path.is_file():
            raise HTTPException(status_code=404, detail=f"{label} bulunamadı.")
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            raise HTTPException(status_code=404, detail=f"{label} bulunamadı.") from None

    def get_video_path(self, video_id: str) -> Path:
        metadata = self._read_metadata("video", video_id, "Video")
        path = UPLOAD_DIR / str(metadata.get("stored_filename", ""))
        if not path.is_file() or path.parent.resolve() != UPLOAD_DIR.resolve():
            raise HTTPException(status_code=404, detail="Video bulunamadı.")
        return path

    def get_video_metadata(self, video_id: str) -> dict[str, Any]:
        return self._read_metadata("video", video_id, "Video")

    def get_output_path(self, output_id: str) -> Path:
        metadata = self._read_metadata("output", output_id, "Çıktı videosu")
        path = OUTPUT_DIR / str(metadata.get("stored_filename", ""))
        if not path.is_file() or path.parent.resolve() != OUTPUT_DIR.resolve():
            raise HTTPException(status_code=404, detail="Çıktı videosu bulunamadı.")
        return path

    def get_output_metadata(self, output_id: str) -> dict[str, Any]:
        return self._read_metadata("output", output_id, "Çıktı videosu")

    async def save_recordings(
        self,
        uploads: list[UploadFile],
        recording_ids: list[str],
        job_id: str,
    ) -> list[Path]:
        if len(uploads) != len(recording_ids):
            raise HTTPException(
                status_code=400,
                detail="Her replik için bir ses kaydı gönderilmelidir.",
            )

        saved_paths: list[Path] = []
        max_recording_size = active_max_recording_size_bytes()
        try:
            for index, (upload, recording_id) in enumerate(zip(uploads, recording_ids)):
                extension = Path(upload.filename or "recording.webm").suffix.lower()
                if extension not in ALLOWED_RECORDING_EXTENSIONS:
                    raise HTTPException(
                        status_code=415,
                        detail="Desteklenmeyen ses kaydı formatı.",
                    )
                safe_recording_id = re.sub(r"[^a-zA-Z0-9_-]", "", recording_id)
                if safe_recording_id != recording_id or not safe_recording_id:
                    raise HTTPException(status_code=400, detail="Geçersiz replik kimliği.")
                destination = RECORDING_DIR / (
                    f"{job_id}-{index:02d}-{safe_recording_id}{extension}"
                )
                size = 0
                with destination.open("wb") as output:
                    while chunk := await upload.read(self.chunk_size):
                        size += len(chunk)
                        if size > max_recording_size:
                            raise HTTPException(
                                status_code=413,
                                detail=(
                                    "Her ses kaydı en fazla "
                                    f"{max_recording_size // MEGABYTE} MB olabilir."
                                ),
                            )
                        output.write(chunk)
                await upload.close()
                if size == 0:
                    raise HTTPException(status_code=400, detail="Boş ses kaydı gönderilemez.")
                saved_paths.append(destination)
        except Exception:
            for upload in uploads:
                await upload.close()
            for path in saved_paths:
                path.unlink(missing_ok=True)
            # The current destination may have failed before being appended.
            for path in RECORDING_DIR.glob(f"{job_id}-*"):
                path.unlink(missing_ok=True)
            raise
        return saved_paths

    @staticmethod
    def new_output_path() -> tuple[str, Path]:
        output_id = str(uuid4())
        return output_id, OUTPUT_DIR / f"{output_id}.mp4"

    @staticmethod
    def audio_path(job_id: str) -> Path:
        return AUDIO_DIR / f"{job_id}.mp3"

    @staticmethod
    def subtitle_path(job_id: str) -> Path:
        return SUBTITLE_DIR / f"{job_id}.ass"

    @staticmethod
    def safe_download_name(original_filename: str) -> str:
        stem = Path(original_filename).stem
        safe_stem = re.sub(r"[^\w.-]+", "-", stem, flags=re.UNICODE).strip("-.")
        return f"{safe_stem or 'meme'}-dublaj.mp4"
