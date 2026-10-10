from fastapi.testclient import TestClient

from backend import auth, models_db
from backend.main import app


client = TestClient(app)


def test_profile_update_is_persisted(auth_headers_factory, db_session):
    headers = auth_headers_factory()

    response = client.patch(
        "/api/me/profile",
        headers=headers,
        json={"display_name": "Yeni Ad", "avatar_url": "https://example.com/avatar.png"},
    )

    assert response.status_code == 200
    assert response.json()["display_name"] == "Yeni Ad"
    assert response.json()["avatar_url"] == "https://example.com/avatar.png"
    assert response.json()["has_password"] is True


def test_password_account_delete_requires_matching_name(auth_headers_factory):
    headers = auth_headers_factory()

    response = client.request(
        "DELETE",
        "/api/me/account",
        headers=headers,
        json={"confirmation": "Yanlış Ad", "password": "testpassword"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Kullanıcı adı eşleşmiyor."


def test_password_account_can_be_deleted(auth_headers_factory):
    headers = auth_headers_factory()

    response = client.request(
        "DELETE",
        "/api/me/account",
        headers=headers,
        json={"confirmation": "Test User", "password": "testpassword"},
    )

    assert response.status_code == 204


def test_oauth_account_can_be_deleted_without_password(db_session):
    user = models_db.User(
        email="oauth-delete@dublajlab.com",
        password_hash=None,
        display_name="OAuth User",
        google_id="google-delete-test",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    token = auth.create_access_token({"sub": user.id})

    response = client.request(
        "DELETE",
        "/api/me/account",
        headers={"Authorization": f"Bearer {token}"},
        json={"confirmation": "OAuth User", "password": None},
    )

    assert response.status_code == 204
