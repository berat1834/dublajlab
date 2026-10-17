from datetime import datetime, timedelta, timezone
from typing import Optional
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from backend import config

SECRET_KEY = config.get_jwt_secret()
ALGORITHM = config.get_jwt_algorithm()
ACCESS_TOKEN_EXPIRE_MINUTES = config.get_jwt_expire_minutes()

# bcrypt_sha256 removes bcrypt's 72-byte input limit for new passwords while
# keeping existing bcrypt hashes verifiable during the gradual migration.
pwd_context = CryptContext(schemes=["bcrypt_sha256", "bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    issued_at = datetime.now(timezone.utc)
    if expires_delta:
        expire = issued_at + expires_delta
    else:
        expire = issued_at + timedelta(minutes=15)
    # `iat` lets the API reject sessions created before a password change.
    to_encode.update({"exp": expire, "iat": issued_at.timestamp()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def token_predates_password_change(payload: dict, password_changed_at) -> bool:
    """Return True when the token was issued before the latest password change."""

    if password_changed_at is None:
        return False
    if password_changed_at.tzinfo is None:
        password_changed_at = password_changed_at.replace(tzinfo=timezone.utc)
    issued_at = payload.get("iat")
    if not isinstance(issued_at, (int, float)):
        return True
    return float(issued_at) < password_changed_at.timestamp()
