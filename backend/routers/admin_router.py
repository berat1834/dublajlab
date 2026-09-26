from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from backend.database import get_db
import backend.models_db as models_db
import backend.schemas as schemas
from backend.routers.auth_router import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])

def get_admin_user(current_user: models_db.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Yalnızca yöneticiler erişebilir.")
    return current_user

@router.get("/reports", response_model=List[schemas.ContentReportResponse])
def get_reports(db: Session = Depends(get_db), admin: models_db.User = Depends(get_admin_user)):
    reports = db.query(models_db.ContentReport).order_by(
        models_db.ContentReport.status == "pending", # True evaluates to 1, False to 0. Actually we want pending first.
        models_db.ContentReport.created_at.desc()
    ).all()
    # A simple order by pending first (status == pending is not portable across all DBs like Postgres, but works in SQLite, 
    # let's just order by created_at desc)
    
    reports = db.query(models_db.ContentReport).order_by(
        models_db.ContentReport.created_at.desc()
    ).all()
    return reports

@router.patch("/reports/{report_id}")
def update_report_status(
    report_id: str,
    status: str, # "reviewed", "dismissed", "action_taken"
    db: Session = Depends(get_db),
    admin: models_db.User = Depends(get_admin_user)
):
    report = db.query(models_db.ContentReport).filter(models_db.ContentReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Rapor bulunamadı.")
        
    report.status = status
    report.reviewed_at = datetime.now(timezone.utc)
    report.reviewed_by = admin.id
    db.commit()
    db.refresh(report)
    return report

@router.patch("/projects/{project_id}/moderation")
def update_project_moderation(
    project_id: str,
    moderation_status: str, # "visible", "hidden"
    db: Session = Depends(get_db),
    admin: models_db.User = Depends(get_admin_user)
):
    project = db.query(models_db.DubbingProject).filter(models_db.DubbingProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı.")
        
    project.moderation_status = moderation_status
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
    db.commit()
    return {"message": "Yorum gizlendi."}
