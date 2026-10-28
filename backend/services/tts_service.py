from __future__ import annotations

import asyncio
import logging
import subprocess
from dataclasses import dataclass
from pathlib import Path

import edge_tts
from gtts import gTTS

from backend.config import FFMPEG_BINARY
from backend.models import VoiceStyle


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class VoiceConfig:
    voice: str
    rate: str = "+0%"
    pitch: str = "+0Hz"
    volume: str = "+0%"


VOICE_CONFIGS: dict[VoiceStyle, VoiceConfig] = {
    VoiceStyle.ANNOUNCER: VoiceConfig("tr-TR-AhmetNeural", rate="-3%", pitch="-2Hz"),
    VoiceStyle.ROBOT: VoiceConfig("tr-TR-AhmetNeural", rate="-12%", pitch="-18Hz"),
    VoiceStyle.DRAMATIC: VoiceConfig("tr-TR-AhmetNeural", rate="-18%", pitch="-8Hz"),
    VoiceStyle.DOCUMENTARY: VoiceConfig("tr-TR-EmelNeural", rate="-10%", pitch="-4Hz"),
    VoiceStyle.ENERGETIC: VoiceConfig("tr-TR-EmelNeural", rate="+18%", pitch="+6Hz"),
}

# gTTS provides a Turkish fallback when the unofficial Edge speech websocket
# is unavailable. The filters keep the presets audibly distinct without ever
# accepting arbitrary FFmpeg input from a request.
FALLBACK_AUDIO_FILTERS: dict[VoiceStyle, str] = {
    VoiceStyle.ANNOUNCER: "atempo=1.02,equalizer=f=180:t=q:w=1:g=2",
    VoiceStyle.ROBOT: "atempo=0.90,aecho=0.8:0.7:30:0.18",
    VoiceStyle.DRAMATIC: "atempo=0.86,volume=1.08",
    VoiceStyle.DOCUMENTARY: "atempo=0.92,highpass=f=75,lowpass=f=9000",
    VoiceStyle.ENERGETIC: "atempo=1.18,volume=1.08",
}


class TTSService:
    def __init__(self) -> None:
        self._edge_available: bool | None = None
        self._edge_probe_lock = asyncio.Lock()

    async def generate_voiceover(
        self,
        text: str,
        voice_style: VoiceStyle,
        output_audio_path: Path,
    ) -> Path:
        if self._edge_available is not False:
            async with self._edge_probe_lock:
                if self._edge_available is not False:
                    config = VOICE_CONFIGS[voice_style]
                    try:
                        communicator = edge_tts.Communicate(
                            text=text,
                            voice=config.voice,
                            rate=config.rate,
                            pitch=config.pitch,
                            volume=config.volume,
                        )
                        await communicator.save(str(output_audio_path))
                        if (
                            not output_audio_path.is_file()
                            or output_audio_path.stat().st_size == 0
                        ):
                            raise RuntimeError("Edge TTS returned an empty audio file.")
                        self._edge_available = True
                        return output_audio_path
                    except Exception as edge_error:
                        self._edge_available = False
                        output_audio_path.unlink(missing_ok=True)
                        logger.warning(
                            "Edge TTS failed; using Turkish fallback: %s",
                            edge_error,
                        )

        try:
            await asyncio.to_thread(
                self._generate_fallback,
                text,
                voice_style,
                output_audio_path,
            )
        except Exception as exc:
            output_audio_path.unlink(missing_ok=True)
            raise RuntimeError(
                "Ses üretilemedi. Lütfen biraz sonra tekrar deneyin."
            ) from exc
        return output_audio_path

    @staticmethod
    def _generate_fallback(
        text: str,
        voice_style: VoiceStyle,
        output_audio_path: Path,
    ) -> None:
        source_path = output_audio_path.with_name(
            f"{output_audio_path.stem}-gtts-source.mp3"
        )
        source_path.unlink(missing_ok=True)
        try:
            gTTS(text=text, lang="tr").save(str(source_path))
            result = subprocess.run(
                [
                    FFMPEG_BINARY,
                    "-y",
                    "-i",
                    str(source_path),
                    "-af",
                    FALLBACK_AUDIO_FILTERS[voice_style],
                    "-codec:a",
                    "libmp3lame",
                    "-q:a",
                    "4",
                    str(output_audio_path),
                ],
                capture_output=True,
                text=True,
                timeout=30,
                check=False,
            )
            if result.returncode != 0 or not output_audio_path.is_file():
                raise RuntimeError(
                    result.stderr.strip() or "FFmpeg audio processing failed."
                )
            if output_audio_path.stat().st_size == 0:
                raise RuntimeError("Fallback TTS returned an empty audio file.")
        finally:
            source_path.unlink(missing_ok=True)
