from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import edge_tts

from backend.models import VoiceStyle


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


class TTSService:
    async def generate_voiceover(
        self,
        text: str,
        voice_style: VoiceStyle,
        output_audio_path: Path,
    ) -> Path:
        config = VOICE_CONFIGS[voice_style]
        communicator = edge_tts.Communicate(
            text=text,
            voice=config.voice,
            rate=config.rate,
            pitch=config.pitch,
            volume=config.volume,
        )
        try:
            await communicator.save(str(output_audio_path))
        except Exception as exc:
            output_audio_path.unlink(missing_ok=True)
            raise RuntimeError(
                "Ses üretilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin."
            ) from exc
        return output_audio_path

