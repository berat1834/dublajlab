from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class VoiceStyle(str, Enum):
    ANNOUNCER = "announcer"
    ROBOT = "robot"
    DRAMATIC = "dramatic"
    DOCUMENTARY = "documentary"
    ENERGETIC = "energetic"


class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


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


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress: int = Field(ge=0, le=100)
    message: str
    output_video_id: str | None = None
    download_url: str | None = None
    error: str | None = None


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


class VideoTemplate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    id: str = Field(min_length=1, max_length=80, pattern=r"^[a-zA-Z0-9_-]+$")
    title: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1, max_length=500)
    duration_seconds: float = Field(gt=0, le=60)
    video_url: str | None = Field(default=None, max_length=500)
    license: str = Field(min_length=1, max_length=200)
    source: str = Field(min_length=1, max_length=500)
    lines: list[DubbingLine] = Field(min_length=1, max_length=20)

    @field_validator("title", "category", "description", "license", "source")
    @classmethod
    def required_text_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Template metin alanları boş bırakılamaz.")
        return value.strip()

    @field_validator("video_url")
    @classmethod
    def empty_video_url_is_none(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None

    @model_validator(mode="after")
    def validate_timeline(self) -> "VideoTemplate":
        line_ids = [line.id for line in self.lines]
        if len(set(line_ids)) != len(line_ids):
            raise ValueError("Template replik kimlikleri benzersiz olmalıdır.")
        if any(line.end <= line.start for line in self.lines):
            raise ValueError("Template replik bitişi başlangıçtan sonra olmalıdır.")
        if any(line.end > self.duration_seconds for line in self.lines):
            raise ValueError("Template replikleri video süresini aşamaz.")
        return self
