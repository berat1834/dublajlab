from __future__ import annotations

import os
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
