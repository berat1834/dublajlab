import pytest
from datetime import datetime, timedelta, timezone
import uuid
import os
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from backend.models_db import User, DubbingProject, DubbingExport, DubbingLike
from backend.services.cleanup_service import CleanupService
from backend.config import OUTPUT_DIR, METADATA_DIR
from backend.services.file_storage import FileStorageService

@pytest.fixture
def temp_export_files(tmp_path):
    # Mocking storage for tests
    storage = FileStorageService()
    return storage

@pytest.fixture
def client():
    from backend.main import app
    return TestClient(app)

@pytest.fixture(autouse=True)
def mock_session_local(monkeypatch):
    import backend.database
    from backend.tests.conftest import TestingSessionLocal
    monkeypatch.setattr(backend.database, "SessionLocal", TestingSessionLocal)

@pytest.fixture
def sample_user_free(db_session: Session):
    user = User(
        email=f"free_{uuid.uuid4()}@test.com",
        display_name="Free User",
        membership_tier="free"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def sample_user_vip(db_session: Session):
    user = User(
        email=f"vip_{uuid.uuid4()}@test.com",
        display_name="VIP User",
        membership_tier="vip"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

def create_mock_export_file(output_id: str):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    file_path = OUTPUT_DIR / f"{output_id}.mp4"
    file_path.write_text("dummy")
    
    import json
    METADATA_DIR.mkdir(parents=True, exist_ok=True)
    meta_path = METADATA_DIR / f"output-{output_id}.json"
    meta_path.write_text(json.dumps({"stored_filename": f"{output_id}.mp4"}))
    
    return file_path, meta_path

def set_file_time(file_path, dt: datetime):
    ts = dt.timestamp()
    os.utime(file_path, (ts, ts))

def test_free_export_deleted_after_24_hours(db_session: Session, sample_user_free):
    output_id = str(uuid.uuid4())
    project = DubbingProject(user_id=sample_user_free.id, source_type="upload", title="Free Project")
    db_session.add(project)
    db_session.commit()
    
    retention_date = datetime.now(timezone.utc) - timedelta(hours=1)
    export = DubbingExport(
        project_id=project.id,
        output_video_id=output_id,
        retention_expires_at=retention_date
    )
    db_session.add(export)
    db_session.commit()
    
    vid_path, meta_path = create_mock_export_file(output_id)
    old_dt = datetime.now(timezone.utc) - timedelta(hours=25)
    set_file_time(vid_path, old_dt)
    set_file_time(meta_path, old_dt)
    
    service = CleanupService((OUTPUT_DIR, METADATA_DIR))
    res = service.cleanup_old_files(older_than_hours=24)
    
    assert not vid_path.exists()
    assert not meta_path.exists()

def test_vip_export_not_deleted_before_30_days(db_session: Session, sample_user_vip):
    output_id = str(uuid.uuid4())
    project = DubbingProject(user_id=sample_user_vip.id, source_type="upload", title="VIP Project")
    db_session.add(project)
    db_session.commit()
    
    retention_date = datetime.now(timezone.utc) + timedelta(days=10)
    export = DubbingExport(
        project_id=project.id,
        output_video_id=output_id,
        retention_expires_at=retention_date
    )
    db_session.add(export)
    db_session.commit()
    
    vid_path, meta_path = create_mock_export_file(output_id)
    old_dt = datetime.now(timezone.utc) - timedelta(days=20)
    set_file_time(vid_path, old_dt)
    set_file_time(meta_path, old_dt)
    
    service = CleanupService((OUTPUT_DIR, METADATA_DIR))
    service.cleanup_old_files(older_than_hours=24)
    
    assert vid_path.exists()
    assert meta_path.exists()
    
    vid_path.unlink()
    meta_path.unlink()

def test_vip_export_deleted_after_30_days(db_session: Session, sample_user_vip):
    output_id = str(uuid.uuid4())
    project = DubbingProject(user_id=sample_user_vip.id, source_type="upload", title="VIP Expired Project")
    db_session.add(project)
    db_session.commit()
    
    retention_date = datetime.now(timezone.utc) - timedelta(days=1)
    export = DubbingExport(
        project_id=project.id,
        output_video_id=output_id,
        retention_expires_at=retention_date
    )
    db_session.add(export)
    db_session.commit()
    
    vid_path, meta_path = create_mock_export_file(output_id)
    old_dt = datetime.now(timezone.utc) - timedelta(days=31)
    set_file_time(vid_path, old_dt)
    set_file_time(meta_path, old_dt)
    
    service = CleanupService((OUTPUT_DIR, METADATA_DIR))
    service.cleanup_old_files(older_than_hours=24)
    
    assert not vid_path.exists()
    assert not meta_path.exists()

def test_deleted_export_returns_null_download_url(client: TestClient, db_session: Session, sample_user_free):
    output_id = str(uuid.uuid4())
    project = DubbingProject(user_id=sample_user_free.id, source_type="upload", title="Deleted File Project")
    db_session.add(project)
    db_session.commit()
    
    export = DubbingExport(
        project_id=project.id,
        output_video_id=output_id,
        download_url="/api/video/download/" + output_id
    )
    db_session.add(export)
    db_session.commit()
    
    from backend.auth import create_access_token
    token = create_access_token({"sub": str(sample_user_free.id)})
    
    resp = client.get("/api/me/exports", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["download_url"] is None

def test_public_feed_omits_missing_files(client: TestClient, db_session: Session, sample_user_free):
    output_id = str(uuid.uuid4())
    project = DubbingProject(
        user_id=sample_user_free.id, 
        source_type="upload", 
        title="Public Missing File",
        status="completed",
        visibility="public",
        moderation_status="visible"
    )
    db_session.add(project)
    db_session.commit()
    
    export = DubbingExport(
        project_id=project.id,
        output_video_id=output_id,
        download_url="/api/video/download/" + output_id
    )
    db_session.add(export)
    db_session.commit()
    
    resp = client.get("/api/public/dubs")
    assert resp.status_code == 200
    data = resp.json()
    assert not any(d["project_id"] == project.id for d in data)
    
    vid_path, meta_path = create_mock_export_file(output_id)
    resp = client.get("/api/public/dubs")
    data = resp.json()
    assert any(d["project_id"] == project.id for d in data)
    
    vid_path.unlink()
    meta_path.unlink()

def test_user_project_delete_removes_physical_files(client: TestClient, db_session: Session, sample_user_free):
    output_id = str(uuid.uuid4())
    project = DubbingProject(user_id=sample_user_free.id, source_type="upload", title="Delete Me")
    db_session.add(project)
    db_session.commit()
    
    export = DubbingExport(
        project_id=project.id,
        output_video_id=output_id,
        download_url="/api/video/download/" + output_id
    )
    db_session.add(export)
    db_session.commit()
    
    vid_path, meta_path = create_mock_export_file(output_id)
    assert vid_path.exists()
    
    from backend.auth import create_access_token
    token = create_access_token({"sub": str(sample_user_free.id)})
    
    resp = client.delete(f"/api/me/projects/{project.id}", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 204
    
    assert not vid_path.exists()
    assert not meta_path.exists()
