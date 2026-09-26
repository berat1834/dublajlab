from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    display_name: str = Field(min_length=2, max_length=50)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    display_name: str
    avatar_url: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class ExportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    project_id: str
    output_video_id: str
    download_url: Optional[str] = None
    duration_seconds: Optional[str] = None
    file_size_bytes: Optional[str] = None
    created_at: datetime

class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: Optional[str] = None
    source_type: str
    template_id: Optional[str] = None
    title: str
    duration_seconds: Optional[str] = None
    status: str
    visibility: str
    moderation_status: str
    created_at: datetime
    updated_at: datetime

    # We can include exports if needed, but not strictly necessary for MVP library
    # exports: list[ExportResponse] = []

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    visibility: Optional[str] = None
    moderation_status: Optional[str] = None

class PublicDubResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    project_id: str
    title: str
    display_name: str
    created_at: datetime
    duration_seconds: Optional[str] = None
    download_url: Optional[str] = None
    view_count: int = 0
    like_count: int = 0
    liked_by_me: bool = False

class ContentReportCreate(BaseModel):
    reason: str
    details: Optional[str] = None

class ContentReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    project_id: str
    reporter_user_id: Optional[str] = None
    reason: str
    details: Optional[str] = None
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None

class CommentCreate(BaseModel):
    body: str

class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    project_id: str
    user_id: str
    display_name: str
    body: str
    created_at: datetime
    is_mine: bool = False
