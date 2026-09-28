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

@pytest.mark.asyncio
async def test_lip_sync_service_missing_weights():
    from backend.services.lip_sync_service import LipSyncService, LipSyncError
    
    service = LipSyncService(weights_dir="/tmp/nonexistent-weights")
    with pytest.raises(LipSyncError) as exc_info:
        await service.apply_lip_sync(Path("video.mp4"), Path("audio.mp3"), Path("out.mp4"))
        
    assert "Dudak senkronizasyonu model dosyaları sunucuda bulunamadı" in str(exc_info.value)


@pytest.mark.asyncio
async def test_local_lip_sync_runs_inference_command(monkeypatch, tmp_path):
    from backend.services.lip_sync_service import LipSyncService
    import backend.services.lip_sync_service as lip_sync_module

    monkeypatch.setattr(lip_sync_module, "LIPSYNC_MODE", "local")
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
async def test_lip_sync_serverless_success(monkeypatch, tmp_path):
    from backend.services.lip_sync_service import LipSyncService
    import backend.services.lip_sync_service as lip_sync_module
    
    monkeypatch.setattr(lip_sync_module, "LIPSYNC_MODE", "serverless")
    monkeypatch.setattr(lip_sync_module, "LIPSYNC_WEBHOOK_URL", "http://mock.test/webhook")
    
    class MockResponse:
        def raise_for_status(self):
            pass
            
    class MockClient:
        async def __aenter__(self):
            return self
        async def __aexit__(self, exc_type, exc, tb):
            pass
        async def post(self, url, json, timeout):
            return MockResponse()
            
    monkeypatch.setattr(lip_sync_module.httpx, "AsyncClient", MockClient)
    
    service = LipSyncService()
    output_path = tmp_path / "out.mp4"
    result = await service.apply_lip_sync(tmp_path / "vid.mp4", tmp_path / "aud.wav", output_path)
    
    assert result == output_path
    assert output_path.exists()
    assert output_path.read_bytes() == b"mock_serverless_output"

@pytest.mark.asyncio
async def test_lip_sync_serverless_failure(monkeypatch, tmp_path):
    from backend.services.lip_sync_service import LipSyncService, LipSyncError
    import backend.services.lip_sync_service as lip_sync_module
    
    monkeypatch.setattr(lip_sync_module, "LIPSYNC_MODE", "serverless")
    monkeypatch.setattr(lip_sync_module, "LIPSYNC_WEBHOOK_URL", "http://mock.test/webhook")
    
    class MockClientError:
        async def __aenter__(self):
            return self
        async def __aexit__(self, exc_type, exc, tb):
            pass
        async def post(self, url, json, timeout):
            raise Exception("Connection failed")
            
    monkeypatch.setattr(lip_sync_module.httpx, "AsyncClient", MockClientError)
    
    service = LipSyncService()
    with pytest.raises(LipSyncError) as exc_info:
        await service.apply_lip_sync(tmp_path / "vid.mp4", tmp_path / "aud.wav", tmp_path / "out.mp4")
        
    assert "Uzak GPU sunucusuna ulaşılamadı, işlem iptal edildi." in str(exc_info.value)

