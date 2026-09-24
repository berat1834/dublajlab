from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import allowed_origins, ensure_media_directories
from backend.models import HealthResponse
from backend.routers.maintenance import router as maintenance_router
from backend.routers.templates import router as templates_router
from backend.routers.video import ffmpeg_service, router as video_router


logger = logging.getLogger("dublajlab")


@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    ensure_media_directories()
    ffmpeg_status = await asyncio.to_thread(ffmpeg_service.check_availability)
    application.state.ffmpeg_status = ffmpeg_status.as_dict()
    if ffmpeg_status.available:
        logger.info("Medya araçları hazır: %s", ffmpeg_status.version)
    else:
        logger.warning("Medya işlemleri devre dışı: %s", ffmpeg_status.message)
    yield


app = FastAPI(
    title="DublajLab API",
    version="0.2.0",
    description="Kendi sesinle Türkçe dublaj videosu üretme API'si.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(video_router)
app.include_router(templates_router)
app.include_router(maintenance_router)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    _: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    errors = []
    for error in exc.errors():
        field = ".".join(str(part) for part in error.get("loc", []) if part != "body")
        error_type = error.get("type", "")
        if field == "text" and error_type == "string_too_long":
            message = "Dublaj metni en fazla 500 karakter olabilir."
        elif field == "text":
            message = "Dublaj metni boş bırakılamaz."
        elif field == "voice_style":
            message = "Geçersiz ses stili seçildi."
        elif field == "file":
            message = "Bir video dosyası seçin."
        else:
            message = "Bu alan geçersiz veya eksik."
        errors.append({"field": field or "istek", "message": message})
    return JSONResponse(
        status_code=422,
        content={"detail": "Gönderilen alanları kontrol edin.", "errors": errors},
    )


@app.get("/api/health", response_model=HealthResponse, tags=["health"])
async def health() -> HealthResponse:
    return HealthResponse(status="ok", app="DublajLab", version="0.2.0")


@app.get("/api/system/ffmpeg", tags=["system"])
async def ffmpeg_status() -> dict[str, str | bool | None]:
    status_result = await asyncio.to_thread(ffmpeg_service.check_availability)
    return status_result.as_dict()
