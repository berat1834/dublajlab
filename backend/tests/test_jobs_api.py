from __future__ import annotations

import asyncio
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.models import JobStatus, ProcessRequest
from backend.routers import jobs as jobs_router


client = TestClient(app)


@pytest.fixture(autouse=True)
def job_dependencies_are_available(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    service = jobs_router.dubbing_job_service
    video_path = tmp_path / "input.mp4"
    video_path.write_bytes(b"video")
    monkeypatch.setattr(service.ffmpeg_service, "ensure_available", lambda: None)
    monkeypatch.setattr(service.storage_service, "get_video_path", lambda _id: video_path)
    monkeypatch.setattr(
        service.storage_service,
        "get_video_metadata",
        lambda _id: {
            "duration_seconds": 6.0,
            "has_audio": True,
            "original_filename": "ornek.mp4",
        },
    )


def test_ai_job_is_created_and_can_be_polled(monkeypatch: pytest.MonkeyPatch) -> None:
    async def keep_queued(*_args, **_kwargs) -> None:
        return None

    monkeypatch.setattr(
        jobs_router.dubbing_job_service,
        "run_ai_job",
        keep_queued,
    )
    response = client.post(
        "/api/jobs/dubbing-ai",
        json={
            "video_id": str(uuid4()),
            "text": "Merhaba dünya",
            "voice_style": "dramatic",
            "mute_original_audio": True,
            "burn_subtitles": True,
        },
    )

    assert response.status_code == 202
    created = response.json()
    assert created["status"] == "queued"
    assert created["progress"] == 0

    jobs_router.job_registry.update(
        created["job_id"],
        status=JobStatus.PROCESSING,
        progress=55,
        message="Video birleştiriliyor.",
    )
    polled = client.get(f"/api/jobs/{created['job_id']}")

    assert polled.status_code == 200
    assert polled.json()["status"] == "processing"
    assert polled.json()["progress"] == 55
    assert polled.json()["message"] == "Video birleştiriliyor."


def test_recording_job_is_created_after_files_are_saved(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    saved_recording = tmp_path / "line-1.webm"

    async def fake_save_recordings(_uploads, _ids, _job_id):
        saved_recording.write_bytes(b"voice")
        return [saved_recording]

    async def keep_queued(*_args, **_kwargs) -> None:
        return None

    monkeypatch.setattr(
        jobs_router.dubbing_job_service.storage_service,
        "save_recordings",
        fake_save_recordings,
    )
    monkeypatch.setattr(
        jobs_router.dubbing_job_service,
        "run_recording_job",
        keep_queued,
    )

    response = client.post(
        "/api/jobs/dubbing-recordings",
        data={
            "video_id": str(uuid4()),
            "timeline": '[{"id":"line-1","start":0.5,"end":2.0,"text":"Merhaba"}]',
            "recording_ids": '["line-1"]',
            "mute_original_audio": "true",
            "burn_subtitles": "true",
        },
        files={"recordings": ("line-1.webm", b"voice", "audio/webm")},
    )

    assert response.status_code == 202
    assert response.json()["status"] == "queued"
    assert saved_recording.is_file()


def test_completed_job_returns_download_url() -> None:
    job = jobs_router.job_registry.create()
    completed = jobs_router.job_registry.complete(job.job_id, str(uuid4()))

    response = client.get(f"/api/jobs/{job.job_id}")

    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["progress"] == 100
    assert response.json()["output_video_id"] == completed.output_video_id
    assert response.json()["download_url"].startswith("/api/video/download/")


def test_failed_job_returns_error() -> None:
    job = jobs_router.job_registry.create()
    jobs_router.job_registry.fail(job.job_id, "FFmpeg işlemi başarısız.")

    response = client.get(f"/api/jobs/{job.job_id}")

    assert response.status_code == 200
    assert response.json()["status"] == "failed"
    assert response.json()["error"] == "FFmpeg işlemi başarısız."


def test_unknown_job_returns_turkish_404() -> None:
    response = client.get(f"/api/jobs/{uuid4()}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Export işi bulunamadı."


def test_ai_worker_completes_job(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    service = jobs_router.dubbing_job_service
    job = jobs_router.job_registry.create()
    audio_path = tmp_path / "voice.mp3"
    subtitle_path = tmp_path / "subtitle.ass"
    output_path = tmp_path / "output.mp4"
    output_id = str(uuid4())

    async def fake_tts(_text, _style, destination):
        destination.write_bytes(b"audio")

    def fake_subtitle(**kwargs):
        kwargs["output_path"].write_text("subtitle", encoding="utf-8")

    def fake_process(*_args):
        output_path.write_bytes(b"mp4")
        return output_path

    monkeypatch.setattr(service.storage_service, "audio_path", lambda _id: audio_path)
    monkeypatch.setattr(service.storage_service, "subtitle_path", lambda _id: subtitle_path)
    monkeypatch.setattr(
        service.storage_service,
        "new_output_path",
        lambda: (output_id, output_path),
    )
    monkeypatch.setattr(service.storage_service, "register_output", lambda *_: None)
    monkeypatch.setattr(service.tts_service, "generate_voiceover", fake_tts)
    monkeypatch.setattr(service.subtitle_service, "create_ass", fake_subtitle)
    monkeypatch.setattr(service.ffmpeg_service, "process_video", fake_process)

    asyncio.run(
        service.run_ai_job(
            job.job_id,
            ProcessRequest(
                video_id=str(uuid4()),
                text="Merhaba",
                voice_style="dramatic",
            ),
        )
    )

    completed = jobs_router.job_registry.get(job.job_id)
    assert completed is not None
    assert completed.status == JobStatus.COMPLETED
    assert completed.progress == 100
    assert completed.output_video_id == output_id
    assert not audio_path.exists()
    assert not subtitle_path.exists()


def test_ai_worker_marks_job_failed(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    service = jobs_router.dubbing_job_service
    job = jobs_router.job_registry.create()
    audio_path = tmp_path / "voice.mp3"
    subtitle_path = tmp_path / "subtitle.ass"

    async def failing_tts(*_args):
        raise RuntimeError("TTS servisi kullanılamıyor.")

    monkeypatch.setattr(service.storage_service, "audio_path", lambda _id: audio_path)
    monkeypatch.setattr(service.storage_service, "subtitle_path", lambda _id: subtitle_path)
    monkeypatch.setattr(service.tts_service, "generate_voiceover", failing_tts)

    asyncio.run(
        service.run_ai_job(
            job.job_id,
            ProcessRequest(
                video_id=str(uuid4()),
                text="Merhaba",
                voice_style="dramatic",
            ),
        )
    )

    failed = jobs_router.job_registry.get(job.job_id)
    assert failed is not None
    assert failed.status == JobStatus.FAILED
    assert failed.error == "TTS servisi kullanılamıyor."
