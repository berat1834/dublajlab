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
