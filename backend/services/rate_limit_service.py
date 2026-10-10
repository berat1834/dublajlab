from __future__ import annotations

import ipaddress
from dataclasses import dataclass
from datetime import datetime, time, timedelta, timezone
from threading import RLock
from typing import Callable

from fastapi import HTTPException, Request, status
from jose import JWTError, jwt

from backend import auth
from backend.config import public_demo_policy, get_redis_url
import redis.asyncio as redis


@dataclass(frozen=True)
class RateLimitResult:
    allowed: bool
    remaining: int
    retry_after_seconds: int


class DailyExportRateLimiter:
    """Thread-safe, process-local export counter grouped by UTC calendar day."""

    def __init__(self, clock: Callable[[], datetime] | None = None) -> None:
        self._clock = clock or (lambda: datetime.now(timezone.utc))
        self._counts: dict[tuple[str, str], int] = {}
        self._lock = RLock()
        
        redis_url = get_redis_url()
        self._redis = redis.from_url(redis_url, decode_responses=True) if redis_url else None

    async def consume(self, client_id: str, limit: int) -> RateLimitResult:
        if limit < 1:
            raise ValueError("Export limiti en az 1 olmalıdır.")

        now = self._clock()
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)
        now = now.astimezone(timezone.utc)
        day = now.date().isoformat()
        reset_at = datetime.combine(
            now.date() + timedelta(days=1),
            time.min,
            tzinfo=timezone.utc,
        )
        retry_after = max(1, int((reset_at - now).total_seconds()))
        redis_key = f"rate_limit:export:{client_id}:{day}"
        mem_key = (client_id, day)

        if self._redis:
            try:
                current = await self._redis.get(redis_key)
                if current and int(current) >= limit:
                    return RateLimitResult(False, 0, retry_after)
                
                pipeline = self._redis.pipeline()
                pipeline.incr(redis_key)
                pipeline.expire(redis_key, retry_after)
                result = await pipeline.execute()
                current_count = int(result[0])
                
                if current_count > limit:
                    return RateLimitResult(False, 0, retry_after)
                    
                return RateLimitResult(True, limit - current_count, retry_after)
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Redis rate limit error: {e}")

        with self._lock:
            self._counts = {
                stored_key: count
                for stored_key, count in self._counts.items()
                if stored_key[1] == day
            }
            current = self._counts.get(mem_key, 0)
            if current >= limit:
                return RateLimitResult(False, 0, retry_after)
            current += 1
            self._counts[mem_key] = current
            return RateLimitResult(True, limit - current, retry_after)

    async def reset(self) -> None:
        """Clears counters for tests and controlled application maintenance."""

        with self._lock:
            self._counts.clear()
            
        if self._redis:
            try:
                keys = await self._redis.keys("rate_limit:export:*")
                if keys:
                    await self._redis.delete(*keys)
            except Exception:
                pass


def resolve_client_ip(request: Request, trust_proxy_headers: bool = False) -> str:
    """Uses X-Forwarded-For only when a trusted reverse proxy is configured."""

    candidates: list[str] = []
    if trust_proxy_headers:
        forwarded_for = request.headers.get("X-Forwarded-For", "")
        if forwarded_for:
            candidates.append(forwarded_for.split(",", 1)[0].strip())
    if request.client and request.client.host:
        candidates.append(request.client.host.strip())

    for candidate in candidates:
        try:
            return str(ipaddress.ip_address(candidate))
        except ValueError:
            if candidate and candidate.lower() == "testclient":
                return candidate.lower()
    return "unknown"


export_rate_limiter = DailyExportRateLimiter()


async def enforce_public_demo_export_limit(
    request: Request,
    current_user: object | None = None,
) -> None:
    authorization = request.headers.get("Authorization", "")
    token = authorization[7:].strip() if authorization.startswith("Bearer ") else ""
    try:
        claims = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM]) if token else {}
    except JWTError:
        claims = {}
    if (
        getattr(current_user, "role", None) == "admin"
        and getattr(current_user, "mfa_enabled", False)
        and claims.get("amr") == "totp"
        and claims.get("sub") == str(getattr(current_user, "id", ""))
    ):
        return

    policy = public_demo_policy()
    if not policy.enabled:
        return

    client_ip = resolve_client_ip(request, policy.trust_proxy_headers)
    result = await export_rate_limiter.consume(
        client_ip,
        policy.max_exports_per_ip_per_day,
    )
    if result.allowed:
        return

    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail=(
            "Public demo günlük export sınırına ulaştınız "
            f"({policy.max_exports_per_ip_per_day} export/gün). "
            "Lütfen daha sonra tekrar deneyin."
        ),
        headers={"Retry-After": str(result.retry_after_seconds)},
    )
