from __future__ import annotations

from datetime import datetime, timezone


def retention_has_expired(expires_at: datetime | None) -> bool:
    """Return whether an export is past its retention deadline."""

    if expires_at is None:
        return False
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at <= datetime.now(timezone.utc)
