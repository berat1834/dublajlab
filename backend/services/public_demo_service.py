from __future__ import annotations

from dataclasses import dataclass

from fastapi import HTTPException, status

from backend import config


PUBLIC_DEMO_LOGIN_REQUIRED_ERROR = (
    "Girişsiz dublaj şu anda kapalı. Devam etmek için giriş yapın veya kayıt olun."
)


@dataclass(frozen=True)
class MediaRequestPolicy:
    is_guest_demo: bool
    max_file_size_bytes: int
    max_video_duration_seconds: float
    max_recording_size_bytes: int


def resolve_media_request_policy(current_user: object | None) -> MediaRequestPolicy:
    """Resolve access and media limits for authenticated and guest requests."""

    demo = config.public_demo_policy()
    is_guest_demo = current_user is None
    if is_guest_demo and not demo.enabled:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=PUBLIC_DEMO_LOGIN_REQUIRED_ERROR,
        )

    if is_guest_demo:
        return MediaRequestPolicy(
            is_guest_demo=True,
            max_file_size_bytes=demo.max_file_size_bytes,
            max_video_duration_seconds=demo.max_video_duration_seconds,
            max_recording_size_bytes=demo.max_recording_size_bytes,
        )

    return MediaRequestPolicy(
        is_guest_demo=False,
        max_file_size_bytes=config.MAX_FILE_SIZE,
        max_video_duration_seconds=config.MAX_VIDEO_DURATION,
        max_recording_size_bytes=config.MAX_RECORDING_SIZE,
    )
