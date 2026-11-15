from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path
from datetime import datetime, timezone

from backend.config import (
    AUDIO_DIR,
    METADATA_DIR,
    OUTPUT_DIR,
    RECORDING_DIR,
    SUBTITLE_DIR,
    TEMP_DIR,
    UPLOAD_DIR,
    ensure_media_directories,
)


@dataclass(frozen=True)
class CleanupResult:
    deleted_files: int
    freed_bytes: int
    older_than_hours: int

    def as_dict(self) -> dict[str, int]:
        return {
            "deleted_files": self.deleted_files,
            "freed_bytes": self.freed_bytes,
            "older_than_hours": self.older_than_hours,
        }


class CleanupService:
    """Deletes only old files from known DublajLab runtime directories."""

    def __init__(self, directories: tuple[Path, ...] | None = None) -> None:
        self.directories = directories or (
            UPLOAD_DIR,
            OUTPUT_DIR,
            TEMP_DIR,
            AUDIO_DIR,
            SUBTITLE_DIR,
            RECORDING_DIR,
            METADATA_DIR,
        )

    def cleanup_old_files(
        self,
        older_than_hours: int = 24,
        *,
        now: float | None = None,
    ) -> CleanupResult:
        if older_than_hours < 1:
            raise ValueError("Temizlik süresi en az 1 saat olmalıdır.")

        ensure_media_directories()
        cutoff = (now if now is not None else time.time()) - older_than_hours * 3600
        deleted_files = 0
        freed_bytes = 0

        # Protect active exports based on retention_expires_at
        from backend.database import SessionLocal
        import backend.models_db as models_db

        db = SessionLocal()
        try:
            now_dt = datetime.now(timezone.utc)
            active_exports = db.query(models_db.DubbingExport.output_video_id).filter(
                (models_db.DubbingExport.retention_expires_at > now_dt) |
                (models_db.DubbingExport.retention_expires_at.is_(None))
            ).all()
            active_output_ids = {e[0] for e in active_exports if e[0]}
            expired_exports = db.query(models_db.DubbingExport.output_video_id).filter(
                models_db.DubbingExport.retention_expires_at <= now_dt
            ).all()
            expired_output_ids = {e[0] for e in expired_exports if e[0]}
        finally:
            db.close()

        # Object storage may outlive the local Railway volume. Delete expired
        # remote objects even when their local mirror is already gone.
        from backend.services.storage_provider import get_storage_provider

        provider = get_storage_provider()
        if provider.provider_name == "s3":
            for output_id in expired_output_ids:
                if not provider.delete_file(f"{output_id}.mp4"):
                    raise RuntimeError(
                        f"Expired export could not be removed from object storage: {output_id}"
                    )

        for directory in self.directories:
            if not directory.is_dir():
                continue
            for path in directory.iterdir():
                if path.name.startswith(".") or not path.is_file():
                    continue

                is_output_directory = directory.resolve() == OUTPUT_DIR.resolve()
                is_metadata_directory = directory.resolve() == METADATA_DIR.resolve()
                if is_output_directory:
                    file_id = path.stem
                    if file_id in active_output_ids:
                        continue
                elif is_metadata_directory and path.name.startswith("output-"):
                    file_id = path.stem.replace("output-", "")
                    if file_id in active_output_ids:
                        continue

                try:
                    stat = path.stat()
                    if stat.st_mtime >= cutoff:
                        continue
                    if is_output_directory and provider.provider_name == "s3":
                        file_id = path.stem
                        if file_id not in expired_output_ids and not provider.delete_file(path.name):
                            raise RuntimeError(
                                f"Old output could not be removed from object storage: {path.name}"
                            )
                    path.unlink()
                    deleted_files += 1
                    freed_bytes += stat.st_size
                except FileNotFoundError:
                    # Another request may have removed the same temporary file.
                    continue

        return CleanupResult(
            deleted_files=deleted_files,
            freed_bytes=freed_bytes,
            older_than_hours=older_than_hours,
        )
