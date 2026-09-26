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

def test_change_visibility(db_session):
    test_user = User(
        email=f"test_{uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw",
        display_name="Public Tester",
        role="user"
    )
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)

    app.dependency_overrides[get_current_user] = override_get_current_user(test_user)

    project = DubbingProject(
        user_id=test_user.id,
        source_type="upload",
        title="My Private Dub",
        status="completed",
        visibility="private"
    )
    db_session.add(project)
    db_session.commit()

    res = client.patch(f"/api/me/projects/{project.id}", json={"visibility": "public"})
    assert res.status_code == 200
    assert res.json()["visibility"] == "public"

    app.dependency_overrides.pop(get_current_user, None)

def test_public_dubs_feed(db_session):
    test_user = User(
        email=f"test_{uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw",
        display_name="Public Tester",
        role="user"
    )
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)

    public_proj = DubbingProject(
        user_id=test_user.id,
        source_type="upload",
        title="Public One",
        status="completed",
        visibility="public"
    )
    private_proj = DubbingProject(
        user_id=test_user.id,
        source_type="upload",
        title="Private One",
        status="completed",
        visibility="private"
    )
    incomplete_proj = DubbingProject(
        user_id=test_user.id,
        source_type="upload",
        title="Incomplete One",
        status="processing",
        visibility="public"
    )
    db_session.add_all([public_proj, private_proj, incomplete_proj])
    db_session.commit()

    import backend.routers.public_router as pr
    original_storage = pr.storage
    class MockStorage:
        def get_output_path(self, *args):
            return True
    pr.storage = MockStorage()

    export = DubbingExport(
        project_id=public_proj.id,
        output_video_id="fake_id",
        download_url="/fake/url"
    )
    db_session.add(export)
    db_session.commit()

    res = client.get("/api/public/dubs")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert any(d["title"] == "Public One" for d in data)
    assert all("email" not in d for d in data)

    pr.storage = original_storage
