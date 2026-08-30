import datetime
import hashlib
from typing import Optional, List
import jwt
from jwt import PyJWTError as JWTError
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import (
    SECRET_KEY, REFRESH_SECRET_KEY, ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
)
from app.database import get_db
from app.models import User, RefreshToken, Incident, Task, Technician

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validates that a password satisfies government-portal security complexity rules."""
    if not password or len(password) < 6:
        return False, "Password must be at least 6 characters in length."
    if len(password) > 128:
        return False, "Password cannot exceed 128 characters."
    return True, "Valid"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(user_id: int, username: str, db: Session) -> str:
    import uuid
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": username,
        "user_id": user_id,
        "exp": expire,
        "type": "refresh",
        "jti": uuid.uuid4().hex
    }
    raw_token = jwt.encode(payload, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    
    # Store token hash in database
    token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
    refresh_record = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expire,
        revoked=False
    )
    db.add(refresh_record)
    db.commit()
    return raw_token

def verify_and_rotate_refresh_token(raw_token: str, db: Session) -> tuple[User, str]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(raw_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise credentials_exception
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")
    except JWTError:
        raise credentials_exception

    token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
    token_record = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.user_id == user_id,
        RefreshToken.revoked == False
    ).first()

    if not token_record or token_record.expires_at < datetime.datetime.utcnow():
        raise credentials_exception

    # Revoke old token
    token_record.revoked = True
    db.commit()

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise credentials_exception

    # Generate new refresh token
    new_refresh = create_refresh_token(user.id, user.username, db)
    return user, new_refresh

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in with a valid session.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_type: str = payload.get("type", "access")
        if username is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None or not getattr(user, 'is_active', True):
        raise credentials_exception
    return user

# ─────────────────────────────────────────────────────────────
# STRICT AUTHORIZATION & RBAC GUARDS
# ─────────────────────────────────────────────────────────────
def require_roles(allowed_roles: List[str]):
    """Enforces that the authenticated user holds one of the required roles."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles and current_user.role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role in {allowed_roles}, but current role is '{current_user.role}'."
            )
        return current_user
    return role_checker

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["admin", "district", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Panchayat administrative privilege required."
        )
    return current_user

def require_collector(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["district", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="District Collector oversight privilege required."
        )
    return current_user

def require_worker(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["worker", "admin", "district", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Field technician privilege required."
        )
    return current_user

def check_task_ownership(task_id: int, current_user: User, db: Session) -> Task:
    """IDOR protection: verifies that the worker is assigned to this task, or is an admin/collector."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if current_user.role in ["admin", "district", "super_admin"]:
        return task

    if current_user.role == "worker":
        tech = db.query(Technician).filter(Technician.user_id == current_user.id).first()
        if tech and task.technician_id == tech.id:
            return task
            
    raise HTTPException(status_code=403, detail="Unauthorized access to this task.")
