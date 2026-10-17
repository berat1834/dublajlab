from __future__ import annotations

import os
from urllib.parse import urlsplit

from fastapi import HTTPException, Request, Response, status

from backend import auth, config


SESSION_COOKIE_NAME = "dublajlab_session"
UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}


def cookie_only_enabled() -> bool:
    return os.getenv("AUTH_COOKIE_ONLY", "false").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


def session_cookie_enabled() -> bool:
    return cookie_only_enabled() or os.getenv(
        "AUTH_SESSION_COOKIE_ENABLED", "false"
    ).strip().lower() in {"1", "true", "yes", "on"}


def set_session_cookie(response: Response, token: str) -> None:
    if not session_cookie_enabled():
        return
    response.set_cookie(
        SESSION_COOKIE_NAME,
        token,
        max_age=auth.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=config.app_environment() == "production",
        samesite="lax",
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        SESSION_COOKIE_NAME,
        httponly=True,
        secure=config.app_environment() == "production",
        samesite="lax",
        path="/",
    )


def _origin(value: str | None) -> str | None:
    if not value:
        return None
    parsed = urlsplit(value.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}".lower()


def enforce_cookie_csrf(request: Request) -> None:
    """Reject unsafe cookie-authenticated requests from untrusted sites.

    The session cookie is SameSite=Lax, and this Origin/Sec-Fetch-Site check is a
    second layer for state-changing requests. Bearer clients are not affected.
    """

    if request.method.upper() not in UNSAFE_METHODS:
        return

    origin = _origin(request.headers.get("origin"))
    allowed = {_origin(value) for value in config.allowed_origins()}
    allowed.discard(None)
    if origin in allowed:
        return

    if not origin and request.headers.get("sec-fetch-site", "").lower() in {
        "same-origin",
        "same-site",
    }:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Oturum isteğinin kaynağı doğrulanamadı.",
    )


def resolve_session_token(request: Request, bearer_token: str | None) -> str | None:
    if bearer_token:
        return bearer_token
    cookie_token = request.cookies.get(SESSION_COOKIE_NAME)
    if cookie_token:
        enforce_cookie_csrf(request)
    return cookie_token
