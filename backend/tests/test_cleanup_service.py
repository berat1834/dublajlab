from __future__ import annotations

import os
import time
from pathlib import Path
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
from uuid import uuid4

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


def test_cleanup_deletes_expired_remote_object(
    tmp_path: Path,
    db_session,
    monkeypatch,
) -> None:
    from backend.models_db import DubbingExport

    output_id = str(uuid4())
    db_session.add(DubbingExport(
        project_id=str(uuid4()),
        output_video_id=output_id,
        retention_expires_at=datetime.now(timezone.utc) - timedelta(hours=1),
    ))
    db_session.commit()

    provider = MagicMock()
    provider.provider_name = "s3"
    import backend.database
    from backend.tests.conftest import TestingSessionLocal
    monkeypatch.setattr(backend.database, "SessionLocal", TestingSessionLocal)
    monkeypatch.setattr(
        "backend.services.storage_provider.get_storage_provider",
        lambda: provider,
    )

    CleanupService((tmp_path,)).cleanup_old_files(older_than_hours=24)

    provider.delete_file.assert_called_once_with(f"{output_id}.mp4")
