$ErrorActionPreference = "Stop"

Write-Host "Lokal Wav2Lip Dudak Senkronizasyonu Testi Başlatılıyor..." -ForegroundColor Cyan

# Check if Wav2Lip exists locally
if (-Not (Test-Path "Wav2Lip")) {
    Write-Host "HATA: Wav2Lip klasörü bulunamadı! Lütfen repoyu root dizine kopyalayın." -ForegroundColor Red
    exit 1
}

# Python script to run the lip sync service
$pythonScript = @"
import asyncio
import sys
from pathlib import Path

# Backend modüllerini import edebilmek için yolu ekle
sys.path.append(str(Path.cwd()))

from backend.services.lip_sync_service import LipSyncService, LipSyncError

async def main():
    service = LipSyncService()
    
    input_video = Path("demo/input/test_video.mp4")
    input_audio = Path("demo/input/test_audio.wav")
    output_video = Path("demo/output/lipsync_result.mp4")
    
    if not input_video.exists():
        # Yedek test videoları
        input_video = Path("demo/input/video1.mp4")
    if not input_audio.exists():
        input_audio = Path("demo/input/audio1.mp3")
        
    print(f"Video: {input_video}")
    print(f"Ses: {input_audio}")
    print(f"Çıktı: {output_video}")
    
    output_video.parent.mkdir(parents=True, exist_ok=True)
    
    if output_video.exists():
        output_video.unlink()
        
    try:
        print("Wav2Lip çıkarımı başlatılıyor (Bu işlem CPU'da birkaç dakika sürebilir)...")
        result_path = await service.apply_lip_sync(input_video, input_audio, output_video)
        print(f"BAŞARILI: Çıktı dosyası şuraya kaydedildi: {result_path}")
    except LipSyncError as e:
        print(f"HATA: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
"@

$tempScript = "scripts/temp_lipsync_test.py"
$pythonScript | Out-File -FilePath $tempScript -Encoding utf8

try {
    # Activate virtual environment if it exists
    if (Test-Path ".venv/Scripts/Activate.ps1") {
        Write-Host ".venv bulundu, aktif ediliyor..." -ForegroundColor Yellow
        & .venv/Scripts/Activate.ps1
    }
    
    python $tempScript
}
finally {
    if (Test-Path $tempScript) {
        Remove-Item $tempScript
    }
}
Write-Host "Test tamamlandı." -ForegroundColor Green
