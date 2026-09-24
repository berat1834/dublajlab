from __future__ import annotations

import json
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path

from backend.config import FFMPEG_BINARY, FFPROBE_BINARY


@dataclass(frozen=True)
class VideoInfo:
    duration_seconds: float
    has_audio: bool


@dataclass(frozen=True)
class FFmpegStatus:
    available: bool
    message: str
    ffmpeg_path: str | None = None
    ffprobe_path: str | None = None
    version: str | None = None

    def as_dict(self) -> dict[str, str | bool | None]:
        return {
            "available": self.available,
            "message": self.message,
            "ffmpeg_path": self.ffmpeg_path,
            "ffprobe_path": self.ffprobe_path,
            "version": self.version,
        }


class MediaProcessingError(RuntimeError):
    pass


class FFmpegService:
    process_timeout_seconds = 180
    probe_timeout_seconds = 30

    def __init__(
        self,
        ffmpeg_binary: str = FFMPEG_BINARY,
        ffprobe_binary: str = FFPROBE_BINARY,
    ) -> None:
        self.ffmpeg_binary = ffmpeg_binary
        self.ffprobe_binary = ffprobe_binary

    def check_availability(self) -> FFmpegStatus:
        ffmpeg_path = shutil.which(self.ffmpeg_binary)
        ffprobe_path = shutil.which(self.ffprobe_binary)
        missing = []
        if not ffmpeg_path:
            missing.append("FFmpeg")
        if not ffprobe_path:
            missing.append("FFprobe")
        if missing:
            tools = " ve ".join(missing)
            return FFmpegStatus(
                available=False,
                message=(
                    f"{tools} bulunamadı. FFmpeg'i kurun, terminali yeniden açın ve "
                    "'ffmpeg -version' komutuyla PATH ayarını doğrulayın."
                ),
                ffmpeg_path=ffmpeg_path,
                ffprobe_path=ffprobe_path,
            )

        versions: dict[str, str | None] = {}
        for tool_name, tool_path in (("FFmpeg", ffmpeg_path), ("FFprobe", ffprobe_path)):
            try:
                result = subprocess.run(
                    [tool_path, "-version"],
                    check=True,
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    timeout=10,
                )
            except (OSError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
                return FFmpegStatus(
                    available=False,
                    message=(
                        f"{tool_name} bulundu ancak çalıştırılamadı. Kurulumu ve "
                        "dosya izinlerini kontrol edin."
                    ),
                    ffmpeg_path=ffmpeg_path,
                    ffprobe_path=ffprobe_path,
                )
            versions[tool_name] = (
                result.stdout.splitlines()[0].strip() if result.stdout else None
            )

        return FFmpegStatus(
            available=True,
            message="FFmpeg ve FFprobe kullanıma hazır.",
            ffmpeg_path=ffmpeg_path,
            ffprobe_path=ffprobe_path,
            version=versions["FFmpeg"],
        )

    def ensure_available(self) -> FFmpegStatus:
        availability = self.check_availability()
        if not availability.available:
            raise MediaProcessingError(availability.message)
        return availability

    @staticmethod
    def _run(
        command: list[str],
        failure_message: str,
        timeout_seconds: int = 180,
    ) -> subprocess.CompletedProcess[str]:
        try:
            return subprocess.run(
                command,
                check=True,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout_seconds,
            )
        except FileNotFoundError as exc:
            raise MediaProcessingError(
                "FFmpeg bulunamadı. FFmpeg'i kurup PATH ayarını kontrol edin."
            ) from exc
        except subprocess.CalledProcessError as exc:
            diagnostic = (exc.stderr or "").strip().splitlines()
            detail = diagnostic[-1] if diagnostic else "Bilinmeyen FFmpeg hatası"
            raise MediaProcessingError(f"{failure_message} ({detail})") from exc
        except subprocess.TimeoutExpired as exc:
            raise MediaProcessingError(
                "Medya işlemi zaman aşımına uğradı. Daha kısa bir video ile tekrar deneyin."
            ) from exc

    def probe(self, video_path: Path) -> VideoInfo:
        result = self._run(
            [
                self.ffprobe_binary,
                "-v",
                "error",
                "-show_entries",
                "format=duration:stream=codec_type",
                "-of",
                "json",
                str(video_path),
            ],
            "Video dosyası okunamadı veya bozuk.",
            timeout_seconds=self.probe_timeout_seconds,
        )
        try:
            payload = json.loads(result.stdout)
            duration = float(payload["format"]["duration"])
            streams = payload.get("streams", [])
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
            raise MediaProcessingError("Video dosyası okunamadı veya bozuk.") from exc
        if duration <= 0:
            raise MediaProcessingError("Video dosyası boş veya bozuk.")
        return VideoInfo(
            duration_seconds=duration,
            has_audio=any(stream.get("codec_type") == "audio" for stream in streams),
        )

    @staticmethod
    def _filter_path(path: Path) -> str:
        normalized = path.resolve().as_posix()
        return normalized.replace("'", r"\'").replace(":", r"\:")

    def build_process_command(
        self,
        video_path: Path,
        audio_path: Path,
        subtitle_path: Path,
        output_path: Path,
        duration_seconds: float,
        mute_original_audio: bool,
        has_original_audio: bool,
    ) -> list[str]:
        subtitle_filter = f"ass=filename='{self._filter_path(subtitle_path)}'"
        if mute_original_audio or not has_original_audio:
            audio_filter = "[1:a]apad[aout]"
        else:
            audio_filter = (
                "[0:a]volume=0.22[original];"
                "[original][1:a]amix=inputs=2:duration=longest:dropout_transition=2,apad[aout]"
            )

        return [
            self.ffmpeg_binary,
            "-y",
            "-i",
            str(video_path),
            "-i",
            str(audio_path),
            "-filter_complex",
            f"[0:v]{subtitle_filter}[vout];{audio_filter}",
            "-map",
            "[vout]",
            "-map",
            "[aout]",
            "-t",
            f"{duration_seconds:.3f}",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "23",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-movflags",
            "+faststart",
            str(output_path),
        ]

    def process_video(
        self,
        video_path: Path,
        audio_path: Path,
        subtitle_path: Path,
        output_path: Path,
        duration_seconds: float,
        mute_original_audio: bool,
        has_original_audio: bool,
    ) -> Path:
        command = self.build_process_command(
            video_path=video_path,
            audio_path=audio_path,
            subtitle_path=subtitle_path,
            output_path=output_path,
            duration_seconds=duration_seconds,
            mute_original_audio=mute_original_audio,
            has_original_audio=has_original_audio,
        )
        self._run(command, "Video işlenemedi.")
        if not output_path.is_file() or output_path.stat().st_size == 0:
            raise MediaProcessingError("Video çıktısı oluşturulamadı.")
        return output_path

    def build_recording_process_command(
        self,
        video_path: Path,
        recording_paths: list[Path],
        timeline: list[tuple[float, float]],
        subtitle_path: Path,
        output_path: Path,
        duration_seconds: float,
        mute_original_audio: bool,
        has_original_audio: bool,
    ) -> list[str]:
        command = [self.ffmpeg_binary, "-y", "-i", str(video_path)]
        for recording_path in recording_paths:
            command.extend(["-i", str(recording_path)])

        filters: list[str] = [
            f"[0:v]ass=filename='{self._filter_path(subtitle_path)}'[vout]"
        ]
        if mute_original_audio or not has_original_audio:
            filters.append(
                "anullsrc=r=44100:cl=stereo,"
                f"atrim=duration={duration_seconds:.3f}[base]"
            )
        else:
            filters.append(
                "[0:a]aresample=44100,"
                "aformat=sample_fmts=fltp:channel_layouts=stereo,"
                "volume=0.20[base]"
            )

        voice_labels: list[str] = []
        for index, (start, end) in enumerate(timeline, start=1):
            slot_duration = end - start
            label = f"voice{index}"
            voice_labels.append(f"[{label}]")
            filters.append(
                f"[{index}:a]aresample=44100,"
                "aformat=sample_fmts=fltp:channel_layouts=stereo,"
                f"atrim=0:{slot_duration:.3f},asetpts=PTS-STARTPTS,"
                f"apad=pad_dur={slot_duration:.3f},atrim=0:{slot_duration:.3f},"
                f"adelay={round(start * 1000)}:all=1[{label}]"
            )

        mix_inputs = "[base]" + "".join(voice_labels)
        filters.append(
            f"{mix_inputs}amix=inputs={len(voice_labels) + 1}:"
            "duration=longest:normalize=0,alimiter=limit=0.95,"
            f"atrim=duration={duration_seconds:.3f}[aout]"
        )
        command.extend(
            [
                "-filter_complex",
                ";".join(filters),
                "-map",
                "[vout]",
                "-map",
                "[aout]",
                "-t",
                f"{duration_seconds:.3f}",
                "-c:v",
                "libx264",
                "-preset",
                "medium",
                "-crf",
                "23",
                "-pix_fmt",
                "yuv420p",
                "-c:a",
                "aac",
                "-b:a",
                "192k",
                "-movflags",
                "+faststart",
                str(output_path),
            ]
        )
        return command

    def process_recordings(
        self,
        video_path: Path,
        recording_paths: list[Path],
        timeline: list[tuple[float, float]],
        subtitle_path: Path,
        output_path: Path,
        duration_seconds: float,
        mute_original_audio: bool,
        has_original_audio: bool,
    ) -> Path:
        command = self.build_recording_process_command(
            video_path,
            recording_paths,
            timeline,
            subtitle_path,
            output_path,
            duration_seconds,
            mute_original_audio,
            has_original_audio,
        )
        self._run(command, "Ses kayıtları videoya yerleştirilemedi.")
        if not output_path.is_file() or output_path.stat().st_size == 0:
            raise MediaProcessingError("Video çıktısı oluşturulamadı.")
        return output_path
