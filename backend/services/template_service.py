from __future__ import annotations

import json
from pathlib import Path

from pydantic import TypeAdapter, ValidationError

from backend.models import VideoTemplate


DEFAULT_TEMPLATE_DATA_FILE = (
    Path(__file__).resolve().parents[1] / "data" / "templates" / "templates.json"
)
template_list_adapter = TypeAdapter(list[VideoTemplate])


class TemplateCatalogError(RuntimeError):
    """Raised when the local template catalog cannot be parsed or validated."""


class TemplateService:
    def __init__(self, data_file: Path = DEFAULT_TEMPLATE_DATA_FILE) -> None:
        self.data_file = data_file

    def list_templates(self) -> list[VideoTemplate]:
        try:
            raw_data = json.loads(self.data_file.read_text(encoding="utf-8"))
            return template_list_adapter.validate_python(raw_data)
        except (OSError, json.JSONDecodeError, ValidationError) as exc:
            raise TemplateCatalogError(
                "Hazır sahne kataloğu okunamadı veya metadata geçersiz."
            ) from exc

    def get_template(self, template_id: str) -> VideoTemplate | None:
        return next(
            (item for item in self.list_templates() if item.id == template_id),
            None,
        )
