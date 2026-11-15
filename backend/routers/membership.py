from __future__ import annotations

from fastapi import APIRouter, Depends

from backend import models_db, schemas, config
from backend.routers.auth_router import get_current_user
from backend.services.membership_service import has_active_vip


router = APIRouter(prefix="/api/membership", tags=["membership"])


@router.get("/plans")
def get_membership_plans() -> dict[str, object]:
    return {
        "checkout_enabled": config.is_checkout_available(),
        "plans": [
            {
                "id": "free",
                "name": "Ücretsiz",
                "max_export_resolution": "720p",
                "ai_voice": False,
                "price_amount": 0,
                "price_currency": config.get_vip_price_currency(),
                "billing_period": "month",
            },
            {
                "id": "vip",
                "name": "VIP",
                "max_export_resolution": "1080p",
                "ai_voice": True,
                "price_amount": config.get_vip_price_amount(),
                "price_currency": config.get_vip_price_currency(),
                "billing_period": "month",
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
        "discord_linked": bool(current_user.discord_id),
    })
