from __future__ import annotations

from collections import defaultdict, deque
from threading import RLock
from time import time

from fastapi import HTTPException, status


class AuthAttemptLimiter:
    """Small process-local failed-login limiter; production multi-worker limits need Redis."""

    def __init__(self, max_attempts: int = 10, window_seconds: int = 900) -> None:
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._attempts: dict[str, deque[float]] = defaultdict(deque)
        self._lock = RLock()

    def _active_attempts(self, key: str, now: float) -> deque[float]:
        attempts = self._attempts[key]
        cutoff = now - self.window_seconds
        while attempts and attempts[0] <= cutoff:
            attempts.popleft()
        return attempts

    def enforce(self, key: str) -> None:
        now = time()
        with self._lock:
            attempts = self._active_attempts(key, now)
            if len(attempts) < self.max_attempts:
                return
            retry_after = max(1, int(attempts[0] + self.window_seconds - now))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Çok fazla başarısız giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.",
            headers={"Retry-After": str(retry_after)},
        )

    def record_failure(self, key: str) -> None:
        now = time()
        with self._lock:
            self._active_attempts(key, now).append(now)

    def clear(self, key: str) -> None:
        with self._lock:
            self._attempts.pop(key, None)

    def reset(self) -> None:
        with self._lock:
            self._attempts.clear()


auth_attempt_limiter = AuthAttemptLimiter()
