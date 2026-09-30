import asyncio
import sys
from pathlib import Path

import pytest

# Smoke test for importing Wav2Lip dependencies and our new service
def test_import_wav2lip_dependencies():
    try:
        import torch
        import torchvision
        import torchaudio
        import cv2
        import librosa
        import numpy
    except ImportError as exc:
        pytest.fail(f"Required Wav2Lip dependency is missing: {exc}")

def test_lip_sync_service_initialization():
    from backend.services.lip_sync_service import LipSyncService
    
    service = LipSyncService()
    assert hasattr(service, "wav2lip_path")
    assert hasattr(service, "s3fd_path")


def test_open_local_provider_is_blocked_in_production(monkeypatch):
    from backend import config as app_config

    monkeypatch.setattr(app_config, "LIPSYNC_ENABLED", True)
    monkeypatch.setattr(app_config, "LIPSYNC_PROVIDER", "local")
    monkeypatch.setenv("APP_ENV", "production")

    available, reason = app_config.lip_sync_availability()

    assert available is False
    assert reason is not None
    assert "ticari kullanım" in reason

@pytest.mark.asyncio
async def test_lip_sync_service_missing_weights(monkeypatch):
    from backend.services.lip_sync_service import LipSyncService, LipSyncError
    from backend import config as app_config

    monkeypatch.setattr(app_config, "LIPSYNC_ENABLED", True)
    monkeypatch.setattr(app_config, "LIPSYNC_PROVIDER", "local")
    monkeypatch.setenv("APP_ENV", "development")
    
    service = LipSyncService(weights_dir="/tmp/nonexistent-weights")
    with pytest.raises(LipSyncError) as exc_info:
        await service.apply_lip_sync(Path("video.mp4"), Path("audio.mp3"), Path("out.mp4"))
        
    assert "Dudak senkronizasyonu model dosyaları sunucuda bulunamadı" in str(exc_info.value)


@pytest.mark.asyncio
async def test_local_lip_sync_runs_inference_command(monkeypatch, tmp_path):
    from backend.services.lip_sync_service import LipSyncService
    from backend import config as app_config

    monkeypatch.setattr(app_config, "LIPSYNC_ENABLED", True)
    monkeypatch.setattr(app_config, "LIPSYNC_PROVIDER", "local")
    monkeypatch.setenv("APP_ENV", "development")
    weights_dir = tmp_path / "weights"
    weights_dir.mkdir()
    (weights_dir / "wav2lip_gan.pth").write_bytes(b"test")
    (weights_dir / "s3fd.pth").write_bytes(b"test")
    inference_script = tmp_path / "Wav2Lip" / "inference.py"
    inference_script.parent.mkdir()
    inference_script.write_text("# test inference entrypoint", encoding="utf-8")
    video_path = tmp_path / "video.mp4"
    audio_path = tmp_path / "audio.wav"
    output_path = tmp_path / "output.mp4"
    video_path.write_bytes(b"video")
    audio_path.write_bytes(b"audio")
    captured_command = []

    class MockProcess:
        returncode = 0

        async def communicate(self):
            output_path.write_bytes(b"lip-sync-output")
            return b"", b""

    async def mock_create_subprocess_exec(*command, **_kwargs):
        captured_command.extend(command)
        return MockProcess()

    monkeypatch.setattr(asyncio, "create_subprocess_exec", mock_create_subprocess_exec)
    service = LipSyncService(weights_dir=weights_dir, inference_script=inference_script)

    result = await service.apply_lip_sync(video_path, audio_path, output_path)

    assert result == output_path
    assert captured_command[0] == sys.executable
    assert "--checkpoint_path" in captured_command
    assert str(inference_script.resolve()) in captured_command

@pytest.mark.asyncio
async def test_lip_sync_service_rejects_disabled_provider(monkeypatch, tmp_path):
    from backend import config as app_config
    from backend.services.lip_sync_service import LipSyncError, LipSyncService

    monkeypatch.setattr(app_config, "LIPSYNC_ENABLED", True)
    monkeypatch.setattr(app_config, "LIPSYNC_PROVIDER", "disabled")

    with pytest.raises(LipSyncError) as exc_info:
        await LipSyncService().apply_lip_sync(
            tmp_path / "vid.mp4",
            tmp_path / "aud.wav",
            tmp_path / "out.mp4",
        )

    assert "sağlayıcısı yapılandırılmamış" in str(exc_info.value)


@pytest.mark.asyncio
@pytest.mark.parametrize("provider", ["modal", "api"])
async def test_unimplemented_remote_providers_fail_closed(monkeypatch, tmp_path, provider):
    from backend import config as app_config
    from backend.services.lip_sync_service import LipSyncError, LipSyncService

    monkeypatch.setattr(app_config, "LIPSYNC_ENABLED", True)
    monkeypatch.setattr(app_config, "LIPSYNC_PROVIDER", provider)

    with pytest.raises(LipSyncError) as exc_info:
        await LipSyncService().apply_lip_sync(
            tmp_path / "vid.mp4",
            tmp_path / "aud.wav",
            tmp_path / "out.mp4",
        )

    assert "henüz kullanıma hazır değil" in str(exc_info.value)

