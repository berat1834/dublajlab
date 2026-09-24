from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from backend.models import VideoTemplate
from backend.services.template_service import TemplateCatalogError, TemplateService


router = APIRouter(prefix="/api/templates", tags=["templates"])
template_service = TemplateService()


def _catalog_or_service_error() -> list[VideoTemplate]:
    try:
        return template_service.list_templates()
    except TemplateCatalogError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.get("", response_model=list[VideoTemplate])
async def list_templates() -> list[VideoTemplate]:
    return _catalog_or_service_error()


@router.get("/{template_id}", response_model=VideoTemplate)
async def get_template(template_id: str) -> VideoTemplate:
    templates = _catalog_or_service_error()
    template = next((item for item in templates if item.id == template_id), None)
    if template is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hazır sahne bulunamadı.",
        )
    return template
