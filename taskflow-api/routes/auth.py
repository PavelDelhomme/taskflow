import hashlib
import jwt
import secrets
import base64
import re
from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

router = APIRouter(prefix="/reports", tags=["reports"])

# Configuration
SECRET_KEY = "taskflow-adhd-secret-key-paul-delhomme-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24h pour multi-sessions
ALLOWED_DOMAIN = "@delhomme.ovh"

security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash password with SHA-256 + salt"""
    salt = secrets.token_bytes(32)
    salt_b64 = base64.b64encode(salt).decode('utf-8')
    password_salt = password + salt_b64
    hashed = hashlib.sha256(password_salt.encode('utf-8')).hexdigest()
    return f"sha256${salt_b64}${hashed}"

def verify_password(input_password: str, stored_hash: str) -> bool:
    """Verify password against stored hash"""
    if not stored_hash.startswith('sha256$'):
        # Fallback pour ancien hash simple
        return hashlib.sha256(input_password.encode()).hexdigest() == stored_hash
    
    parts = stored_hash.split('$')
    if len(parts) != 3:
        return False
    
    salt_part = parts[1]
    hash_part = parts[2]
    
    password_salt = input_password + salt_part
    calculated_hash = hashlib.sha256(password_salt.encode('utf-8')).hexdigest()
    
    return calculated_hash == hash_part

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def validate_delhomme_email(email: str) -> bool:
    """Valide que l'email appartient au domaine @delhomme.ovh"""
    return email.endswith(ALLOWED_DOMAIN)