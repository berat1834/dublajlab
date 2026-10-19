from pathlib import Path

from backend.models import DubbingLine
from backend.services.subtitle_service import SubtitleService


def test_timeline_subtitles_only_cover_their_line_intervals(tmp_path: Path) -> None:
    destination = tmp_path / "timeline.ass"

    SubtitleService().create_timeline_ass(
        lines=[
            DubbingLine(id="line-1", start=0.5, end=1.5, text="İlk replik"),
            DubbingLine(id="line-2", start=3.0, end=4.25, text="İkinci replik"),
        ],
        duration_seconds=6,
        output_path=destination,
        burn_subtitles=True,
    )

    document = destination.read_text(encoding="utf-8-sig")

    assert "Dialogue: 0,0:00:00.50,0:00:01.50,Subtitle" in document
    assert "Dialogue: 0,0:00:03.00,0:00:04.25,Subtitle" in document
    assert "Dialogue: 0,0:00:00.00,0:00:06.00,Subtitle" not in document
    assert "Dialogue: 0,0:00:00.00,0:00:06.00,Watermark" in document
