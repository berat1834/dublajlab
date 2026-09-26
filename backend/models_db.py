import uuid
from sqlalchemy import Boolean, Column, String, DateTime, Integer, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    # Use string for UUID if SQLite, but SQLAlchemy handles UUID objects ok with String(36)
    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    avatar_url = Column(String(255), nullable=True)
    role = Column(String(50), default="user", nullable=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class DubbingProject(Base):
    __tablename__ = "dubbing_projects"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), index=True, nullable=True) # Optional link to User
    source_type = Column(String(50), nullable=False) # 'upload' or 'template'
    template_id = Column(String(100), nullable=True)
    title = Column(String(255), nullable=False)
    duration_seconds = Column(String(50), nullable=True)
    status = Column(String(50), default="processing", nullable=False) # processing, completed, failed
    visibility = Column(String(50), default="private", nullable=False) # private, public
    moderation_status = Column(String(50), default="visible", nullable=False) # visible, hidden, under_review
    view_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class DubbingLike(Base):
    __tablename__ = "dubbing_likes"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), index=True, nullable=False)
    user_id = Column(String(36), index=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # User can only like a project once
    __table_args__ = (
        UniqueConstraint('project_id', 'user_id', name='uq_project_user_like'),
    )

class DubbingComment(Base):
    __tablename__ = "dubbing_comments"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), index=True, nullable=False)
    user_id = Column(String(36), index=True, nullable=False)
    body = Column(String(500), nullable=False)
    status = Column(String(50), default="visible", nullable=False) # visible, hidden

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    hidden_at = Column(DateTime(timezone=True), nullable=True)
    hidden_by = Column(String(36), nullable=True)

class ContentReport(Base):
    __tablename__ = "content_reports"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), index=True, nullable=False)
    reporter_user_id = Column(String(36), index=True, nullable=True) # nullable for anonymous reporters
    reason = Column(String(50), nullable=False)
    details = Column(String(1000), nullable=True)
    status = Column(String(50), default="pending", nullable=False) # pending, reviewed, dismissed, action_taken

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(String(36), nullable=True)

class DubbingExport(Base):
    __tablename__ = "dubbing_exports"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), index=True, nullable=False)
    output_video_id = Column(String(100), nullable=False)
    download_url = Column(String(500), nullable=True)
    duration_seconds = Column(String(50), nullable=True)
    file_size_bytes = Column(String(50), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
