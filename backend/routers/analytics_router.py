from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.config import is_product_metrics_enabled, public_demo_policy
from backend.database import get_db
from backend.services.product_metrics_service import increment_daily_event
from backend.services.rate_limit_service import export_rate_limiter, resolve_client_ip


router = APIRouter(prefix="/api/analytics", tags=["analytics"])


class ProductEvent(BaseModel):
    event: Literal[
        "catalog_view",
        "source_upload_selected",
        "source_template_selected",
        "upload_succeeded",
        "upload_failed",
        "recording_started",
        "export_succeeded",
        "export_failed",
    ]


@router.post("/events", status_code=status.HTTP_202_ACCEPTED)
async def record_product_event(
    payload: ProductEvent,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    if not is_product_metrics_enabled():
        raise HTTPException(status_code=404, detail="Product metrics are disabled.")

    client_ip = resolve_client_ip(request, public_demo_policy().trust_proxy_headers)
    limit = await export_rate_limiter.consume(
        f"ip:{client_ip}",
        200,
        namespace="productmetric",
    )
    if not limit.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Daily product event limit reached.",
            headers={"Retry-After": str(limit.retry_after_seconds)},
        )

    increment_daily_event(db, payload.event)
    return {"status": "accepted"}
