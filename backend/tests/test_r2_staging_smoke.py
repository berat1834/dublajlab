"""Opt-in Cloudflare R2/S3 smoke test.

Run only against an approved staging or production bucket:
RUN_R2_SMOKE=1 STORAGE_PROVIDER=s3 ... pytest this-file -q
"""

import os
from pathlib import Path
from uuid import uuid4

import pytest

from backend.services.storage_provider import S3StorageProvider


@pytest.mark.skipif(
    os.getenv("RUN_R2_SMOKE") != "1",
    reason="R2 staging smoke yalnız RUN_R2_SMOKE=1 ile çalışır.",
)
def test_r2_staging_upload_url_exists_and_delete(tmp_path: Path) -> None:
    provider = S3StorageProvider()
    assert provider.is_configured(), "R2 staging ayarları eksik."
    assert provider.healthcheck(), "R2 staging bucket erişilemiyor."

    expected_content = b"DublajLab R2 staging smoke"
    local_file = tmp_path / "smoke.mp4"
    local_file.write_bytes(expected_content)
    object_key = f"smoke-tests/{uuid4()}.mp4"
    uploaded = False

    try:
        assert provider.upload_file(local_file, object_key)
        uploaded = True
        assert provider.file_exists(object_key)
        assert provider.get_public_url(object_key)
        assert provider.client is not None
        response = provider.client.get_object(Bucket=provider.bucket, Key=object_key)
        try:
            assert response["Body"].read() == expected_content
        finally:
            response["Body"].close()
    finally:
        if uploaded:
            assert provider.delete_file(object_key)

    assert provider.file_exists(object_key) is False
