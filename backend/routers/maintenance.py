from __future__ import annotations

import asyncio
import hmac
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from backend.config import app_environment, maintenance_token
from backend.services.cleanup_service import CleanupService


router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])
cleanup_service = CleanupService()


def verify_maintenance_access(
    provided_token: Annotated[
        str | None,
        Header(alias="X-Maintenance-Token"),
    ] = None,
) -> None:
    expected_token = maintenance_token()
    if expected_token:
        if not provided_token or not hmac.compare_digest(provided_token, expected_token):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Maintenance token geçersiz veya eksik.",
            )
        return

    if app_environment() not in {"development", "dev", "local", "test"}:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Maintenance endpoint'i bu ortamda devre dışı. "
                "MAINTENANCE_TOKEN yapılandırın."
            ),
        )


@router.post("/cleanup")
async def cleanup_files(
    older_than_hours: int = Query(default=24, ge=1, le=8760),
    _: None = Depends(verify_maintenance_access),
) -> dict[str, int | str]:
    result = await asyncio.to_thread(
        cleanup_service.cleanup_old_files,
        older_than_hours,
    )
    return {
        "status": "completed",
        **result.as_dict(),
    }
