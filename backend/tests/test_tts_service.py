from __future__ import annotations

from pathlib import Path

import pytest

from backend.models import VoiceStyle
from backend.services import tts_service as tts_module
from backend.services.tts_service import TTSService


@pytest.mark.asyncio
async def test_tts_falls_back_when_edge_provider_fails(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    output_path = tmp_path / "voice.mp3"
    edge_attempts = 0

    class FailingCommunicator:
        def __init__(self, **_kwargs):
            nonlocal edge_attempts
            edge_attempts += 1

        async def save(self, _destination: str) -> None:
            raise RuntimeError("edge unavailable")

    fallback_calls: list[tuple[str, VoiceStyle, Path]] = []

    def fake_fallback(text: str, style: VoiceStyle, destination: Path) -> None:
        fallback_calls.append((text, style, destination))
        destination.write_bytes(b"fallback-audio")

    monkeypatch.setattr(tts_module.edge_tts, "Communicate", FailingCommunicator)
    monkeypatch.setattr(TTSService, "_generate_fallback", staticmethod(fake_fallback))

    service = TTSService()
    result = await service.generate_voiceover(
        "Merhaba dünya",
        VoiceStyle.DOCUMENTARY,
        output_path,
    )
    second_output = tmp_path / "voice-2.mp3"
    await service.generate_voiceover(
        "İkinci deneme",
        VoiceStyle.ENERGETIC,
        second_output,
    )

    assert result == output_path
    assert output_path.read_bytes() == b"fallback-audio"
    assert second_output.read_bytes() == b"fallback-audio"
    assert fallback_calls == [
        ("Merhaba dünya", VoiceStyle.DOCUMENTARY, output_path),
        ("İkinci deneme", VoiceStyle.ENERGETIC, second_output),
    ]
    assert edge_attempts == 1


def test_fallback_filters_cover_every_voice_style() -> None:
    assert set(tts_module.FALLBACK_AUDIO_FILTERS) == set(VoiceStyle)
