from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from backend import auth
from backend.services.rate_limit_service import (
    DailyExportRateLimiter,
    enforce_public_demo_export_limit,
    export_rate_limiter,
    resolve_client_ip,
)


def _request(
    remote_ip: str,
    forwarded_for: str | None = None,
    authorization: str | None = None,
) -> Request:
    headers = []
    if forwarded_for:
        headers.append((b"x-forwarded-for", forwarded_for.encode("ascii")))
    if authorization:
        headers.append((b"authorization", authorization.encode("ascii")))
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/jobs/dubbing-ai",
            "headers": headers,
            "client": (remote_ip, 12345),
        }
    )


@pytest.mark.asyncio
async def test_daily_export_limiter_blocks_after_limit() -> None:
    now = datetime(2026, 9, 25, 12, 0, tzinfo=timezone.utc)
    limiter = DailyExportRateLimiter(lambda: now)

    first = await limiter.consume("203.0.113.10", 2)
    second = await limiter.consume("203.0.113.10", 2)
    blocked = await limiter.consume("203.0.113.10", 2)

    assert first.allowed is True
    assert first.remaining == 1
    assert second.allowed is True
    assert second.remaining == 0
    assert blocked.allowed is False
    assert blocked.remaining == 0
    assert blocked.retry_after_seconds == 12 * 60 * 60


@pytest.mark.asyncio
async def test_daily_export_limiter_resets_on_next_utc_day() -> None:
    current = [datetime(2026, 9, 25, 23, 59, tzinfo=timezone.utc)]
    limiter = DailyExportRateLimiter(lambda: current[0])

    assert (await limiter.consume("203.0.113.20", 1)).allowed is True
    assert (await limiter.consume("203.0.113.20", 1)).allowed is False

    current[0] += timedelta(minutes=2)

    assert (await limiter.consume("203.0.113.20", 1)).allowed is True


@pytest.mark.asyncio
async def test_admin_bypasses_public_demo_export_limit(monkeypatch) -> None:
    monkeypatch.setenv("PUBLIC_DEMO_MODE", "true")
    monkeypatch.setenv("DEMO_MAX_EXPORTS_PER_IP_PER_DAY", "1")
    await export_rate_limiter.reset()
    admin_id = "mfa-admin-id"
    admin_token = auth.create_access_token({"sub": admin_id, "amr": "totp"})
    request = _request("203.0.113.40", authorization=f"Bearer {admin_token}")
    admin = SimpleNamespace(role="admin", mfa_enabled=True, id=admin_id)

    await enforce_public_demo_export_limit(request, admin)
    await enforce_public_demo_export_limit(request, admin)
    regular_request = _request("203.0.113.41")
    await enforce_public_demo_export_limit(regular_request, SimpleNamespace(role="user"))
    with pytest.raises(HTTPException) as error:
        await enforce_public_demo_export_limit(regular_request, SimpleNamespace(role="user"))

    assert error.value.status_code == 429
    await export_rate_limiter.reset()


def test_forwarded_ip_is_used_only_when_proxy_headers_are_trusted() -> None:
    request = _request("192.0.2.50", "203.0.113.30, 192.0.2.10")

    assert resolve_client_ip(request, trust_proxy_headers=False) == "192.0.2.50"
    assert resolve_client_ip(request, trust_proxy_headers=True) == "203.0.113.30"
