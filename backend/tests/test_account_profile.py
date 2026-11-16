import json
from uuid import uuid4

from fastapi.testclient import TestClient

from backend import auth, models_db
from backend.main import app
from backend.routers import user_router
from backend.services import file_storage


client = TestClient(app)


def test_user_has_password_does_not_expose_hash():
    password_user = models_db.User(
        email="password@example.com",
        display_name="Password",
        password_hash="secret-hash",
    )
    oauth_user = models_db.User(
        email="oauth@example.com",
        display_name="OAuth",
        password_hash=None,
    )

    assert password_user.has_password is True
    assert oauth_user.has_password is False


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
    assert response.json()["discord_linked"] is False


def test_me_exposes_linked_discord_account(db_session):
    user = models_db.User(
        email="discord-linked@dublajlab.com",
        password_hash=None,
        display_name="Discord Linked",
        discord_id="discord-user-123",
        email_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {auth.create_access_token({'sub': user.id})}"},
    )

    assert response.status_code == 200
    assert response.json()["discord_linked"] is True


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


def test_account_delete_removes_owned_projects_exports_and_social_data(
    auth_headers_factory, db_session, monkeypatch
):
    headers = auth_headers_factory()
    user = db_session.query(models_db.User).filter_by(display_name="Test User").first()
    project = models_db.DubbingProject(
        user_id=user.id,
        source_type="upload",
        title="My project",
    )
    db_session.add(project)
    db_session.flush()
    project_id = project.id
    output_id = str(uuid4())
    db_session.add(
        models_db.DubbingExport(
            project_id=project_id,
            output_video_id=output_id,
        )
    )
    db_session.add(
        models_db.DubbingLike(project_id=project_id, user_id=user.id)
    )
    db_session.add(
        models_db.DubbingComment(
            project_id=project_id,
            user_id=user.id,
            body="My comment",
        )
    )
    db_session.add(
        models_db.ContentReport(
            project_id=project_id,
            reporter_user_id=user.id,
            reason="other",
        )
    )
    db_session.commit()

    class FakeStorageProvider:
        deleted_files: list[str] = []

        def delete_file(self, filename: str) -> bool:
            self.deleted_files.append(filename)
            return True

    provider = FakeStorageProvider()
    monkeypatch.setattr(user_router.storage_provider, "get_storage_provider", lambda: provider)

    response = client.request(
        "DELETE",
        "/api/me/account",
        headers=headers,
        json={"confirmation": "Test User", "password": "testpassword"},
    )

    assert response.status_code == 204
    assert provider.deleted_files == [f"{output_id}.mp4"]
    assert db_session.query(models_db.DubbingProject).filter_by(id=project_id).count() == 0
    assert db_session.query(models_db.DubbingExport).filter_by(project_id=project_id).count() == 0
    assert db_session.query(models_db.DubbingLike).filter_by(project_id=project_id).count() == 0
    assert db_session.query(models_db.DubbingComment).filter_by(project_id=project_id).count() == 0
    assert db_session.query(models_db.ContentReport).filter_by(project_id=project_id).count() == 0


def test_delete_owned_uploads_preserves_uploads_without_matching_owner(
    tmp_path, monkeypatch
):
    metadata_dir = tmp_path / "metadata"
    upload_dir = tmp_path / "uploads"
    metadata_dir.mkdir()
    upload_dir.mkdir()
    monkeypatch.setattr(file_storage, "METADATA_DIR", metadata_dir)
    monkeypatch.setattr(file_storage, "UPLOAD_DIR", upload_dir)
    monkeypatch.setattr(file_storage.FileStorageService, "__init__", lambda self: None)

    owned_id = str(uuid4())
    other_id = str(uuid4())
    for video_id, owner_id in ((owned_id, "user-1"), (other_id, "user-2")):
        filename = f"{video_id}.mp4"
        (upload_dir / filename).write_bytes(b"video")
        (metadata_dir / f"video-{video_id}.json").write_text(
            json.dumps({"owner_user_id": owner_id, "stored_filename": filename}),
            encoding="utf-8",
        )

    file_storage.FileStorageService().delete_owned_uploads("user-1")

    assert not (upload_dir / f"{owned_id}.mp4").exists()
    assert not (metadata_dir / f"video-{owned_id}.json").exists()
    assert (upload_dir / f"{other_id}.mp4").exists()
    assert (metadata_dir / f"video-{other_id}.json").exists()
