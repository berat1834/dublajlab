from __future__ import annotations

import subprocess
from pathlib import Path

import pytest

from backend.models import DubbingLine
from backend.services.ffmpeg_service import FFmpegService
from backend.services.subtitle_service import SubtitleService


def run_command(command: list[str]) -> None:
    subprocess.run(
        command,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )


def test_real_ffmpeg_timeline_export(tmp_path: Path) -> None:
    service = FFmpegService()
    availability = service.check_availability()
    if not availability.available:
        pytest.skip(availability.message)

    source = tmp_path / "source.mp4"
    first_recording = tmp_path / "line-1.webm"
    second_recording = tmp_path / "line-2.webm"
    subtitles = tmp_path / "timeline.ass"
    output = tmp_path / "output.mp4"

    run_command(
        [
            availability.ffmpeg_path or "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            "color=c=0x202030:s=320x240:r=25:d=4",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=220:duration=4",
            "-shortest",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            str(source),
        ]
    )
    for frequency, destination in (
        (660, first_recording),
        (880, second_recording),
    ):
        run_command(
            [
                availability.ffmpeg_path or "ffmpeg",
                "-y",
                "-f",
                "lavfi",
                "-i",
                f"sine=frequency={frequency}:duration=1",
                "-c:a",
                "libopus",
                str(destination),
            ]
        )

    SubtitleService().create_timeline_ass(
        lines=[
            DubbingLine(id="line-1", start=0.5, end=1.5, text="İlk replik"),
            DubbingLine(id="line-2", start=2.2, end=3.2, text="İkinci replik"),
        ],
        duration_seconds=4,
        output_path=subtitles,
        burn_subtitles=True,
    )
    service.process_recordings(
        video_path=source,
        recording_paths=[first_recording, second_recording],
        timeline=[(0.5, 1.5), (2.2, 3.2)],
        subtitle_path=subtitles,
        output_path=output,
        duration_seconds=4,
        mute_original_audio=False,
        has_original_audio=True,
    )

    output_info = service.probe(output)
    assert output.stat().st_size > 1_000
    assert output_info.has_audio is True
    assert output_info.duration_seconds == pytest.approx(4, abs=0.15)

