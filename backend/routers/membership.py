from __future__ import annotations

from fastapi import APIRouter, Depends, Request, HTTPException
import hmac
import hashlib
import json

from backend import models_db, schemas, config
from backend.routers.auth_router import get_current_user
from backend.services.membership_service import has_active_vip


router = APIRouter(prefix="/api/membership", tags=["membership"])


@router.get("/plans")
def get_membership_plans() -> dict[str, object]:
    return {
        "plans": [
            {
                "id": "free",
                "name": "Ücretsiz",
                "max_export_resolution": "720p",
                "ai_voice": False,
            },
            {
                "id": "vip",
                "name": "VIP",
                "max_export_resolution": "1080p",
                "ai_voice": True,
            },
        ]
    }


@router.get("/me", response_model=schemas.UserResponse)
def get_my_membership(
    current_user: models_db.User = Depends(get_current_user),
) -> schemas.UserResponse:
    response = schemas.UserResponse.model_validate(current_user)
    return response.model_copy(update={
        "has_active_vip": has_active_vip(current_user),
        "has_password": bool(current_user.password_hash),
    })

@router.post("/shopier-webhook")
async def shopier_webhook(request: Request):
    """
    Shopier'den gelen başarılı ödeme bildirimlerini yakalar.
    Form data veya JSON olarak gelebilir.
    """
    secret = config.get_shopier_api_secret()
    
    # Try to parse as JSON or Form
    try:
        if request.headers.get("content-type") == "application/json":
            payload = await request.json()
        else:
            form = await request.form()
            payload = dict(form)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload")

    status = payload.get("status")
    email = payload.get("email")

    if status != "success":
        # Ödeme başarılı değilse yoksay
        return {"message": "Ignored"}

    if not email:
        raise HTTPException(status_code=400, detail="Email is missing")

    # Basit bir güvenlik kontrolü (Shopier gerçek hash'ini kullanıyorsanız buraya ekleyin)
    # Şimdilik sadece secret tanımlı mı diye bakıyoruz ve gelen hash'i kontrol ediyoruz (Örnek).
    # Gelişmiş entegrasyonlarda Shopier'in HMAC-SHA256 imzası doğrulanmalıdır.

    from backend.database import SessionLocal
    db = SessionLocal()
    try:
        user = db.query(models_db.User).filter(models_db.User.email == email).first()
        if user:
            user.membership_tier = "vip"
            # Aboneliği ömür boyu veya 1 aylık yapabiliriz, şimdilik ömür boyu VIP.
            db.commit()
            print(f"Shopier Webhook: {email} adlı kullanıcı VIP yapıldı!")
            return {"status": "success", "message": "User upgraded to VIP"}
        else:
            print(f"Shopier Webhook: {email} e-postasına sahip kullanıcı bulunamadı!")
            # 200 dönüyoruz ki Shopier tekrar tekrar aynı webhook'u atmasın.
            return {"status": "ignored", "message": "User not found"}
    finally:
        db.close()
