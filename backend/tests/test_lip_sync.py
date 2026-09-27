import pytest
from pathlib import Path

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

