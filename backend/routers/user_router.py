from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import os

from backend.database import get_db
import backend.models_db as models_db
import backend.schemas as schemas
from backend.routers.auth_router import get_current_user

router = APIRouter()

@router.get("/projects", response_model=List[schemas.ProjectResponse])
def get_user_projects(db: Session = Depends(get_db), current_user: models_db.User = Depends(get_current_user)):
    projects = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.user_id == current_user.id
    ).order_by(models_db.DubbingProject.created_at.desc()).all()
    return projects

@router.get("/projects/{project_id}", response_model=schemas.ProjectResponse)
def get_user_project(project_id: str, db: Session = Depends(get_db), current_user: models_db.User = Depends(get_current_user)):
    project = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.id == project_id,
        models_db.DubbingProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı.")
    return project

@router.patch("/projects/{project_id}", response_model=schemas.ProjectResponse)
def update_user_project(project_id: str, project_update: schemas.ProjectUpdate, db: Session = Depends(get_db), current_user: models_db.User = Depends(get_current_user)):
    project = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.id == project_id,
        models_db.DubbingProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı.")
    
    if project_update.title is not None:
        project.title = project_update.title
    if project_update.visibility is not None:
        project.visibility = project_update.visibility
        
    db.commit()
    db.refresh(project)
    return project

@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_project(project_id: str, db: Session = Depends(get_db), current_user: models_db.User = Depends(get_current_user)):
    project = db.query(models_db.DubbingProject).filter(
        models_db.DubbingProject.id == project_id,
        models_db.DubbingProject.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proje bulunamadı.")
        
    from backend.services.file_storage import FileStorageService
    storage = FileStorageService()
    
    exports = db.query(models_db.DubbingExport).filter(models_db.DubbingExport.project_id == project_id).all()
    for exp in exports:
        if exp.output_video_id:
            try:
                # Delete video
                video_path = storage.get_output_path(exp.output_video_id)
                video_path.unlink(missing_ok=True)
            except HTTPException:
                pass
            
            try:
                # Delete metadata
                from backend.config import METADATA_DIR
                safe_id = storage._validate_uuid(exp.output_video_id, "id")
                meta_path = METADATA_DIR / f"output-{safe_id}.json"
                meta_path.unlink(missing_ok=True)
            except Exception:
                pass
        
        db.delete(exp)
        
    db.delete(project)
    db.commit()
    return None

@router.get("/exports", response_model=List[schemas.ExportResponse])
def get_user_exports(db: Session = Depends(get_db), current_user: models_db.User = Depends(get_current_user)):
    projects = db.query(models_db.DubbingProject.id).filter(
        models_db.DubbingProject.user_id == current_user.id
    ).all()
    project_ids = [p.id for p in projects]
    
    if not project_ids:
        return []
        
    exports = db.query(models_db.DubbingExport).filter(
        models_db.DubbingExport.project_id.in_(project_ids)
    ).order_by(models_db.DubbingExport.created_at.desc()).all()
    
    from backend.services.file_storage import FileStorageService
    storage = FileStorageService()
    
    # Check if files still exist, if not set download_url to None
    for exp in exports:
        if exp.output_video_id and exp.download_url:
            try:
                storage.get_output_path(exp.output_video_id)
            except HTTPException:
                # File deleted by cleanup service
                exp.download_url = None

    return exports
