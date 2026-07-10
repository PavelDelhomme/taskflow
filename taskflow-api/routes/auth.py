from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from passlib.hash import bcrypt as passlib_bcrypt
import bcrypt as bcrypt_lib
from datetime import datetime, timedelta
from typing import Optional
import jwt
import re
import hashlib
import os

from database import get_db

# Router
router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "taskflow-adhd-secret-key-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
ALLOW_REGISTRATION = os.getenv("ALLOW_REGISTRATION", "false").lower() in ("1", "true", "yes")

# Models
class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

# Utilitaires
def hash_password(password: str) -> str:
    """Hash password avec bcrypt"""
    return bcrypt_lib.hashpw(password.encode("utf-8"), bcrypt_lib.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifier password — bcrypt, SHA-256 salé, SHA-256 simple"""
    if hashed_password.startswith("$2"):
        try:
            return bcrypt_lib.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8"),
            )
        except (ValueError, TypeError):
            try:
                return passlib_bcrypt.verify(plain_password, hashed_password)
            except (ValueError, TypeError):
                return False

    if hashed_password.startswith("sha256$"):
        parts = hashed_password.split("$")
        if len(parts) != 3:
            return False
        salt_part = parts[1]
        hash_part = parts[2]
        password_salt = plain_password + salt_part
        calculated_hash = hashlib.sha256(password_salt.encode("utf-8")).hexdigest()
        return calculated_hash == hash_part

    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Créer JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        username: str = payload.get("username")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": int(user_id), "username": username}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def validate_email(email: str) -> bool:
    """Valider format email standard"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

# 🔐 ROUTES AUTH

@router.get("/config")
async def auth_config():
    """Configuration publique auth (inscription ouverte ou non)"""
    return {"allow_registration": ALLOW_REGISTRATION}

@router.post("/register", response_model=Token)
async def register(user_data: UserRegister):
    """Inscription utilisateur — désactivée si ALLOW_REGISTRATION=false"""

    if not ALLOW_REGISTRATION:
        raise HTTPException(
            status_code=403,
            detail="Registration is disabled. Contact the administrator."
        )

    if not validate_email(user_data.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Validation username
    if not re.match(r'^[a-zA-Z0-9_]{3,20}$', user_data.username):
        raise HTTPException(
            status_code=400,
            detail="Username must be 3-20 chars, alphanumeric and underscore only"
        )
    
    with get_db() as cursor:
        # Check si user existe déjà
        cursor.execute(
            "SELECT id FROM users WHERE username = %s OR email = %s",
            (user_data.username, user_data.email)
        )
        existing = cursor.fetchone()
        
        if existing:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Insert user
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, full_name) 
            VALUES (%s, %s, %s, %s)
            RETURNING id, username, email, full_name
        """, (user_data.username, user_data.email, hashed_password, user_data.full_name))
        
        new_user = cursor.fetchone()
        
        # Créer JWT token
        access_token = create_access_token(
            data={"user_id": new_user["id"], "username": new_user["username"]}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": new_user["id"],
                "username": new_user["username"],
                "email": new_user["email"],
                "full_name": new_user["full_name"]
            }
        }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Connexion utilisateur"""
    
    with get_db() as cursor:
        # Récupérer user
        cursor.execute(
            "SELECT id, username, email, password_hash, full_name FROM users WHERE email = %s AND is_active = true",
            (credentials.email,)
        )
        user = cursor.fetchone()
        
        # Vérifier user + password
        if not user or not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )
        
        # Créer JWT token
        access_token = create_access_token(
            data={"user_id": user["id"], "username": user["username"]}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "full_name": user["full_name"]
            }
        }

@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    """Récupérer infos utilisateur courant"""
    
    with get_db() as cursor:
        cursor.execute(
            "SELECT id, username, email, full_name, created_at FROM users WHERE id = %s",
            (current_user["user_id"],)
        )
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "full_name": user["full_name"],
            "created_at": user["created_at"]
        }