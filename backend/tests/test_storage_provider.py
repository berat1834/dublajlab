from pathlib import Path
from unittest.mock import MagicMock, patch

from botocore.exceptions import ClientError

from backend.services.storage_provider import LocalStorageProvider, S3StorageProvider


def _configured_provider(mock_boto: MagicMock) -> tuple[S3StorageProvider, MagicMock]:
    mock_client = MagicMock()
    mock_boto.return_value = mock_client
    settings = (
        patch("backend.services.storage_provider.S3_ENDPOINT_URL", "https://account.r2.example"),
        patch("backend.services.storage_provider.S3_ACCESS_KEY_ID", "test-key"),
        patch("backend.services.storage_provider.S3_SECRET_ACCESS_KEY", "test-secret"),
        patch("backend.services.storage_provider.S3_BUCKET_NAME", "test-bucket"),
    )
    for setting in settings:
        setting.start()
    try:
        return S3StorageProvider(), mock_client
    finally:
        for setting in reversed(settings):
            setting.stop()


def test_local_provider_uses_real_output_state(tmp_path: Path) -> None:
    provider = LocalStorageProvider(tmp_path)
    output = tmp_path / "test.mp4"

    assert provider.is_configured() is True
    assert provider.healthcheck() is True
    assert provider.file_exists("test.mp4") is False

    output.write_bytes(b"mp4")
    assert provider.upload_file(output, "test.mp4") is True
    assert provider.file_exists("test.mp4") is True
    assert provider.get_public_url("test.mp4") == "/api/video/download/test"
    assert provider.delete_file("test.mp4") is True
    assert provider.file_exists("test.mp4") is False


def test_local_provider_rejects_path_traversal(tmp_path: Path) -> None:
    provider = LocalStorageProvider(tmp_path)

    assert provider.file_exists("../secret.mp4") is False
    assert provider.delete_file("../secret.mp4") is False
    assert provider.get_public_url("../secret.mp4") is None


@patch("backend.services.storage_provider.boto3.client")
def test_s3_provider_missing_config_fails_closed(mock_boto: MagicMock) -> None:
    with (
        patch("backend.services.storage_provider.S3_ENDPOINT_URL", ""),
        patch("backend.services.storage_provider.S3_ACCESS_KEY_ID", ""),
        patch("backend.services.storage_provider.S3_SECRET_ACCESS_KEY", ""),
        patch("backend.services.storage_provider.S3_BUCKET_NAME", ""),
    ):
        provider = S3StorageProvider()

    assert provider.is_configured() is False
    assert provider.healthcheck() is False
    assert provider.upload_file(Path("test.mp4"), "test.mp4") is False
    assert provider.file_exists("test.mp4") is False
    assert provider.delete_file("test.mp4") is False
    assert provider.get_public_url("test.mp4") is None
    mock_boto.assert_not_called()


@patch("backend.services.storage_provider.boto3.client")
def test_s3_provider_upload_delete_exists_and_health(
    mock_boto: MagicMock,
    tmp_path: Path,
) -> None:
    provider, client = _configured_provider(mock_boto)
    output = tmp_path / "test.mp4"
    output.write_bytes(b"mp4")

    assert provider.is_configured() is True
    assert provider.healthcheck() is True
    assert provider.upload_file(output, "exports/test.mp4") is True
    client.upload_file.assert_called_once_with(
        str(output),
        "test-bucket",
        "exports/test.mp4",
        ExtraArgs={"ContentType": "video/mp4"},
    )
    assert provider.file_exists("exports/test.mp4") is True
    assert provider.delete_file("exports/test.mp4") is True
    client.head_bucket.assert_called_once_with(Bucket="test-bucket")
    client.head_object.assert_called_once_with(Bucket="test-bucket", Key="exports/test.mp4")
    client.delete_object.assert_called_once_with(Bucket="test-bucket", Key="exports/test.mp4")


@patch("backend.services.storage_provider.boto3.client")
def test_s3_provider_returns_public_or_presigned_url(mock_boto: MagicMock) -> None:
    with patch("backend.services.storage_provider.S3_PUBLIC_BASE_URL", "https://media.example.com/"):
        provider, _ = _configured_provider(mock_boto)
    assert provider.get_public_url("exports/my video.mp4") == (
        "https://media.example.com/exports/my%20video.mp4"
    )

    with patch("backend.services.storage_provider.S3_PUBLIC_BASE_URL", ""):
        provider, client = _configured_provider(mock_boto)
    client.generate_presigned_url.return_value = "https://signed.example.com/object"
    assert provider.get_public_url("exports/test.mp4") == "https://signed.example.com/object"
    client.generate_presigned_url.assert_called_once_with(
        "get_object",
        Params={"Bucket": "test-bucket", "Key": "exports/test.mp4"},
        ExpiresIn=3600,
    )


@patch("backend.services.storage_provider.boto3.client")
def test_s3_provider_errors_do_not_expose_credentials(
    mock_boto: MagicMock,
    tmp_path: Path,
) -> None:
    provider, client = _configured_provider(mock_boto)
    output = tmp_path / "test.mp4"
    output.write_bytes(b"mp4")
    error = ClientError(
        {"Error": {"Code": "AccessDenied", "Message": "denied"}},
        "PutObject",
    )
    client.upload_file.side_effect = error

    assert provider.upload_file(output, "test.mp4") is False
