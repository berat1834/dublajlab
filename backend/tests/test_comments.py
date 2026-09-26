from fastapi.testclient import TestClient
from uuid import uuid4

from backend.main import app
from backend.models_db import User, DubbingProject, DubbingComment
from backend.routers.auth_router import get_current_user

client = TestClient(app)

def override_user(user):
    def _override():
        return user
    return _override

def test_comments_flow(db_session):
    normal_user = User(
        email=f"normal_{uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw",
        display_name="Normal User",
        role="user"
    )
    admin_user = User(
        email=f"admin_{uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw",
        display_name="Admin User",
        role="admin"
    )
    db_session.add_all([normal_user, admin_user])
    db_session.commit()
    db_session.refresh(normal_user)
    db_session.refresh(admin_user)

    project = DubbingProject(
        user_id=normal_user.id,
        source_type="upload",
        title="Public Project",
        status="completed",
        visibility="public",
        moderation_status="visible",
    )
    db_session.add(project)
    db_session.commit()

    # 1. Post comment without auth -> 401
    res = client.post(f"/api/public/dubs/{project.id}/comments", json={"body": "Hello"})
    assert res.status_code == 401

    # 2. Post comment with auth
    app.dependency_overrides[get_current_user] = override_user(normal_user)
    res = client.post(
        f"/api/public/dubs/{project.id}/comments",
        headers={"Authorization": "Bearer fake_token"},
        json={"body": "This is a great dub!"}
    )
    assert res.status_code == 201
    comment_data = res.json()
    assert comment_data["body"] == "This is a great dub!"
    assert comment_data["is_mine"] is True
    comment_id = comment_data["id"]

    # 3. Post empty comment -> 400
    res = client.post(
        f"/api/public/dubs/{project.id}/comments",
        headers={"Authorization": "Bearer fake_token"},
        json={"body": ""}
    )
    assert res.status_code == 400

    # 4. Get comments
    from backend.routers.public_router import get_optional_user
    app.dependency_overrides[get_optional_user] = override_user(normal_user)
    res = client.get(
        f"/api/public/dubs/{project.id}/comments",
        headers={"Authorization": "Bearer fake_token"}
    )
    assert res.status_code == 200
    comments = res.json()
    assert len(comments) == 1
    assert comments[0]["body"] == "This is a great dub!"

    # 5. Delete own comment
    res = client.delete(
        f"/api/public/dubs/{project.id}/comments/{comment_id}",
        headers={"Authorization": "Bearer fake_token"}
    )
    assert res.status_code == 200

    # 6. Get comments again -> should be empty (hidden)
    res = client.get(
        f"/api/public/dubs/{project.id}/comments",
        headers={"Authorization": "Bearer fake_token"}
    )
    assert len(res.json()) == 0

    # 7. Add another comment
    res = client.post(
        f"/api/public/dubs/{project.id}/comments",
        headers={"Authorization": "Bearer fake_token"},
        json={"body": "Second comment"}
    )
    second_comment_id = res.json()["id"]

    # 8. Admin hides comment
    from backend.routers.admin_router import get_admin_user
    app.dependency_overrides[get_admin_user] = override_user(admin_user)
    res = client.patch(
        f"/api/admin/comments/{second_comment_id}/hide",
        headers={"Authorization": "Bearer admin_token"}
    )
    assert res.status_code == 200

    # 9. Get comments again -> empty
    res = client.get(
        f"/api/public/dubs/{project.id}/comments",
        headers={"Authorization": "Bearer fake_token"}
    )
    assert len(res.json()) == 0

    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_optional_user, None)
    app.dependency_overrides.pop(get_admin_user, None)
