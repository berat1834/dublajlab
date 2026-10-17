from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
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
from backend.services.auth_rate_limit_service import (
    auth_attempt_limiter,
    password_reset_request_limiter,
)
from backend.services.rate_limit_service import resolve_client_ip
from backend.services.email_verification_service import (
    EmailDeliveryConfigurationError,
    create_password_reset_token,
    create_verification_token,
    ensure_email_delivery_configured,
    hash_verification_token,
    send_password_reset_email,
    send_verification_email,
)
from backend.services.password_policy_service import (
    PasswordPolicyError,
    validate_new_password,
)
from backend import config
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
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
    if auth.token_predates_password_change(payload, user.password_changed_at):
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
            user = db.query(models_db.User).filter(models_db.User.id == user_id).first()
            if user is None or auth.token_predates_password_change(
                payload, user.password_changed_at
            ):
                return None
            return user
    except JWTError:
        return None
    return None

def _send_account_verification(
    *, request: Request, user: models_db.User, db: Session
) -> None:
    raw_token, token_hash, expires_at = create_verification_token()
    user.email_verification_token_hash = token_hash
    user.email_verification_expires_at = expires_at
    verification_url = f'{request.url_for("verify_email")}?token={raw_token}'
    try:
        send_verification_email(
            recipient=user.email,
            display_name=user.display_name,
            verification_url=verification_url,
        )
    except (EmailDeliveryConfigurationError, OSError, httpx.HTTPError) as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Doğrulama e-postası şu anda gönderilemiyor. "
                "Lütfen daha sonra tekrar deneyin."
            ),
        ) from exc


@router.post("/register", response_model=schemas.UserResponse)
def register(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):
    email_lower = user.email.lower()
    try:
        validate_new_password(
            user.password,
            email=email_lower,
            display_name=user.display_name,
        )
    except PasswordPolicyError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    db_user = db.query(models_db.User).filter(models_db.User.email == email_lower).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanımda.")
    
    hashed_password = auth.get_password_hash(user.password)
    verification_required = config.email_verification_required()
    new_user = models_db.User(
        email=email_lower,
        password_hash=hashed_password,
        display_name=user.display_name,
        email_verified=not verification_required,
    )
    db.add(new_user)
    db.flush()
    if verification_required:
        _send_account_verification(request=request, user=new_user, db=db)
    db.commit()
    db.refresh(new_user)
    response = schemas.UserResponse.model_validate(new_user)
    return response.model_copy(update={
        "has_active_vip": has_active_vip(new_user),
        "has_password": bool(new_user.password_hash),
        "email_verification_required": verification_required,
    })


@router.get("/verify-email", name="verify_email")
def verify_email(token: str, db: Session = Depends(get_db)):
    token_hash = hash_verification_token(token)
    user = (
        db.query(models_db.User)
        .filter(models_db.User.email_verification_token_hash == token_hash)
        .first()
    )
    if user is None or user.email_verification_expires_at is None:
        return RedirectResponse(
            f"{config.frontend_url()}/giris?email_verification=invalid",
            status_code=status.HTTP_303_SEE_OTHER,
        )
    expires_at = user.email_verification_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        return RedirectResponse(
            f"{config.frontend_url()}/giris?email_verification=expired",
            status_code=status.HTTP_303_SEE_OTHER,
        )
    user.email_verified = True
    user.email_verification_token_hash = None
    user.email_verification_expires_at = None
    db.commit()
    return RedirectResponse(
        f"{config.frontend_url()}/giris?email_verification=success",
        status_code=status.HTTP_303_SEE_OTHER,
    )


@router.post("/resend-verification", response_model=schemas.MessageResponse)
def resend_verification(
    request: Request,
    payload: schemas.EmailVerificationResendRequest,
    db: Session = Depends(get_db),
):
    generic_message = (
        "Adres kayıtlı ve henüz doğrulanmamışsa yeni bağlantı gönderildi."
    )
    user = (
        db.query(models_db.User)
        .filter(models_db.User.email == payload.email.lower())
        .first()
    )
    if user is None or user.email_verified or not user.password_hash:
        return schemas.MessageResponse(message=generic_message)
    _send_account_verification(request=request, user=user, db=db)
    db.commit()
    return schemas.MessageResponse(message=generic_message)


PASSWORD_RESET_GENERIC_MESSAGE = (
    "Bu adres kayıtlıysa parola sıfırlama bağlantısı gönderildi. "
    "Gelen kutunuzu ve spam klasörünü kontrol edin."
)
PASSWORD_RESET_INVALID_MESSAGE = (
    "Parola sıfırlama bağlantısı geçersiz, kullanılmış veya süresi dolmuş. "
    "Lütfen yeni bir bağlantı isteyin."
)
PASSWORD_RESET_GENERIC_MESSAGE_EN = (
    "If this address is registered, a password reset link has been sent. "
    "Check your inbox and spam folder."
)
PASSWORD_RESET_INVALID_MESSAGE_EN = (
    "This password reset link is invalid, has already been used, or has expired. "
    "Please request a new link."
)
PASSWORD_POLICY_MESSAGES_EN = {
    "too_short": "Password must be at least 10 characters long.",
    "too_long": "Password cannot be longer than 128 characters.",
    "common": "This password is too common or easy to guess. Choose a stronger password.",
    "contains_identity": "Password must not contain your email address or username.",
}


@router.post("/forgot-password", response_model=schemas.MessageResponse)
def forgot_password(
    request: Request,
    payload: schemas.PasswordResetRequest,
    db: Session = Depends(get_db),
):
    generic_message = (
        PASSWORD_RESET_GENERIC_MESSAGE_EN
        if payload.language == "EN"
        else PASSWORD_RESET_GENERIC_MESSAGE
    )
    email_lower = payload.email.lower()
    client_ip = resolve_client_ip(
        request, config.public_demo_policy().trust_proxy_headers
    )
    for limiter_key in (f"reset-ip:{client_ip}", f"reset-email:{email_lower}"):
        password_reset_request_limiter.enforce(limiter_key)
    for limiter_key in (f"reset-ip:{client_ip}", f"reset-email:{email_lower}"):
        password_reset_request_limiter.record_failure(limiter_key)

    # Configuration problems are global, so reporting them does not reveal
    # whether a particular address has an account.
    try:
        ensure_email_delivery_configured()
    except EmailDeliveryConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Password reset email cannot be sent right now. Please try again later."
                if payload.language == "EN"
                else "Parola sıfırlama e-postası şu anda gönderilemiyor. Lütfen daha sonra tekrar deneyin."
            ),
        ) from exc

    user = (
        db.query(models_db.User)
        .filter(models_db.User.email == email_lower)
        .first()
    )
    if user is None or not user.is_active:
        return schemas.MessageResponse(message=generic_message)

    raw_token, token_hash, expires_at = create_password_reset_token()
    user.password_reset_token_hash = token_hash
    user.password_reset_expires_at = expires_at
    # The token lives in the URL fragment so it never reaches server or CDN
    # logs and is not leaked through the Referer header.
    reset_url = f"{config.frontend_url()}/parola-sifirla#reset_token={raw_token}"
    try:
        send_password_reset_email(
            recipient=user.email,
            display_name=user.display_name,
            reset_url=reset_url,
            ttl_minutes=config.password_reset_ttl_minutes(),
            language=payload.language,
        )
    except (EmailDeliveryConfigurationError, OSError, httpx.HTTPError):
        db.rollback()
        logger.exception("Password reset email delivery failed")
        return schemas.MessageResponse(message=generic_message)
    db.commit()
    return schemas.MessageResponse(message=generic_message)


@router.post("/reset-password", response_model=schemas.MessageResponse)
def reset_password(
    request: Request,
    payload: schemas.PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    client_ip = resolve_client_ip(
        request, config.public_demo_policy().trust_proxy_headers
    )
    limiter_key = f"reset-confirm:{client_ip}"
    auth_attempt_limiter.enforce(limiter_key)

    token_hash = hash_verification_token(payload.token)
    user = (
        db.query(models_db.User)
        .filter(models_db.User.password_reset_token_hash == token_hash)
        .with_for_update()
        .first()
    )
    expires_at = user.password_reset_expires_at if user else None
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if (
        user is None
        or not user.is_active
        or expires_at is None
        or expires_at <= datetime.now(timezone.utc)
    ):
        auth_attempt_limiter.record_failure(limiter_key)
        if user is not None and expires_at is not None:
            # Expired tokens are useless; drop them so they cannot linger.
            user.password_reset_token_hash = None
            user.password_reset_expires_at = None
            db.commit()
        raise HTTPException(
            status_code=400,
            detail=(
                PASSWORD_RESET_INVALID_MESSAGE_EN
                if payload.language == "EN"
                else PASSWORD_RESET_INVALID_MESSAGE
            ),
        )

    try:
        validate_new_password(
            payload.new_password,
            email=user.email,
            display_name=user.display_name,
        )
    except PasswordPolicyError as exc:
        # Policy errors keep the token valid so the user can pick another password.
        detail = (
            PASSWORD_POLICY_MESSAGES_EN.get(exc.code, "Please choose a different password.")
            if payload.language == "EN"
            else str(exc)
        )
        raise HTTPException(status_code=400, detail=detail) from exc

    if user.password_hash and auth.verify_password(
        payload.new_password, user.password_hash
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Your new password must be different from your current password."
                if payload.language == "EN"
                else "Yeni parolanız mevcut parolanızdan farklı olmalıdır."
            ),
        )

    user.password_hash = auth.get_password_hash(payload.new_password)
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None
    user.password_changed_at = datetime.now(timezone.utc)
    # Opening the mailed link proves ownership of the address.
    user.email_verified = True
    user.email_verification_token_hash = None
    user.email_verification_expires_at = None
    db.commit()

    auth_attempt_limiter.clear(limiter_key)
    auth_attempt_limiter.clear(f"{client_ip}:{user.email.lower()}")
    return schemas.MessageResponse(
        message=(
            "Your password has been updated. You can now log in with your new password."
            if payload.language == "EN"
            else "Parolanız güncellendi. Yeni parolanızla giriş yapabilirsiniz."
        )
    )

@router.post("/login", response_model=schemas.Token)
def login(
    request: Request,
    user_credentials: schemas.UserLogin,
    db: Session = Depends(get_db),
):
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

    if config.email_verification_required() and not user.email_verified:
        raise HTTPException(
            status_code=403,
            detail=(
                "E-posta adresinizi doğrulamanız gerekiyor. "
                "Gelen kutunuzdaki DublajLab bağlantısını açın."
            ),
        )

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
