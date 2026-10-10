from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer

from backend.database import get_db
import backend.models_db as models_db
import backend.schemas as schemas
import backend.auth as auth
from backend.services.membership_service import has_active_vip
from backend.services.admin_role_service import grant_configured_admin_role
from backend.services.admin_mfa_service import (
    consume_recovery_code,
    decrypt_totp_secret,
    encrypt_totp_secret,
    generate_recovery_codes,
    generate_totp_secret,
    matching_totp_step,
    provisioning_uri,
    serialize_recovery_code_hashes,
)
from backend.services.auth_rate_limit_service import auth_attempt_limiter
from backend.services.rate_limit_service import resolve_client_ip
from backend import config

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Bölgeye giriş yapılamadı, kimlik doğrulama başarısız.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(models_db.User).filter(models_db.User.id == user_id).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def get_current_user_optional(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id:
            return db.query(models_db.User).filter(models_db.User.id == user_id).first()
    except JWTError:
        return None
    return None

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    email_lower = user.email.lower()
    db_user = db.query(models_db.User).filter(models_db.User.email == email_lower).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanımda.")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models_db.User(
        email=email_lower,
        password_hash=hashed_password,
        display_name=user.display_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    response = schemas.UserResponse.model_validate(new_user)
    return response.model_copy(update={
        "has_active_vip": has_active_vip(new_user),
        "has_password": bool(new_user.password_hash),
    })

@router.post("/login", response_model=schemas.Token)
def login(request: Request, user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    email_lower = user_credentials.email.lower()
    client_ip = resolve_client_ip(
        request, config.public_demo_policy().trust_proxy_headers
    )
    limiter_key = f"{client_ip}:{email_lower}"
    auth_attempt_limiter.enforce(limiter_key)
    user = db.query(models_db.User).filter(models_db.User.email == email_lower).first()
    if not user:
        auth_attempt_limiter.record_failure(limiter_key)
        raise HTTPException(status_code=400, detail="E-posta veya şifre hatalı.")
        
    if not user.password_hash or not auth.verify_password(user_credentials.password, user.password_hash):
        auth_attempt_limiter.record_failure(limiter_key)
        raise HTTPException(status_code=400, detail="E-posta veya şifre hatalı.")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Bu hesap devre dışı bırakılmış.")

    auth_attempt_limiter.clear(limiter_key)
        
    grant_configured_admin_role(user, db)
            
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models_db.User = Depends(get_current_user)):
    response = schemas.UserResponse.model_validate(current_user)
    return response.model_copy(update={
        "has_active_vip": has_active_vip(current_user),
        "has_password": bool(current_user.password_hash),
    })


def _require_admin_mfa_account(user: models_db.User) -> None:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Yalnızca yöneticiler erişebilir.")


def _admin_mfa_attempt_key(request: Request, user: models_db.User, action: str) -> str:
    client_ip = resolve_client_ip(
        request, config.public_demo_policy().trust_proxy_headers
    )
    return f"admin-mfa-{action}:{client_ip}:{user.email.lower()}"


@router.post("/mfa/setup", response_model=schemas.MFASetupStartResponse)
def start_admin_mfa_setup(
    request: Request,
    payload: schemas.MFASetupStartRequest,
    current_user: models_db.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin_mfa_account(current_user)
    if current_user.mfa_enabled:
        raise HTTPException(status_code=409, detail="Yönetici MFA zaten etkin.")
    if not current_user.password_hash:
        raise HTTPException(
            status_code=400,
            detail="MFA kurulumu için hesabınızda parola tanımlı olmalıdır.",
        )
    limiter_key = _admin_mfa_attempt_key(request, current_user, "setup")
    auth_attempt_limiter.enforce(limiter_key)
    if not auth.verify_password(payload.password, current_user.password_hash):
        auth_attempt_limiter.record_failure(limiter_key)
        raise HTTPException(status_code=403, detail="Parola doğrulanamadı.")
    auth_attempt_limiter.clear(limiter_key)

    secret = generate_totp_secret()
    current_user.mfa_pending_secret_encrypted = encrypt_totp_secret(secret)
    db.commit()
    return schemas.MFASetupStartResponse(
        secret=secret,
        otpauth_uri=provisioning_uri(secret, current_user.email),
    )


@router.post("/mfa/setup/confirm", response_model=schemas.MFASetupConfirmResponse)
def confirm_admin_mfa_setup(
    request: Request,
    payload: schemas.MFACodeRequest,
    current_user: models_db.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin_mfa_account(current_user)
    if current_user.mfa_enabled or not current_user.mfa_pending_secret_encrypted:
        raise HTTPException(status_code=409, detail="Önce MFA kurulumunu başlatın.")

    limiter_key = _admin_mfa_attempt_key(request, current_user, "confirm")
    auth_attempt_limiter.enforce(limiter_key)
    secret = decrypt_totp_secret(current_user.mfa_pending_secret_encrypted)
    matched_step = matching_totp_step(secret, payload.code)
    if matched_step is None:
        auth_attempt_limiter.record_failure(limiter_key)
        raise HTTPException(status_code=400, detail="Authenticator kodu geçersiz veya süresi dolmuş.")

    recovery_codes, recovery_hashes = generate_recovery_codes()
    current_user.mfa_secret_encrypted = current_user.mfa_pending_secret_encrypted
    current_user.mfa_pending_secret_encrypted = None
    current_user.mfa_recovery_code_hashes = serialize_recovery_code_hashes(recovery_hashes)
    current_user.mfa_last_totp_step = matched_step
    current_user.mfa_enabled = True
    auth_attempt_limiter.clear(limiter_key)
    db.commit()
    return schemas.MFASetupConfirmResponse(recovery_codes=recovery_codes)


@router.post("/mfa/verify", response_model=schemas.MFAVerifyResponse)
def verify_admin_mfa(
    request: Request,
    payload: schemas.MFACodeRequest,
    current_user: models_db.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin_mfa_account(current_user)
    if not current_user.mfa_enabled or not current_user.mfa_secret_encrypted:
        raise HTTPException(status_code=403, detail="Önce yönetici MFA kurulumunu tamamlayın.")

    client_ip = resolve_client_ip(
        request, config.public_demo_policy().trust_proxy_headers
    )
    limiter_key = f"admin-mfa:{client_ip}:{current_user.email.lower()}"
    auth_attempt_limiter.enforce(limiter_key)

    user = (
        db.query(models_db.User)
        .filter(models_db.User.id == current_user.id)
        .with_for_update()
        .first()
    )
    if user is None or not user.mfa_enabled or not user.mfa_secret_encrypted:
        raise HTTPException(status_code=403, detail="Yönetici MFA etkin değil.")

    recovery_hashes = consume_recovery_code(payload.code, user.mfa_recovery_code_hashes)
    if recovery_hashes is not None:
        user.mfa_recovery_code_hashes = serialize_recovery_code_hashes(recovery_hashes)
    else:
        secret = decrypt_totp_secret(user.mfa_secret_encrypted)
        matched_step = matching_totp_step(secret, payload.code)
        if matched_step is None or (
            user.mfa_last_totp_step is not None
            and matched_step <= user.mfa_last_totp_step
        ):
            auth_attempt_limiter.record_failure(limiter_key)
            raise HTTPException(status_code=400, detail="MFA kodu geçersiz veya daha önce kullanılmış.")
        user.mfa_last_totp_step = matched_step

    auth_attempt_limiter.clear(limiter_key)
    db.commit()
    expires_in = 10 * 60
    admin_token = auth.create_access_token(
        data={"sub": str(user.id), "amr": "totp"},
        expires_delta=timedelta(seconds=expires_in),
    )
    return schemas.MFAVerifyResponse(access_token=admin_token, expires_in=expires_in)
