from __future__ import annotations

import textwrap
from pathlib import Path

from backend.models import DubbingLine


class SubtitleService:
    @staticmethod
    def _document(events: list[str]) -> str:
        return "\n".join(
            [
                "[Script Info]",
                "ScriptType: v4.00+",
                "PlayResX: 1080",
                "PlayResY: 1920",
                "ScaledBorderAndShadow: yes",
                "WrapStyle: 2",
                "",
                "[V4+ Styles]",
                "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
                "Style: Subtitle,Arial,62,&H00FFFFFF,&H000000FF,&H00101010,&H80000000,-1,0,0,0,100,100,0,0,1,4,1,2,70,70,150,1",
                "Style: Watermark,Arial,30,&HB8FFFFFF,&H000000FF,&H60000000,&H60000000,0,0,0,0,100,100,0,0,1,2,0,9,32,32,36,1",
                "",
                "[Events]",
                "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
                *events,
                "",
            ]
        )

    @staticmethod
    def _ass_time(seconds: float) -> str:
        safe_seconds = max(0.0, seconds)
        hours = int(safe_seconds // 3600)
        minutes = int((safe_seconds % 3600) // 60)
        seconds_part = safe_seconds % 60
        return f"{hours}:{minutes:02d}:{seconds_part:05.2f}"

    @staticmethod
    def _escape_ass(text: str) -> str:
        escaped = text.replace("\\", r"\\").replace("{", r"\{").replace("}", r"\}")
        paragraphs = [line.strip() for line in escaped.splitlines() if line.strip()]
        wrapped: list[str] = []
        for paragraph in paragraphs or [escaped.strip()]:
            wrapped.extend(
                textwrap.wrap(
                    paragraph,
                    width=38,
                    break_long_words=False,
                    break_on_hyphens=False,
                )
                or [""]
            )
        return r"\N".join(wrapped[:4])

    def create_ass(
        self,
        text: str,
        duration_seconds: float,
        output_path: Path,
        burn_subtitles: bool,
    ) -> Path:
        end_time = self._ass_time(duration_seconds)
        events = [
            f"Dialogue: 0,0:00:00.00,{end_time},Watermark,,0,0,0,,DublajLab"
        ]
        if burn_subtitles:
            events.append(
                f"Dialogue: 0,0:00:00.00,{end_time},Subtitle,,0,0,0,,{self._escape_ass(text)}"
            )

        document = self._document(events)
        output_path.write_text(document, encoding="utf-8-sig")
        return output_path

    def create_timeline_ass(
        self,
        lines: list[DubbingLine],
        duration_seconds: float,
        output_path: Path,
        burn_subtitles: bool,
    ) -> Path:
        events = [
            "Dialogue: 0,0:00:00.00,"
            f"{self._ass_time(duration_seconds)},Watermark,,0,0,0,,DublajLab"
        ]
        if burn_subtitles:
            events.extend(
                "Dialogue: 0,"
                f"{self._ass_time(line.start)},{self._ass_time(line.end)},"
                f"Subtitle,,0,0,0,,{self._escape_ass(line.text)}"
                for line in lines
            )
        output_path.write_text(self._document(events), encoding="utf-8-sig")
        return output_path
