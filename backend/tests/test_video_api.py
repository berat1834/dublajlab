from __future__ import annotations

from pathlib import Path
from subprocess import CompletedProcess
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.routers import video as video_router
from backend.services.ffmpeg_service import FFmpegService, VideoInfo


client = TestClient(app)


@pytest.fixture(autouse=True)
def media_tools_are_available(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(video_router.ffmpeg_service, "ensure_available", lambda: None)


def test_health_endpoint() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "app": "DublajLab",
        "version": "0.2.0",
    }


def test_supported_video_is_accepted(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    video_id = str(uuid4())
    video_path = tmp_path / f"{video_id}.mp4"
    video_path.write_bytes(b"fake-video")

    async def fake_save_upload(_upload):
        return video_id, video_path, video_path.stat().st_size, "ornek.mp4"

    monkeypatch.setattr(video_router.storage_service, "save_upload", fake_save_upload)
    monkeypatch.setattr(
        video_router.ffmpeg_service,
        "probe",
        lambda _path: VideoInfo(duration_seconds=12.4, has_audio=True),
    )
    monkeypatch.setattr(video_router.storage_service, "save_video_metadata", lambda *_: None)

    response = client.post(
        "/api/video/upload",
        files={"file": ("ornek.mp4", b"fake-video", "video/mp4")},
    )

    assert response.status_code == 201
    assert response.json()["video_id"] == video_id
    assert response.json()["duration_seconds"] == 12.4


def test_unsupported_video_format_is_rejected() -> None:
    response = client.post(
        "/api/video/upload",
        files={"file": ("video.avi", b"fake-video", "video/x-msvideo")},
    )

    assert response.status_code == 415
    assert "Desteklenmeyen" in response.json()["detail"]


def test_missing_ffmpeg_returns_turkish_service_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def unavailable():
        from backend.services.ffmpeg_service import MediaProcessingError

        raise MediaProcessingError("FFmpeg bulunamadı. PATH ayarını kontrol edin.")

    monkeypatch.setattr(video_router.ffmpeg_service, "ensure_available", unavailable)

    response = client.post(
        "/api/video/upload",
        files={"file": ("ornek.mp4", b"fake-video", "video/mp4")},
    )

    assert response.status_code == 503
    assert response.json()["detail"] == "FFmpeg bulunamadı. PATH ayarını kontrol edin."


def test_ffmpeg_availability_reports_missing_tools(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("backend.services.ffmpeg_service.shutil.which", lambda _: None)

    result = FFmpegService().check_availability()

    assert result.available is False
    assert "bulunamadı" in result.message


@pytest.mark.parametrize("text", ["", "   "])
def test_blank_text_is_rejected(text: str) -> None:
    response = client.post(
        "/api/video/process",
        json={
            "video_id": str(uuid4()),
            "text": text,
            "voice_style": "dramatic",
        },
    )

    assert response.status_code == 422
    assert response.json()["errors"][0]["message"] == "Dublaj metni boş bırakılamaz."


def test_text_longer_than_500_characters_is_rejected() -> None:
    response = client.post(
        "/api/video/process",
        json={
            "video_id": str(uuid4()),
            "text": "a" * 501,
            "voice_style": "dramatic",
        },
    )

    assert response.status_code == 422
    assert "500" in response.json()["errors"][0]["message"]


def test_invalid_voice_style_is_rejected() -> None:
    response = client.post(
        "/api/video/process",
        json={
            "video_id": str(uuid4()),
            "text": "Merhaba dünya",
            "voice_style": "celebrity",
        },
    )

    assert response.status_code == 422
    assert response.json()["errors"][0]["message"] == "Geçersiz ses stili seçildi."


def test_invalid_video_id_returns_not_found() -> None:
    response = client.post(
        "/api/video/process",
        json={
            "video_id": str(uuid4()),
            "text": "Merhaba dünya",
            "voice_style": "announcer",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Video bulunamadı."


def test_ffmpeg_command_can_be_tested_with_mock(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    service = FFmpegService(ffmpeg_binary="ffmpeg-test")
    captured: dict[str, list[str]] = {}

    def fake_run(command, **_kwargs):
        captured["command"] = command
        return CompletedProcess(command, 0, stdout="", stderr="")

    monkeypatch.setattr("backend.services.ffmpeg_service.subprocess.run", fake_run)
    output = tmp_path / "output.mp4"
    output.write_bytes(b"ready")

    service.process_video(
        video_path=tmp_path / "input.mp4",
        audio_path=tmp_path / "voice.mp3",
        subtitle_path=tmp_path / "caption.ass",
        output_path=output,
        duration_seconds=8.5,
        mute_original_audio=True,
        has_original_audio=True,
    )

    assert captured["command"][0] == "ffmpeg-test"
    assert "libx264" in captured["command"]
    filters = captured["command"][captured["command"].index("-filter_complex") + 1]
    assert "[1:a]apad[aout]" in filters


def test_recording_ffmpeg_command_places_clips_on_timeline(tmp_path: Path) -> None:
    service = FFmpegService(ffmpeg_binary="ffmpeg-test")

    command = service.build_recording_process_command(
        video_path=tmp_path / "input.mp4",
        recording_paths=[tmp_path / "one.webm", tmp_path / "two.webm"],
        timeline=[(0.5, 2.0), (3.25, 5.0)],
        subtitle_path=tmp_path / "timeline.ass",
        output_path=tmp_path / "output.mp4",
        duration_seconds=6.0,
        mute_original_audio=False,
        has_original_audio=True,
    )

    filters = command[command.index("-filter_complex") + 1]
    assert "adelay=500:all=1[voice1]" in filters
    assert "adelay=3250:all=1[voice2]" in filters
    assert "volume=0.20[base]" in filters
    assert "amix=inputs=3" in filters


def test_recordings_endpoint_processes_timeline(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    video_id = str(uuid4())
    output_id = str(uuid4())
    video_path = tmp_path / "input.mp4"
    output_path = tmp_path / "output.mp4"
    subtitle_path = tmp_path / "timeline.ass"
    recording_path = tmp_path / "line-1.webm"
    video_path.write_bytes(b"video")

    monkeypatch.setattr(video_router.storage_service, "get_video_path", lambda _: video_path)
    monkeypatch.setattr(
        video_router.storage_service,
        "get_video_metadata",
        lambda _: {
            "duration_seconds": 5.0,
            "has_audio": True,
            "original_filename": "ornek.mp4",
        },
    )
    monkeypatch.setattr(video_router.storage_service, "subtitle_path", lambda _: subtitle_path)
    monkeypatch.setattr(
        video_router.storage_service,
        "new_output_path",
        lambda: (output_id, output_path),
    )

    async def fake_save_recordings(_uploads, _ids, _job_id):
        recording_path.write_bytes(b"voice")
        return [recording_path]

    monkeypatch.setattr(
        video_router.storage_service,
        "save_recordings",
        fake_save_recordings,
    )
    monkeypatch.setattr(video_router.storage_service, "register_output", lambda *_: None)

    def fake_process(*_args):
        output_path.write_bytes(b"mp4")
        return output_path

    monkeypatch.setattr(video_router.ffmpeg_service, "process_recordings", fake_process)

    response = client.post(
        "/api/video/process-recordings",
        data={
            "video_id": video_id,
            "timeline": '[{"id":"line-1","start":0.5,"end":2.0,"text":"Merhaba"}]',
            "recording_ids": '["line-1"]',
            "mute_original_audio": "true",
            "burn_subtitles": "true",
        },
        files={"recordings": ("line-1.webm", b"voice", "audio/webm")},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["output_video_id"] == output_id


def test_recording_timeline_cannot_exceed_video(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    video_path = tmp_path / "input.mp4"
    video_path.write_bytes(b"video")
    monkeypatch.setattr(video_router.storage_service, "get_video_path", lambda _: video_path)
    monkeypatch.setattr(
        video_router.storage_service,
        "get_video_metadata",
        lambda _: {
            "duration_seconds": 2.0,
            "has_audio": False,
            "original_filename": "ornek.mp4",
        },
    )

    response = client.post(
        "/api/video/process-recordings",
        data={
            "video_id": str(uuid4()),
            "timeline": '[{"id":"line-1","start":1.0,"end":3.0,"text":"Uzun"}]',
            "recording_ids": '["line-1"]',
        },
        files={"recordings": ("line-1.webm", b"voice", "audio/webm")},
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "Replik zamanları video süresini aşamaz."
