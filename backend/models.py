from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class VoiceStyle(str, Enum):
    ANNOUNCER = "announcer"
    ROBOT = "robot"
    DRAMATIC = "dramatic"
    DOCUMENTARY = "documentary"
    ENERGETIC = "energetic"


class HealthResponse(BaseModel):
    status: str
    app: str
    version: str


class UploadResponse(BaseModel):
    video_id: str
    original_filename: str
    duration_seconds: float
    size_bytes: int
    preview_url: str


class ProcessRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    video_id: str = Field(min_length=1)
    text: str = Field(min_length=1, max_length=500)
    voice_style: VoiceStyle
    mute_original_audio: bool = True
    burn_subtitles: bool = True

    @field_validator("text")
    @classmethod
    def text_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Dublaj metni boş bırakılamaz.")
        return value.strip()


class ProcessResponse(BaseModel):
    job_id: str
    status: str
    output_video_id: str
    download_url: str


class DubbingLine(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    id: str = Field(min_length=1, max_length=80, pattern=r"^[a-zA-Z0-9_-]+$")
    start: float = Field(ge=0)
    end: float = Field(gt=0)
    text: str = Field(min_length=1, max_length=300)

    @field_validator("text")
    @classmethod
    def line_text_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Replik metni boş bırakılamaz.")
        return value.strip()
