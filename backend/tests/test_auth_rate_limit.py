import pytest
from fastapi import HTTPException

from backend.services.auth_rate_limit_service import AuthAttemptLimiter


def test_failed_login_attempts_are_limited():
    limiter = AuthAttemptLimiter(max_attempts=2, window_seconds=900)
    limiter.record_failure("ip:user@example.com")
    limiter.record_failure("ip:user@example.com")

    with pytest.raises(HTTPException) as exc_info:
        limiter.enforce("ip:user@example.com")

    assert exc_info.value.status_code == 429
    assert exc_info.value.headers["Retry-After"]


def test_successful_login_can_clear_failed_attempts():
    limiter = AuthAttemptLimiter(max_attempts=1, window_seconds=900)
    limiter.record_failure("ip:user@example.com")
    limiter.clear("ip:user@example.com")

    limiter.enforce("ip:user@example.com")
