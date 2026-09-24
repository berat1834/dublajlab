from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path

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

        for directory in self.directories:
            if not directory.is_dir():
                continue
            for path in directory.iterdir():
                if path.name.startswith(".") or not path.is_file():
                    continue
                try:
                    stat = path.stat()
                    if stat.st_mtime >= cutoff:
                        continue
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

