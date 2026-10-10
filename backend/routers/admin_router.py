import asyncio
import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import case, func, or_
from typing import List, Dict, Any, Literal
from datetime import datetime, timedelta, timezone

from backend.database import get_db
import backend.models_db as models_db
import backend.schemas as schemas
from backend.routers.auth_router import get_current_user
from backend.services.membership_service import has_active_vip
from backend.config import get_redis_url, MEDIA_ROOT, is_shopier_enabled, lip_sync_availability, STORAGE_PROVIDER
from backend.routers.video import ffmpeg_service
from backend.services.storage_provider import get_storage_provider

router = APIRouter(prefix="/api/admin", tags=["admin"])


def get_admin_user(current_user: models_db.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Yalnızca yöneticiler erişebilir.")
    return current_user


def _user_response(user: models_db.User) -> schemas.UserResponse:
    response = schemas.UserResponse.model_validate(user)
    return response.model_copy(update={
        "has_active_vip": has_active_vip(user),
        "has_password": bool(user.password_hash),
    })


def _record_audit(
    db: Session,
    admin: models_db.User,
    action: str,
    target_type: str,
    target_id: str,
    details: str | None = None,
) -> None:
    db.add(models_db.AdminAuditLog(
        admin_user_id=admin.id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
    ))


@router.get("/users", response_model=List[schemas.UserResponse])
def list_users(
    q: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: models_db.User = Depends(get_admin_user),
):
    query = db.query(models_db.User)
    if q and q.strip():
        pattern = f"%{q.strip()}%"
        query = query.filter(or_(
            models_db.User.email.ilike(pattern),
            models_db.User.display_name.ilike(pattern),
        ))
    users = query.order_by(models_db.User.created_at.desc()).limit(limit).all()
    return [_user_response(user) for user in users]


@router.patch("/users/{user_id}/membership", response_model=schemas.UserResponse)
def update_user_membership(
    user_id: str,
    payload: schemas.MembershipAdminUpdate,
    db: Session = Depends(get_db),
    admin: models_db.User = Depends(get_admin_user),
):
    user = db.query(models_db.User).filter(models_db.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")

    user.membership_tier = payload.tier
    user.membership_expires_at = (
        datetime.now(timezone.utc) + timedelta(days=payload.duration_days)
        if payload.tier == "vip"
        else None
    )
    _record_audit(
        db, admin, "membership_updated", "user", user.id,
        f"tier={payload.tier};duration_days={payload.duration_days}",
    )
    db.commit()
    db.refresh(user)
    return _user_response(user)

@router.get("/reports", response_model=List[schemas.ContentReportResponse])
def get_reports(db: Session = Depends(get_db), admin: models_db.User = Depends(get_admin_user)):
    reports = db.query(models_db.ContentReport).order_by(
        case((models_db.ContentReport.status == "pending", 0), else_=1),
        models_db.ContentReport.created_at.desc()
    ).all()
    return reports

@router.patch("/reports/{report_id}")
def update_report_status(
    report_id: str,
    status: Literal["reviewed", "dismissed", "action_taken"],
    db: Session = Depends(get_db),
    admin: models_db.User = Depends(get_admin_user)
):
    report = db.query(models_db.ContentReport).filter(models_db.ContentReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı.")

    report.status = status
    report.reviewed_at = datetime.now(timezone.utc)
    report.reviewed_by = admin.id
    _record_audit(db, admin, "report_status_updated", "report", report.id, f"status={status}")
    db.commit()
    db.refresh(report)
    return report

@router.patch("/projects/{project_id}/moderation")
def update_project_moderation(
    project_id: str,
    moderation_status: Literal["visible", "hidden"],
    db: Session = Depends(get_db),
    admin: models_db.User = Depends(get_admin_user)
):
    project = db.query(models_db.DubbingProject).filter(models_db.DubbingProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı.")

    project.moderation_status = moderation_status
    _record_audit(
        db, admin, "project_moderation_updated", "project", project.id,
        f"moderation_status={moderation_status}",
    )
    db.commit()
    db.refresh(project)
    return project

@router.patch("/comments/{comment_id}/hide")
def hide_comment(
    comment_id: str,
    db: Session = Depends(get_db),
    admin: models_db.User = Depends(get_admin_user)
):
    comment = db.query(models_db.DubbingComment).filter(models_db.DubbingComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı.")

    comment.status = "hidden"
    comment.hidden_at = datetime.now(timezone.utc)
    comment.hidden_by = admin.id
    _record_audit(db, admin, "comment_hidden", "comment", comment.id)
    db.commit()
    return {"message": "Yorum gizlendi."}


@router.get("/comments", response_model=List[schemas.AdminCommentResponse])
def list_comments(
    comment_status: Literal["visible", "hidden", "all"] = "visible",
    db: Session = Depends(get_db),
    admin: models_db.User = Depends(get_admin_user),
):
    query = db.query(models_db.DubbingComment, models_db.User.display_name).outerjoin(
        models_db.User, models_db.User.id == models_db.DubbingComment.user_id
    )
    if comment_status != "all":
        query = query.filter(models_db.DubbingComment.status == comment_status)
    rows = query.order_by(models_db.DubbingComment.created_at.desc()).limit(100).all()
    return [
        schemas.AdminCommentResponse(
            id=comment.id,
            project_id=comment.project_id,
            user_id=comment.user_id,
            display_name=display_name or "Silinmiş kullanıcı",
            body=comment.body,
            status=comment.status,
            created_at=comment.created_at,
        )
        for comment, display_name in rows
    ]


@router.get("/audit-logs", response_model=List[schemas.AdminAuditLogResponse])
def list_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: models_db.User = Depends(get_admin_user),
):
    return db.query(models_db.AdminAuditLog).order_by(
        models_db.AdminAuditLog.created_at.desc()
    ).limit(limit).all()

@router.get("/ops/metrics")
async def get_ops_metrics(
    db: Session = Depends(get_db),
    admin: models_db.User = Depends(get_admin_user)
) -> Dict[str, Any]:
    # 1. Health & Config
    redis_url = get_redis_url()
    redis_configured = bool(redis_url)
    redis_connected = False
    redis_error = None
    if redis_configured:
        try:
            import redis.asyncio as aioredis
            client = aioredis.from_url(redis_url)
            await client.ping()
            redis_connected = True
            await client.aclose()
        except Exception as exc:
            redis_error = type(exc).__name__

    media_root_exists = MEDIA_ROOT.exists()
    media_root_writable = os.access(MEDIA_ROOT, os.W_OK) if media_root_exists else False

    storage = get_storage_provider()
    storage_provider_name = STORAGE_PROVIDER
    storage_configured = storage.is_configured()
    storage_accessible = await asyncio.to_thread(storage.healthcheck)

    ffmpeg_status = await asyncio.to_thread(ffmpeg_service.check_availability)
    lip_sync_enabled, lip_sync_provider = lip_sync_availability()

    database_connected = True
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
    except Exception:
        database_connected = False

    # 2. Database Metrics
    now = datetime.now(timezone.utc)
    total_users = db.query(func.count(models_db.User.id)).scalar() or 0
    active_vip_users = db.query(func.count(models_db.User.id)).filter(
        models_db.User.membership_tier == "vip",
        models_db.User.membership_expires_at > now
    ).scalar() or 0

    total_projects = db.query(func.count(models_db.DubbingProject.id)).scalar() or 0
    completed_exports = db.query(func.count(models_db.DubbingProject.id)).filter(models_db.DubbingProject.status == "completed").scalar() or 0
    failed_exports = db.query(func.count(models_db.DubbingProject.id)).filter(models_db.DubbingProject.status == "failed").scalar() or 0
    public_dubs_count = db.query(func.count(models_db.DubbingProject.id)).filter(models_db.DubbingProject.visibility == "public").scalar() or 0

    pending_payments = db.query(func.count(models_db.Payment.id)).filter(models_db.Payment.status == "pending").scalar() or 0
    paid_payments = db.query(func.count(models_db.Payment.id)).filter(models_db.Payment.status == "paid").scalar() or 0
    failed_payments = db.query(func.count(models_db.Payment.id)).filter(models_db.Payment.status == "failed").scalar() or 0

    comments_count = db.query(func.count(models_db.DubbingComment.id)).scalar() or 0
    reports_count = db.query(func.count(models_db.ContentReport.id)).scalar() or 0

    # 3. Recent failed jobs (projects with status=failed)
    recent_failed = db.query(models_db.DubbingProject).filter(models_db.DubbingProject.status == "failed").order_by(models_db.DubbingProject.created_at.desc()).limit(10).all()
    recent_failed_list = [
        {
            "id": p.id,
            "title": p.title,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "status": p.status
        }
        for p in recent_failed
    ]

    return {
        "app_status": "ok",
        "database_connected": database_connected,
        "redis_configured": redis_configured,
        "redis_connected": redis_connected,
        "redis_error": redis_error,
        "media_root_exists": media_root_exists,
        "media_root_writable": media_root_writable,
        "storage_provider": storage_provider_name,
        "storage_configured": storage_configured,
        "storage_accessible": storage_accessible,
        "ffmpeg_available": ffmpeg_status.available,
        "ffprobe_available": bool(ffmpeg_status.ffprobe_path),
        "lipsync_enabled": lip_sync_enabled,
        "lipsync_provider": lip_sync_provider,
        "shopier_enabled": is_shopier_enabled(),

        "total_users": total_users,
        "active_vip_users": active_vip_users,
        "total_projects": total_projects,
        "completed_exports": completed_exports,
        "failed_exports": failed_exports,
        "public_dubs_count": public_dubs_count,
        "pending_payments": pending_payments,
        "paid_payments": paid_payments,
        "failed_payments": failed_payments,
        "comments_count": comments_count,
        "reports_count": reports_count,

        "recent_failed_jobs": recent_failed_list
    }
