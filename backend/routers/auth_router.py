from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer
import os

from backend.database import get_db
import backend.models_db as models_db
import backend.schemas as schemas
import backend.auth as auth

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
    if user is None:
        raise credentials_exception
    return user

from fastapi import Request
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
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    email_lower = user_credentials.email.lower()
    user = db.query(models_db.User).filter(models_db.User.email == email_lower).first()
    if not user:
        raise HTTPException(status_code=400, detail="E-posta veya şifre hatalı.")
        
    if not auth.verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(status_code=400, detail="E-posta veya şifre hatalı.")
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models_db.User = Depends(get_current_user)):
    return current_user
