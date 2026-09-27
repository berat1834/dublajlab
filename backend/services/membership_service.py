from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status

from backend import models_db


VIP_REQUIRED_MESSAGE = (
    "Bu özellik VIP üyelere özeldir. VIP üyeliğinizi etkinleştirip tekrar deneyin."
)


def has_active_vip(user: models_db.User | None) -> bool:
    if user is None:
        return False
    if user.role == "admin":
        return True
    if user.membership_tier != "vip" or user.membership_expires_at is None:
        return False
    expires_at = user.membership_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at > datetime.now(timezone.utc)


def require_active_vip(user: models_db.User | None) -> models_db.User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bu özellik için giriş yapmalısınız.",
        )
    if not has_active_vip(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=VIP_REQUIRED_MESSAGE)
    return user
