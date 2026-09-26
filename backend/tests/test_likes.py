from fastapi.testclient import TestClient
from uuid import uuid4

from backend.main import app
from backend.models_db import User, DubbingProject, DubbingExport, DubbingLike
from backend.routers.auth_router import get_current_user

client = TestClient(app)

def override_user(user):
    def _override():
        return user
    return _override

def test_likes_and_views(db_session):
    user = User(
        email=f"normal_{uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw",
        display_name="Normal User",
        role="user"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    project = DubbingProject(
        user_id=user.id,
        source_type="upload",
        title="Public Project",
        status="completed",
        visibility="public",
        moderation_status="visible",
        view_count=0
    )
    db_session.add(project)
    db_session.commit()

    export = DubbingExport(
        project_id=project.id,
        output_video_id="fake_video_id",
        download_url="/fake"
    )
    db_session.add(export)
    db_session.commit()

    # Mock storage
    import backend.routers.public_router as pr
    original_storage = pr.storage
    class MockStorage:
        def get_output_path(self, *args):
            return True
    pr.storage = MockStorage()

    # 1. View count increment
    res = client.post(f"/api/public/dubs/{project.id}/view")
    assert res.status_code == 200
    db_session.refresh(project)
    assert project.view_count == 1

    # 2. Like without login (should fail)
    res_no_auth = client.post(f"/api/public/dubs/{project.id}/like")
    assert res_no_auth.status_code == 401

    # 3. Like with login
    app.dependency_overrides[get_current_user] = override_user(user)
    res_like = client.post(f"/api/public/dubs/{project.id}/like", headers={"Authorization": "Bearer fake_token"})
    assert res_like.status_code == 200
    assert db_session.query(DubbingLike).count() == 1

    # 4. Duplicate like (idempotent)
    res_like2 = client.post(f"/api/public/dubs/{project.id}/like", headers={"Authorization": "Bearer fake_token"})
    assert res_like2.status_code == 200
    assert db_session.query(DubbingLike).count() == 1

    # 5. Feed shows like_count and liked_by_me
    from backend.routers.public_router import get_optional_user
    app.dependency_overrides[get_optional_user] = override_user(user)
    res_feed = client.get("/api/public/dubs", headers={"Authorization": "Bearer fake_token"})
    assert res_feed.status_code == 200
    feed = res_feed.json()
    assert len(feed) > 0
    assert feed[0]["like_count"] == 1
    assert feed[0]["view_count"] == 1
    assert feed[0]["liked_by_me"] is True

    # 6. Unlike
    res_unlike = client.delete(f"/api/public/dubs/{project.id}/like", headers={"Authorization": "Bearer fake_token"})
    assert res_unlike.status_code == 200
    assert db_session.query(DubbingLike).count() == 0

    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_optional_user, None)
    pr.storage = original_storage
