from __future__ import annotations

import os
import time
from pathlib import Path

import pytest

from backend.services.cleanup_service import CleanupService


def test_cleanup_removes_only_old_runtime_files(tmp_path: Path) -> None:
    uploads = tmp_path / "uploads"
    outputs = tmp_path / "outputs"
    uploads.mkdir()
    outputs.mkdir()
    old_file = uploads / "old.mp4"
    fresh_file = outputs / "fresh.mp4"
    hidden_file = uploads / ".gitkeep"
    old_file.write_bytes(b"old-video")
    fresh_file.write_bytes(b"fresh-video")
    hidden_file.write_bytes(b"")
    now = time.time()
    os.utime(old_file, (now - 48 * 3600, now - 48 * 3600))

    result = CleanupService((uploads, outputs)).cleanup_old_files(
        older_than_hours=24,
        now=now,
    )

    assert result.deleted_files == 1
    assert result.freed_bytes == len(b"old-video")
    assert not old_file.exists()
    assert fresh_file.exists()
    assert hidden_file.exists()


def test_cleanup_rejects_less_than_one_hour(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="en az 1 saat"):
        CleanupService((tmp_path,)).cleanup_old_files(older_than_hours=0)

