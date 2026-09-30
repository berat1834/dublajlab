from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path, PurePosixPath
from urllib.parse import quote

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from backend.config import (
    OUTPUT_DIR,
    S3_ACCESS_KEY_ID,
    S3_BUCKET_NAME,
    S3_ENDPOINT_URL,
    S3_PUBLIC_BASE_URL,
    S3_SECRET_ACCESS_KEY,
    STORAGE_PROVIDER,
)


STORAGE_CONFIGURATION_ERROR = (
    "Nesne depolama yapılandırması eksik. Lütfen sistem yöneticisiyle iletişime geçin."
)
STORAGE_UPLOAD_ERROR = (
    "Medya depolama servisine yükleme tamamlanamadı. Lütfen daha sonra tekrar deneyin."
)


def _safe_object_key(remote_path: str) -> str:
    normalized = str(PurePosixPath(remote_path.replace("\\", "/")))
    if (
        not normalized
        or normalized in {".", ".."}
        or normalized.startswith("../")
        or normalized.startswith("/")
    ):
        raise ValueError("Geçersiz medya nesnesi yolu.")
    return normalized


class StorageAbstraction(ABC):
    provider_name: str

    @abstractmethod
    def is_configured(self) -> bool:
        pass

    @abstractmethod
    def healthcheck(self) -> bool:
        pass

    @abstractmethod
    def upload_file(self, local_path: Path, remote_path: str) -> bool:
        pass

    @abstractmethod
    def delete_file(self, remote_path: str) -> bool:
        pass

    @abstractmethod
    def file_exists(self, remote_path: str) -> bool:
        pass

    @abstractmethod
    def get_public_url(self, remote_path: str) -> str | None:
        pass


class LocalStorageProvider(StorageAbstraction):
    provider_name = "local"

    def __init__(self, base_dir: Path = OUTPUT_DIR) -> None:
        self.base_dir = base_dir

    def _path_for(self, remote_path: str) -> Path:
        key = _safe_object_key(remote_path)
        candidate = (self.base_dir / Path(key)).resolve()
        base = self.base_dir.resolve()
        if candidate != base and base not in candidate.parents:
            raise ValueError("Geçersiz medya nesnesi yolu.")
        return candidate

    def is_configured(self) -> bool:
        return True

    def healthcheck(self) -> bool:
        return self.base_dir.is_dir()

    def upload_file(self, local_path: Path, remote_path: str) -> bool:
        try:
            key = _safe_object_key(remote_path)
            return local_path.is_file() and Path(key).name == local_path.name
        except (OSError, ValueError):
            return False

    def delete_file(self, remote_path: str) -> bool:
        try:
            self._path_for(remote_path).unlink(missing_ok=True)
            return True
        except (OSError, ValueError):
            return False

    def file_exists(self, remote_path: str) -> bool:
        try:
            return self._path_for(remote_path).is_file()
        except (OSError, ValueError):
            return False

    def get_public_url(self, remote_path: str) -> str | None:
        try:
            key = _safe_object_key(remote_path)
        except ValueError:
            return None
        output_id = Path(key).stem
        return f"/api/video/download/{output_id}"


class S3StorageProvider(StorageAbstraction):
    provider_name = "s3"

    def __init__(self) -> None:
        self.bucket = S3_BUCKET_NAME.strip()
        self.base_url = S3_PUBLIC_BASE_URL.rstrip("/") if S3_PUBLIC_BASE_URL else None
        self._configured = all(
            value.strip()
            for value in (
                S3_ENDPOINT_URL,
                S3_ACCESS_KEY_ID,
                S3_SECRET_ACCESS_KEY,
                self.bucket,
            )
        )
        self.client = None
        if self._configured:
            self.client = boto3.client(
                "s3",
                endpoint_url=S3_ENDPOINT_URL,
                aws_access_key_id=S3_ACCESS_KEY_ID,
                aws_secret_access_key=S3_SECRET_ACCESS_KEY,
                region_name="auto",
            )

    def is_configured(self) -> bool:
        return self._configured and self.client is not None

    def healthcheck(self) -> bool:
        if not self.client:
            return False
        try:
            self.client.head_bucket(Bucket=self.bucket)
            return True
        except (BotoCoreError, ClientError, OSError):
            return False

    def upload_file(self, local_path: Path, remote_path: str) -> bool:
        if not self.client or not local_path.is_file():
            return False
        try:
            key = _safe_object_key(remote_path)
            self.client.upload_file(
                str(local_path),
                self.bucket,
                key,
                ExtraArgs={"ContentType": "video/mp4"},
            )
            return True
        except (BotoCoreError, ClientError, OSError, ValueError):
            return False

    def delete_file(self, remote_path: str) -> bool:
        if not self.client:
            return False
        try:
            key = _safe_object_key(remote_path)
            self.client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except (BotoCoreError, ClientError, OSError, ValueError):
            return False

    def file_exists(self, remote_path: str) -> bool:
        if not self.client:
            return False
        try:
            key = _safe_object_key(remote_path)
            self.client.head_object(Bucket=self.bucket, Key=key)
            return True
        except (BotoCoreError, ClientError, OSError, ValueError):
            return False

    def get_public_url(self, remote_path: str) -> str | None:
        if not self.client:
            return None
        try:
            key = _safe_object_key(remote_path)
            if self.base_url:
                return f"{self.base_url}/{quote(key, safe='/')}"
            return self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": key},
                ExpiresIn=3600,
            )
        except (BotoCoreError, ClientError, OSError, ValueError):
            return None


def get_storage_provider() -> StorageAbstraction:
    if STORAGE_PROVIDER in {"s3", "r2"}:
        return S3StorageProvider()
    return LocalStorageProvider()
