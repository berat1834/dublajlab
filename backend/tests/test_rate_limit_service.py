from __future__ import annotations

from datetime import datetime, timedelta, timezone

from starlette.requests import Request

from backend.services.rate_limit_service import (
    DailyExportRateLimiter,
    resolve_client_ip,
)


def _request(remote_ip: str, forwarded_for: str | None = None) -> Request:
    headers = []
    if forwarded_for:
        headers.append((b"x-forwarded-for", forwarded_for.encode("ascii")))
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/jobs/dubbing-ai",
            "headers": headers,
            "client": (remote_ip, 12345),
        }
    )


def test_daily_export_limiter_blocks_after_limit() -> None:
    now = datetime(2026, 9, 25, 12, 0, tzinfo=timezone.utc)
    limiter = DailyExportRateLimiter(lambda: now)

    first = limiter.consume("203.0.113.10", 2)
    second = limiter.consume("203.0.113.10", 2)
    blocked = limiter.consume("203.0.113.10", 2)

    assert first.allowed is True
    assert first.remaining == 1
    assert second.allowed is True
    assert second.remaining == 0
    assert blocked.allowed is False
    assert blocked.remaining == 0
    assert blocked.retry_after_seconds == 12 * 60 * 60


def test_daily_export_limiter_resets_on_next_utc_day() -> None:
    current = [datetime(2026, 9, 25, 23, 59, tzinfo=timezone.utc)]
    limiter = DailyExportRateLimiter(lambda: current[0])

    assert limiter.consume("203.0.113.20", 1).allowed is True
    assert limiter.consume("203.0.113.20", 1).allowed is False

    current[0] += timedelta(minutes=2)

    assert limiter.consume("203.0.113.20", 1).allowed is True


def test_forwarded_ip_is_used_only_when_proxy_headers_are_trusted() -> None:
    request = _request("192.0.2.50", "203.0.113.30, 192.0.2.10")

    assert resolve_client_ip(request, trust_proxy_headers=False) == "192.0.2.50"
    assert resolve_client_ip(request, trust_proxy_headers=True) == "203.0.113.30"
