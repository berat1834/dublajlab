from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx
import os
from datetime import timedelta
from urllib.parse import urlencode, urlsplit
import logging
import base64
import hashlib
import hmac
import json
import secrets

from backend.database import get_db
import backend.models_db as models_db
import backend.auth as auth
import backend.config as config
from backend.services.admin_role_service import grant_configured_admin_role

router = APIRouter()
logger = logging.getLogger("dublajlab")

# OAuth configs from ENV
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")

CANONICAL_DOMAIN = "dublajlab.com.tr"
OAUTH_STATE_COOKIE = "dublajlab_oauth_state"


def _normalize_origin(value: str | None) -> str | None:
    if not value:
        return None
    parts = urlsplit(value.strip())
    if parts.scheme not in ("http", "https") or not parts.netloc:
        return None
    return f"{parts.scheme}://{parts.netloc}".lower()


def resolve_return_origin(value: str | None) -> str | None:
    """Return the origin only if it is an allowlisted frontend origin.

    Prevents open redirects: arbitrary origins from the query/state are ignored.
    """
    origin = _normalize_origin(value)
    if not origin:
        return None
    allowed = {o.rstrip("/").lower() for o in config.allowed_origins()}
    if origin not in allowed:
        return None
    if config.app_environment() == "production" and not origin.startswith("https://"):
        return None
    return origin


def get_frontend_url():
    configured_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
    environment = config.app_environment()
    # Eski bir *.vercel.app FRONTEND_URL değeri, APP_ENV ne olursa olsun
    # canonical özel domaini ezmemeli.
    configured_is_stale = "vercel.app" in configured_url
    if configured_url and not configured_is_stale and environment != "production":
        return configured_url

    # Production'da eski bir Vercel FRONTEND_URL değeri canonical özel domaini
    # ezmemeli. Böylece OAuth dönüşü kullanıcıyı farklı bir origin'e taşımaz.
    origins = config.allowed_origins()
    if environment != "production" and not configured_is_stale:
        for origin in origins:
            if "localhost" in origin:
                return origin.rstrip("/")
    if configured_url and CANONICAL_DOMAIN in configured_url:
        return configured_url
    for origin in origins:
        if CANONICAL_DOMAIN in origin:
            return origin.rstrip("/")
    if configured_url:
        return configured_url
    for o in origins:
        if "vercel.app" in o:
            return o.rstrip("/")
    for origin in origins:
        if "localhost" in origin:
            return origin.rstrip("/")
    return origins[0].rstrip("/") if origins else "http://localhost:5173"

def _encode_state(origin: str | None, nonce: str) -> str:
    payload = json.dumps(
        {"origin": origin, "nonce": nonce}, separators=(",", ":")
    ).encode("utf-8")
    encoded = base64.urlsafe_b64encode(payload).decode("ascii").rstrip("=")
    signature = hmac.new(
        auth.SECRET_KEY.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256
    ).hexdigest()
    return f"{encoded}.{signature}"


def _decode_state(state: str | None) -> tuple[str | None, str]:
    try:
        encoded, signature = (state or "").split(".", 1)
        expected = hmac.new(
            auth.SECRET_KEY.encode("utf-8"), encoded.encode("ascii"), hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("invalid signature")
        padding = "=" * (-len(encoded) % 4)
        payload = json.loads(base64.urlsafe_b64decode(encoded + padding))
        nonce = payload.get("nonce")
        if not isinstance(nonce, str) or not nonce:
            raise ValueError("missing nonce")
        return resolve_return_origin(payload.get("origin")), nonce
    except (ValueError, TypeError, json.JSONDecodeError):
        raise HTTPException(status_code=400, detail="OAuth güvenlik doğrulaması başarısız.")


def _frontend_redirect(origin: str | None, token: str) -> RedirectResponse:
    frontend_url = origin or get_frontend_url()
    response = RedirectResponse(f"{frontend_url}/oauth-callback#token={token}")
    response.delete_cookie(OAUTH_STATE_COOKIE, path="/api/auth")
    return response


def _oauth_login_redirect(url: str, nonce: str) -> RedirectResponse:
    response = RedirectResponse(url)
    response.set_cookie(
        OAUTH_STATE_COOKIE,
        nonce,
        max_age=600,
        httponly=True,
        secure=config.app_environment() == "production",
        samesite="lax",
        path="/api/auth",
    )
    return response


def _verified_callback_origin(request: Request, state: str | None) -> str | None:
    origin, nonce = _decode_state(state)
    cookie_nonce = request.cookies.get(OAUTH_STATE_COOKIE)
    if not cookie_nonce or not hmac.compare_digest(cookie_nonce, nonce):
        raise HTTPException(status_code=400, detail="OAuth oturumu geçersiz veya süresi dolmuş.")
    return origin


@router.get("/google/login")
async def google_login(request: Request, return_to: str | None = None):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth yapılandırılmamış.")
    
    redirect_uri = request.url_for("google_callback")
    params = {
        "response_type": "code",
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": str(redirect_uri),
        "scope": "openid email profile",
        "access_type": "offline",
    }
    origin = resolve_return_origin(return_to)
    nonce = secrets.token_urlsafe(32)
    params["state"] = _encode_state(origin, nonce)
    return _oauth_login_redirect(
        f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}", nonce
    )

@router.get("/google/callback")
async def google_callback(request: Request, code: str, state: str | None = None, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth yapılandırılmamış.")
        
    origin = _verified_callback_origin(request, state)
    redirect_uri = request.url_for("google_callback")
    
    async with httpx.AsyncClient() as client:
        token_res = await client.post("https://oauth2.googleapis.com/token", data={
            "grant_type": "authorization_code",
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": str(redirect_uri),
            "code": code
        })
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Google token alınamadı.")
        
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        
        user_res = await client.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={
            "Authorization": f"Bearer {access_token}"
        })
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Google kullanıcı bilgileri alınamadı.")
            
        user_data = user_res.json()
        
    email = user_data.get("email")
    google_id = user_data.get("id")
    name = user_data.get("name") or email.split("@")[0]
    
    # Process user
    user = db.query(models_db.User).filter((models_db.User.email == email) | (models_db.User.google_id == google_id)).first()
    
    if not user:
        user = models_db.User(
            email=email,
            display_name=name,
            google_id=google_id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.google_id:
        user.google_id = google_id
        db.commit()

    grant_configured_admin_role(user, db)
        
    # Generate JWT
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    app_token = auth.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return _frontend_redirect(origin, app_token)

@router.get("/discord/login")
async def discord_login(request: Request, return_to: str | None = None):
    if not DISCORD_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Discord OAuth yapılandırılmamış.")
    
    redirect_uri = request.url_for("discord_callback")
    params = {
        "client_id": DISCORD_CLIENT_ID,
        "redirect_uri": str(redirect_uri),
        "response_type": "code",
        "scope": "identify email",
    }
    origin = resolve_return_origin(return_to)
    nonce = secrets.token_urlsafe(32)
    params["state"] = _encode_state(origin, nonce)
    return _oauth_login_redirect(
        f"https://discord.com/api/oauth2/authorize?{urlencode(params)}", nonce
    )

@router.get("/discord/callback")
async def discord_callback(request: Request, code: str, state: str | None = None, db: Session = Depends(get_db)):
    if not DISCORD_CLIENT_ID or not DISCORD_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Discord OAuth yapılandırılmamış.")
        
    origin = _verified_callback_origin(request, state)
    redirect_uri = request.url_for("discord_callback")
    
    async with httpx.AsyncClient() as client:
        token_res = await client.post("https://discord.com/api/oauth2/token", data={
            "grant_type": "authorization_code",
            "client_id": DISCORD_CLIENT_ID,
            "client_secret": DISCORD_CLIENT_SECRET,
            "redirect_uri": str(redirect_uri),
            "code": code
        }, headers={"Content-Type": "application/x-www-form-urlencoded"})
        
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Discord token alınamadı.")
            
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        
        user_res = await client.get("https://discord.com/api/users/@me", headers={
            "Authorization": f"Bearer {access_token}"
        })
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Discord kullanıcı bilgileri alınamadı.")
            
        user_data = user_res.json()
        
    email = user_data.get("email")
    discord_id = user_data.get("id")
    name = user_data.get("global_name") or user_data.get("username")
    
    if not email:
        raise HTTPException(status_code=400, detail="Discord hesabı e-posta adresi içermiyor.")
        
    # Process user
    user = db.query(models_db.User).filter((models_db.User.email == email) | (models_db.User.discord_id == discord_id)).first()
    
    if not user:
        user = models_db.User(
            email=email,
            display_name=name,
            discord_id=discord_id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.discord_id:
        user.discord_id = discord_id
        db.commit()

    grant_configured_admin_role(user, db)
        
    # Generate JWT
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    app_token = auth.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return _frontend_redirect(origin, app_token)
