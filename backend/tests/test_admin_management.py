from fastapi.testclient import TestClient

from backend import models_db
from backend.main import app


client = TestClient(app)


def test_admin_can_search_users(db_session, auth_headers_factory):
    target = models_db.User(
        email="search-target@dublajlab.com.tr",
        password_hash=None,
        display_name="Aranan Kullanıcı",
    )
    db_session.add(target)
    db_session.commit()
    headers = auth_headers_factory(role="admin")

    response = client.get("/api/admin/users?q=Aranan", headers=headers)

    assert response.status_code == 200
    assert [user["id"] for user in response.json()] == [target.id]


def test_normal_user_cannot_list_users(auth_headers_factory):
    response = client.get(
        "/api/admin/users", headers=auth_headers_factory(role="user")
    )

    assert response.status_code == 403


def test_admin_status_values_are_validated(db_session, auth_headers_factory):
    owner = models_db.User(
        email="project-owner@dublajlab.com.tr",
        password_hash=None,
        display_name="Owner",
    )
    db_session.add(owner)
    db_session.commit()
    project = models_db.DubbingProject(
        user_id=owner.id,
        source_type="upload",
        title="Project",
        status="completed",
        visibility="public",
        moderation_status="visible",
    )
    db_session.add(project)
    db_session.commit()
    headers = auth_headers_factory(role="admin")

    response = client.patch(
        f"/api/admin/projects/{project.id}/moderation?moderation_status=invalid",
        headers=headers,
    )

    assert response.status_code == 422
