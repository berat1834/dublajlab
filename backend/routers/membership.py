from __future__ import annotations

from fastapi import APIRouter, Depends

from backend import models_db, schemas
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
    return response.model_copy(update={"has_active_vip": has_active_vip(current_user)})
