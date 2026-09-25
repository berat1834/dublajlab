from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from backend.config import (
    MAX_FILE_SIZE,
    MAX_RECORDING_SIZE,
    MAX_VIDEO_DURATION,
    active_max_file_size_bytes,
    active_max_recording_size_bytes,
    active_max_video_duration_seconds,
)
from backend.main import app
from backend.routers import jobs as jobs_router
from backend.routers import maintenance, video as video_router
from backend.services.cleanup_service import CleanupResult
from backend.services.ffmpeg_service import VideoInfo
from backend.services.rate_limit_service import export_rate_limiter


client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_export_limits() -> Iterator[None]:
    export_rate_limiter.reset()
    yield
    export_rate_limiter.reset()


def _enable_public_demo(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PUBLIC_DEMO_MODE", "true")
    monkeypatch.setenv("DEMO_MAX_FILE_SIZE_MB", "1")
    monkeypatch.setenv("DEMO_MAX_VIDEO_DURATION_SECONDS", "5")
    monkeypatch.setenv("DEMO_MAX_RECORDING_SIZE_MB", "2")
    monkeypatch.setenv("DEMO_MAX_EXPORTS_PER_IP_PER_DAY", "1")
    monkeypatch.setenv("DEMO_MEDIA_TTL_HOURS", "12")
    monkeypatch.setenv("TRUST_PROXY_HEADERS", "false")


def test_demo_policy_endpoint_returns_runtime_limits(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _enable_public_demo(monkeypatch)

    response = client.get("/api/system/demo-policy")

    assert response.status_code == 200
    assert response.json() == {
        "enabled": True,
        "max_file_size_mb": 1,
        "max_video_duration_seconds": 5.0,
        "max_recording_size_mb": 2,
        "max_exports_per_ip_per_day": 1,
        "media_ttl_hours": 12,
        "files_are_temporary": True,
    }


def test_public_demo_rejects_oversized_upload(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _enable_public_demo(monkeypatch)
    monkeypatch.setattr(video_router.ffmpeg_service, "ensure_available", lambda: None)

    response = client.post(
        "/api/video/upload",
        files={"file": ("buyuk.mp4", b"x" * (1024 * 1024 + 1), "video/mp4")},
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "Video en fazla 1 MB olabilir."


def test_public_demo_rejects_video_longer_than_demo_limit(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    _enable_public_demo(monkeypatch)
    video_path = tmp_path / "input.mp4"
    video_path.write_bytes(b"video")

    async def fake_save_upload(_upload):
        return str(uuid4()), video_path, 5, "ornek.mp4"

    monkeypatch.setattr(video_router.ffmpeg_service, "ensure_available", lambda: None)
    monkeypatch.setattr(video_router.storage_service, "save_upload", fake_save_upload)
    monkeypatch.setattr(
        video_router.ffmpeg_service,
        "probe",
        lambda _path: VideoInfo(duration_seconds=5.1, has_audio=False),
    )

    response = client.post(
        "/api/video/upload",
        files={"file": ("ornek.mp4", b"video", "video/mp4")},
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "Video süresi en fazla 5 saniye olabilir."


def test_public_demo_export_limit_returns_429(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    _enable_public_demo(monkeypatch)
    service = jobs_router.dubbing_job_service
    video_path = tmp_path / "input.mp4"
    video_path.write_bytes(b"video")

    async def keep_queued(*_args, **_kwargs) -> None:
        return None

    monkeypatch.setattr(service.ffmpeg_service, "ensure_available", lambda: None)
    monkeypatch.setattr(service.storage_service, "get_video_path", lambda _id: video_path)
    monkeypatch.setattr(
        service.storage_service,
        "get_video_metadata",
        lambda _id: {"duration_seconds": 5.0},
    )
    monkeypatch.setattr(service, "run_ai_job", keep_queued)
    payload = {
        "video_id": str(uuid4()),
        "text": "Merhaba",
        "voice_style": "dramatic",
    }

    accepted = client.post("/api/jobs/dubbing-ai", json=payload)
    blocked = client.post("/api/jobs/dubbing-ai", json=payload)

    assert accepted.status_code == 202
    assert blocked.status_code == 429
    assert "1 export/gün" in blocked.json()["detail"]
    assert int(blocked.headers["Retry-After"]) > 0


def test_public_demo_rejects_oversized_recording(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    _enable_public_demo(monkeypatch)
    service = jobs_router.dubbing_job_service
    video_path = tmp_path / "input.mp4"
    video_path.write_bytes(b"video")
    monkeypatch.setattr(service.ffmpeg_service, "ensure_available", lambda: None)
    monkeypatch.setattr(service.storage_service, "get_video_path", lambda _id: video_path)
    monkeypatch.setattr(
        service.storage_service,
        "get_video_metadata",
        lambda _id: {"duration_seconds": 5.0},
    )

    response = client.post(
        "/api/jobs/dubbing-recordings",
        data={
            "video_id": str(uuid4()),
            "timeline": '[{"id":"line-1","start":0.0,"end":2.0,"text":"Merhaba"}]',
            "recording_ids": '["line-1"]',
        },
        files={
            "recordings": (
                "line-1.webm",
                b"x" * (2 * 1024 * 1024 + 1),
                "audio/webm",
            )
        },
    )

    assert response.status_code == 413
    assert response.json()["detail"] == "Her ses kaydı en fazla 2 MB olabilir."


def test_normal_mode_keeps_existing_media_limits(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("PUBLIC_DEMO_MODE", "false")
    monkeypatch.setenv("DEMO_MAX_FILE_SIZE_MB", "1")
    monkeypatch.setenv("DEMO_MAX_VIDEO_DURATION_SECONDS", "5")
    monkeypatch.setenv("DEMO_MAX_RECORDING_SIZE_MB", "1")

    assert active_max_file_size_bytes() == MAX_FILE_SIZE
    assert active_max_video_duration_seconds() == MAX_VIDEO_DURATION
    assert active_max_recording_size_bytes() == MAX_RECORDING_SIZE


def test_cleanup_uses_demo_ttl_when_query_is_omitted(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _enable_public_demo(monkeypatch)
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.delenv("MAINTENANCE_TOKEN", raising=False)
    monkeypatch.setattr(
        maintenance.cleanup_service,
        "cleanup_old_files",
        lambda hours: CleanupResult(0, 0, hours),
    )

    response = client.post("/api/maintenance/cleanup")

    assert response.status_code == 200
    assert response.json()["older_than_hours"] == 12
