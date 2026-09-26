from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx
import os
from datetime import timedelta
import logging

from backend.database import get_db
import backend.models_db as models_db
import backend.auth as auth
import backend.config as config

router = APIRouter()
logger = logging.getLogger("dublajlab")

# OAuth configs from ENV
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")

def get_frontend_url():
    # Attempt to derive frontend URL from allowed_origins
    origins = config.allowed_origins()
    for o in origins:
        if "vercel.app" in o or "localhost" in o:
            return o
    return origins[0] if origins else "http://localhost:5173"

@router.get("/google/login")
async def google_login(request: Request):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth yapılandırılmamış.")
    
    redirect_uri = request.url_for("google_callback")
    scope = "openid email profile"
    url = f"https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={GOOGLE_CLIENT_ID}&redirect_uri={redirect_uri}&scope={scope}&access_type=offline"
    return RedirectResponse(url)

@router.get("/google/callback")
async def google_callback(request: Request, code: str, db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth yapılandırılmamış.")
        
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
        
    # Generate JWT
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    app_token = auth.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    frontend_url = get_frontend_url()
    return RedirectResponse(f"{frontend_url}/oauth-callback?token={app_token}")

@router.get("/discord/login")
async def discord_login(request: Request):
    if not DISCORD_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Discord OAuth yapılandırılmamış.")
    
    redirect_uri = request.url_for("discord_callback")
    scope = "identify email"
    url = f"https://discord.com/api/oauth2/authorize?client_id={DISCORD_CLIENT_ID}&redirect_uri={redirect_uri}&response_type=code&scope={scope}"
    return RedirectResponse(url)

@router.get("/discord/callback")
async def discord_callback(request: Request, code: str, db: Session = Depends(get_db)):
    if not DISCORD_CLIENT_ID or not DISCORD_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Discord OAuth yapılandırılmamış.")
        
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
        
    # Generate JWT
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    app_token = auth.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    frontend_url = get_frontend_url()
    return RedirectResponse(f"{frontend_url}/oauth-callback?token={app_token}")
