import asyncio
from pathlib import Path

class LipSyncError(Exception):
    pass

class LipSyncService:
    def __init__(self, weights_dir: Path | str = "backend/weights"):
        self.weights_dir = Path(weights_dir)
        self.wav2lip_path = self.weights_dir / "wav2lip_gan.pth"
        self.s3fd_path = self.weights_dir / "s3fd.pth"

    async def apply_lip_sync(self, face_video_path: Path, audio_path: Path, output_path: Path) -> Path:
        """
        Applies lip synchronization to a video using the given audio.
        """
        if not self.wav2lip_path.exists() or not self.s3fd_path.exists():
            raise LipSyncError(
                "Dudak senkronizasyonu model dosyaları sunucuda bulunamadı. Lütfen sistem yöneticisiyle iletişime geçin."
            )

        command = [
            "python", "inference.py",
            "--checkpoint_path", str(self.wav2lip_path),
            "--face", str(face_video_path),
            "--audio", str(audio_path),
            "--outfile", str(output_path),
            "--nosmooth"
        ]

        try:
            # We run the command asynchronously
            process = await asyncio.create_subprocess_exec(
                *command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                error_msg = stderr.decode().strip() if stderr else "Bilinmeyen hata"
                raise LipSyncError(f"Wav2Lip işlemi başarısız oldu: {error_msg}")
            
            if not output_path.exists():
                raise LipSyncError("Wav2Lip başarılı görünüyor ancak çıktı dosyası bulunamadı.")
                
            return output_path
            
        except Exception as exc:
            if isinstance(exc, LipSyncError):
                raise
            raise LipSyncError(f"Wav2Lip çıkarımı sırasında beklenmeyen bir hata oluştu: {exc}")
