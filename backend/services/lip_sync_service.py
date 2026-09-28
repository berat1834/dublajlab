import asyncio
import logging
import sys
from pathlib import Path

import httpx

from backend.config import LIPSYNC_MODE, LIPSYNC_WEBHOOK_URL

logger = logging.getLogger(__name__)


class LipSyncError(Exception):
    pass


class LipSyncService:
    def __init__(
        self,
        weights_dir: Path | str = "backend/weights",
        inference_script: Path | str = "Wav2Lip/inference.py",
    ):
        self.weights_dir = Path(weights_dir)
        self.wav2lip_path = self.weights_dir / "wav2lip_gan.pth"
        self.s3fd_path = self.weights_dir / "s3fd.pth"
        self.inference_script = Path(inference_script)

    async def apply_lip_sync(self, face_video_path: Path, audio_path: Path, output_path: Path) -> Path:
        """
        Applies lip synchronization to a video using the given audio.
        """
        if LIPSYNC_MODE == "serverless":
            if not LIPSYNC_WEBHOOK_URL:
                raise LipSyncError("LIPSYNC_WEBHOOK_URL yapılandırılmamış.")
                
            try:
                async with httpx.AsyncClient() as client:
                    payload = {
                        "face_url": f"file://{face_video_path.resolve()}",
                        "audio_url": f"file://{audio_path.resolve()}",
                        "callback_url": "dummy"
                    }
                    response = await client.post(LIPSYNC_WEBHOOK_URL, json=payload, timeout=10.0)
                    response.raise_for_status()
                    
                    # For the stub, we just create an empty output file so the pipeline can continue
                    output_path.write_bytes(b"mock_serverless_output")
                    return output_path
            except Exception:
                raise LipSyncError("Uzak GPU sunucusuna ulaşılamadı, işlem iptal edildi.")
                
        # Local mode execution
        if not self.wav2lip_path.exists() or not self.s3fd_path.exists():
            raise LipSyncError(
                "Dudak senkronizasyonu model dosyaları sunucuda bulunamadı. Lütfen sistem yöneticisiyle iletişime geçin."
            )
        if not face_video_path.is_file():
            raise LipSyncError("Dudak senkronizasyonu için video dosyası bulunamadı.")
        if not audio_path.is_file():
            raise LipSyncError("Dudak senkronizasyonu için ses dosyası bulunamadı.")
        if not self.inference_script.is_file():
            raise LipSyncError(
                "Dudak senkronizasyonu motoru sunucuda bulunamadı. Lütfen sistem yöneticisiyle iletişime geçin."
            )

        output_path.parent.mkdir(parents=True, exist_ok=True)

        command = [
            sys.executable, str(self.inference_script.resolve()),
            "--checkpoint_path", str(self.wav2lip_path.resolve()),
            "--face", str(face_video_path.resolve()),
            "--audio", str(audio_path.resolve()),
            "--outfile", str(output_path.resolve()),
        ]

        try:
            # We run the command asynchronously
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            _stdout, stderr = await process.communicate()

            if process.returncode != 0:
                error_msg = stderr.decode().strip() if stderr else "Bilinmeyen hata"
                logger.error("Wav2Lip inference failed: %s", error_msg)
                raise LipSyncError("Dudak senkronizasyonu işlemi yerel motor (Wav2Lip) tarafından reddedildi.")
            
            if not output_path.exists():
                raise LipSyncError("Wav2Lip başarılı görünüyor ancak çıktı dosyası bulunamadı.")
                
            return output_path
            
        except Exception as exc:
            if isinstance(exc, LipSyncError):
                raise
            logger.exception("Wav2Lip inference could not be started")
            raise LipSyncError(
                "Dudak senkronizasyonu işlemi başlatılamadı. Lütfen daha sonra tekrar deneyin."
            ) from exc
