from __future__ import annotations

import asyncio

from fastapi import APIRouter, Query

from backend.services.cleanup_service import CleanupService


router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])
cleanup_service = CleanupService()


@router.post("/cleanup")
async def cleanup_files(
    older_than_hours: int = Query(default=24, ge=1, le=8760),
) -> dict[str, int | str]:
    result = await asyncio.to_thread(
        cleanup_service.cleanup_old_files,
        older_than_hours,
    )
    return {
        "status": "completed",
        **result.as_dict(),
    }

