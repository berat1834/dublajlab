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
