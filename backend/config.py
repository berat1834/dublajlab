from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

MEDIA_ROOT = Path(os.getenv("MEDIA_ROOT", BASE_DIR / "data")).resolve()
UPLOAD_DIR = MEDIA_ROOT / "uploads"
OUTPUT_DIR = MEDIA_ROOT / "outputs"
AUDIO_DIR = MEDIA_ROOT / "audio"
SUBTITLE_DIR = MEDIA_ROOT / "subtitles"
RECORDING_DIR = MEDIA_ROOT / "recordings"
TEMP_DIR = MEDIA_ROOT / "tmp"
METADATA_DIR = MEDIA_ROOT / "metadata"

FFMPEG_BINARY = os.getenv("FFMPEG_BINARY", "ffmpeg")
FFPROBE_BINARY = os.getenv("FFPROBE_BINARY", "ffprobe")
MAX_FILE_SIZE = 50 * 1024 * 1024
MAX_VIDEO_DURATION = 60.0
MAX_RECORDING_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".mp4", ".mov", ".webm"}
ALLOWED_RECORDING_EXTENSIONS = {".webm", ".wav", ".mp3", ".m4a", ".ogg", ".mp4"}
MEGABYTE = 1024 * 1024


@dataclass(frozen=True)
class PublicDemoPolicy:
    enabled: bool
    max_file_size_mb: int
    max_video_duration_seconds: float
    max_recording_size_mb: int
    max_exports_per_ip_per_day: int
    media_ttl_hours: int
    trust_proxy_headers: bool

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * MEGABYTE

    @property
    def max_recording_size_bytes(self) -> int:
        return self.max_recording_size_mb * MEGABYTE


def _boolean_setting(name: str, default: bool = False) -> bool:
    raw_value = os.getenv(name)
    if raw_value is None or not raw_value.strip():
        return default
    normalized = raw_value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{name} true veya false olmalıdır.")


def _positive_int_setting(name: str, default: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
    except ValueError as exc:
        raise ValueError(f"{name} pozitif bir tam sayı olmalıdır.") from exc
    if value < 1:
        raise ValueError(f"{name} en az 1 olmalıdır.")
    return value


def _positive_float_setting(name: str, default: float) -> float:
    try:
        value = float(os.getenv(name, str(default)))
    except ValueError as exc:
        raise ValueError(f"{name} pozitif bir sayı olmalıdır.") from exc
    if value <= 0:
        raise ValueError(f"{name} sıfırdan büyük olmalıdır.")
    return value


def public_demo_policy() -> PublicDemoPolicy:
    """Returns runtime demo limits, capped by the normal application limits."""

    return PublicDemoPolicy(
        enabled=_boolean_setting("PUBLIC_DEMO_MODE", False),
        max_file_size_mb=min(
            _positive_int_setting("DEMO_MAX_FILE_SIZE_MB", 20),
            MAX_FILE_SIZE // MEGABYTE,
        ),
        max_video_duration_seconds=min(
            _positive_float_setting("DEMO_MAX_VIDEO_DURATION_SECONDS", 30.0),
            MAX_VIDEO_DURATION,
        ),
        max_recording_size_mb=min(
            _positive_int_setting("DEMO_MAX_RECORDING_SIZE_MB", 5),
            MAX_RECORDING_SIZE // MEGABYTE,
        ),
        max_exports_per_ip_per_day=_positive_int_setting(
            "DEMO_MAX_EXPORTS_PER_IP_PER_DAY",
            5,
        ),
        media_ttl_hours=min(
            _positive_int_setting("DEMO_MEDIA_TTL_HOURS", 24),
            8760,
        ),
        trust_proxy_headers=_boolean_setting("TRUST_PROXY_HEADERS", False),
    )


def active_max_file_size_bytes() -> int:
    policy = public_demo_policy()
    return policy.max_file_size_bytes if policy.enabled else MAX_FILE_SIZE


def active_max_video_duration_seconds() -> float:
    policy = public_demo_policy()
    return policy.max_video_duration_seconds if policy.enabled else MAX_VIDEO_DURATION


def active_max_recording_size_bytes() -> int:
    policy = public_demo_policy()
    return policy.max_recording_size_bytes if policy.enabled else MAX_RECORDING_SIZE


def ensure_media_directories() -> None:
    for directory in (
        MEDIA_ROOT,
        UPLOAD_DIR,
        OUTPUT_DIR,
        AUDIO_DIR,
        SUBTITLE_DIR,
        RECORDING_DIR,
        TEMP_DIR,
        METADATA_DIR,
    ):
        directory.mkdir(parents=True, exist_ok=True)


def allowed_origins() -> list[str]:
    raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


def app_environment() -> str:
    return os.getenv("APP_ENV", "development").strip().lower()


def maintenance_token() -> str | None:
    value = os.getenv("MAINTENANCE_TOKEN", "").strip()
    return value or None
