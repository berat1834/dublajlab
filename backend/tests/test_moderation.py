from fastapi.testclient import TestClient
from uuid import uuid4

from backend.main import app
from backend.models_db import User, DubbingProject, DubbingExport, ContentReport
from backend.routers.auth_router import get_current_user

client = TestClient(app)

def override_user(user):
    def _override():
        return user
    return _override

def test_report_public_dub(db_session):
    normal_user = User(
        email=f"normal_{uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw",
        display_name="Normal User",
        role="user"
    )
    db_session.add(normal_user)
    db_session.commit()
    db_session.refresh(normal_user)

    project = DubbingProject(
        user_id=normal_user.id,
        source_type="upload",
        title="Public Project",
        status="completed",
        visibility="public",
        moderation_status="visible"
    )
    db_session.add(project)
    db_session.commit()

    # Test reporting without login (should work)
    res = client.post(f"/api/public/dubs/{project.id}/report", json={
        "reason": "inappropriate",
        "details": "This is bad"
    })
    assert res.status_code == 201
    assert db_session.query(ContentReport).count() == 1
    report = db_session.query(ContentReport).first()
    assert report.reason == "inappropriate"
    assert report.reporter_user_id is None

    # Test reporting with login
    from backend.routers.public_router import get_optional_user
    app.dependency_overrides[get_optional_user] = override_user(normal_user)
    res = client.post(f"/api/public/dubs/{project.id}/report", headers={"Authorization": "Bearer fake_token"}, json={
        "reason": "copyright",
        "details": "This is stolen"
    })
    assert res.status_code == 201
    assert db_session.query(ContentReport).count() == 2
    reports = db_session.query(ContentReport).all()
    assert any(r.reporter_user_id == normal_user.id for r in reports)
    app.dependency_overrides.pop(get_optional_user, None)

def test_admin_hide_project_removes_from_feed(db_session):
    admin_user = User(
        email=f"admin_{uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw",
        display_name="Admin User",
        role="admin"
    )
    db_session.add(admin_user)
    db_session.commit()
    db_session.refresh(admin_user)

    project = DubbingProject(
        user_id=admin_user.id,
        source_type="upload",
        title="Bad Project",
        status="completed",
        visibility="public",
        moderation_status="visible"
    )
    db_session.add(project)
    db_session.commit()

    export = DubbingExport(
        project_id=project.id,
        output_video_id="fake",
        download_url="/fake"
    )
    db_session.add(export)
    db_session.commit()

    import backend.routers.public_router as pr
    original_storage = pr.storage
    class MockStorage:
        def get_output_path(self, *args):
            return True
    pr.storage = MockStorage()

    # Check it's visible
    res = client.get("/api/public/dubs")
    assert any(p["project_id"] == project.id for p in res.json())

    # Login as admin and hide it
    app.dependency_overrides[get_current_user] = override_user(admin_user)
    res_hide = client.patch(f"/api/admin/projects/{project.id}/moderation?moderation_status=hidden")
    assert res_hide.status_code == 200

    # Check it's hidden
    res2 = client.get("/api/public/dubs")
    assert not any(p["project_id"] == project.id for p in res2.json())

    app.dependency_overrides.pop(get_current_user, None)
    pr.storage = original_storage

def test_normal_user_cannot_access_admin(db_session):
    normal_user = User(
        email=f"normal_{uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw",
        display_name="Normal User",
        role="user"
    )
    db_session.add(normal_user)
    db_session.commit()
    db_session.refresh(normal_user)

    app.dependency_overrides[get_current_user] = override_user(normal_user)
    res = client.get("/api/admin/reports")
    assert res.status_code == 403
    app.dependency_overrides.pop(get_current_user, None)
