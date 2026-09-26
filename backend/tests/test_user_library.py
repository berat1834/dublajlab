from fastapi.testclient import TestClient
from uuid import uuid4

from backend.main import app
from backend.models_db import User, DubbingProject, DubbingExport
from backend.routers.auth_router import get_current_user

client = TestClient(app)

def override_get_current_user(test_user):
    def _override():
        return test_user
    return _override

def test_get_user_projects(db_session):
    test_user = User(
        email=f"test_{uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw",
        display_name="Test User",
        role="user"
    )
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)

    app.dependency_overrides[get_current_user] = override_get_current_user(test_user)

    project = DubbingProject(
        user_id=test_user.id,
        source_type="upload",
        title="My Project",
        status="completed"
    )
    db_session.add(project)
    db_session.commit()

    res = client.get("/api/me/projects")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert any(d["title"] == "My Project" for d in data)

    app.dependency_overrides.pop(get_current_user, None)

def test_delete_user_project(db_session):
    test_user = User(
        email=f"test_{uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw",
        display_name="Test User",
        role="user"
    )
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)

    app.dependency_overrides[get_current_user] = override_get_current_user(test_user)

    project = DubbingProject(
        user_id=test_user.id,
        source_type="upload",
        title="To Delete",
        status="completed"
    )
    db_session.add(project)
    db_session.commit()

    res = client.delete(f"/api/me/projects/{project.id}")
    assert res.status_code == 204

    deleted_project = db_session.query(DubbingProject).filter(DubbingProject.id == project.id).first()
    assert deleted_project is None

    app.dependency_overrides.pop(get_current_user, None)

def test_cannot_access_other_users_project(db_session):
    test_user = User(
        email=f"test_{uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw",
        display_name="Test User",
        role="user"
    )
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)

    app.dependency_overrides[get_current_user] = override_get_current_user(test_user)

    other_user_id = str(uuid4())
    project = DubbingProject(
        user_id=other_user_id,
        source_type="upload",
        title="Secret Project",
        status="completed"
    )
    db_session.add(project)
    db_session.commit()

    res = client.get(f"/api/me/projects/{project.id}")
    assert res.status_code == 404

    res_del = client.delete(f"/api/me/projects/{project.id}")
    assert res_del.status_code == 404

    app.dependency_overrides.pop(get_current_user, None)
