import asyncio
from pathlib import Path
from unittest.mock import MagicMock
from uuid import uuid4

from backend.models import DubbingLine, JobStatus
from backend.services.job_service import DubbingJobService, JobRegistry
from backend.services.storage_provider import STORAGE_UPLOAD_ERROR


def test_recording_job_fails_visibly_when_object_upload_fails(
    monkeypatch,
    tmp_path: Path,
) -> None:
    registry = JobRegistry()
    storage = MagicMock()
    video_path = tmp_path / "input.mp4"
    video_path.write_bytes(b"video")
    output_id = str(uuid4())
    output_path = tmp_path / f"{output_id}.mp4"
    subtitle_path = tmp_path / "subtitle.ass"
    recording_path = tmp_path / "line.webm"
    recording_path.write_bytes(b"voice")

    storage.get_video_path.return_value = video_path
    storage.get_video_metadata.return_value = {
        "duration_seconds": 2.0,
        "has_audio": False,
        "original_filename": "test.mp4",
    }
    storage.subtitle_path.return_value = subtitle_path
    storage.lip_sync_video_path.return_value = tmp_path / "lip.mp4"
    storage.lip_sync_audio_path.return_value = tmp_path / "lip.wav"
    storage.new_output_path.return_value = (output_id, output_path)

    ffmpeg = MagicMock()
    ffmpeg.process_recordings.side_effect = lambda *_args, **_kwargs: output_path.write_bytes(b"mp4")
    subtitle = MagicMock()
    provider = MagicMock()
    provider.upload_file.return_value = False
    monkeypatch.setattr(
        "backend.services.storage_provider.get_storage_provider",
        lambda: provider,
    )

    service = DubbingJobService(
        registry=registry,
        storage_service=storage,
        ffmpeg_service=ffmpeg,
        subtitle_service=subtitle,
    )

    async def run_job():
        job = await registry.create()
        await service.run_recording_job(
            job.job_id,
            str(uuid4()),
            [DubbingLine(id="line-1", start=0, end=1, text="Merhaba")],
            [recording_path],
            True,
            True,
        )
        return await registry.get(job.job_id)

    result = asyncio.run(run_job())

    assert result is not None
    assert result.status == JobStatus.FAILED
    assert result.error == STORAGE_UPLOAD_ERROR
    assert output_path.exists() is False
    storage.register_output.assert_not_called()
