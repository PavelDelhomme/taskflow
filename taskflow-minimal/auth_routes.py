# 🔐 TaskFlow ADHD - Routes d'Authentification COMPLÈTES
# Basé sur l'auth.py de taskflow-minimal + fonctionnalités avancées

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from passlib.hash import bcrypt
from datetime import datetime, timedelta
from typing import Optional
import jwt
import re
import hashlib
import secrets
import base64

from database import get_db

# Router
router = APIRouter(prefix="/auth", tags=["🔐 Authentication"])
security = HTTPBearer()

# Configuration
SECRET_KEY = "taskflow-adhd-secret-key-paul-delhomme-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24h
ALLOWED_DOMAIN = "@delhomme.ovh"

# Models
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserPasswordReset(BaseModel):
    email: EmailStr
    new_password: str
    
class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

# 🔒 Fonctions de hachage (avec compatibilité bcrypt ET SHA256)
def hash_password_sha256(password: str) -> str:
    """Hash password with SHA-256 + salt (nouveau système)"""
    salt = secrets.token_bytes(32)
    salt_b64 = base64.b64encode(salt).decode('utf-8')
    password_salt = password + salt_b64
    hashed = hashlib.sha256(password_salt.encode('utf-8')).hexdigest()
    return f"sha256${salt_b64}${hashed}"

def hash_password_bcrypt(password: str) -> str:
    """Hash password avec bcrypt (ancien système)"""
    return bcrypt.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifier password - supporte bcrypt ET SHA256"""
    
    # 🔄 Nouveau système SHA256
    if hashed_password.startswith('sha256$'):
        parts = hashed_password.split('$')
        if len(parts) != 3:
            return False
        salt_part = parts[1]
        hash_part = parts[2]
        password_salt = plain_password + salt_part
        calculated_hash = hashlib.sha256(password_salt.encode('utf-8')).hexdigest()
        return calculated_hash == hash_part
    
    # 🔄 Ancien système bcrypt (pour compatibility)
    elif hashed_password.startswith('$2b$'):
        return bcrypt.verify(plain_password, hashed_password)
    
    # 🔄 Hash simple (emergency fallback)
    else:
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

def validate_delhomme_email(email: str) -> bool:
    """Valide que l'email appartient au domaine @delhomme.ovh"""
    return email.endswith(ALLOWED_DOMAIN)

def validate_password_strength(password: str) -> bool:
    """Valide la force du mot de passe"""
    # Au moins 8 caractères
    if len(password) < 8:
        return False
    # Au moins une majuscule, une minuscule, un chiffre
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    
    return has_upper and has_lower and has_digit

# 🔐 ROUTES AUTH

@router.post("/register", response_model=Token)
async def register(user_data: UserRegister):
    """Inscription utilisateur (domaine @delhomme.ovh uniquement)"""
    
    # Validation email domaine
    if not validate_delhomme_email(user_data.email):
        raise HTTPException(
            status_code=400,
            detail="Email must be from @delhomme.ovh domain"
        )
    
    # Validation username
    if not re.match(r'^[a-zA-Z0-9_]{3,20}$', user_data.username):
        raise HTTPException(
            status_code=400,
            detail="Username must be 3-20 chars, alphanumeric and underscore only"
        )
    
    # Validation password strength
    if not validate_password_strength(user_data.password):
        raise HTTPException(
            status_code=400,
            detail="Password must be 8+ chars with uppercase, lowercase and number"
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
        
        # Hash password avec nouveau système SHA256
        hashed_password = hash_password_sha256(user_data.password)
        
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
        
        # Vérifier user + password (supporte bcrypt + SHA256)
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

@router.post("/reset-password")
async def reset_password(reset_data: UserPasswordReset, current_user = Depends(get_current_user)):
    """Réinitialiser mot de passe (pour Paul uniquement)"""
    
    # Validation password strength
    if not validate_password_strength(reset_data.new_password):
        raise HTTPException(
            status_code=400,
            detail="Password must be 8+ chars with uppercase, lowercase and number"
        )
    
    with get_db() as cursor:
        # Vérifier que l'email correspond à l'utilisateur connecté
        cursor.execute(
            "SELECT email FROM users WHERE id = %s",
            (current_user["user_id"],)
        )
        user_email = cursor.fetchone()
        
        if not user_email or user_email["email"] != reset_data.email:
            raise HTTPException(status_code=403, detail="Cannot reset password for this email")
        
        # Hash nouveau mot de passe
        new_hashed_password = hash_password_sha256(reset_data.new_password)
        
        # Mettre à jour
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (new_hashed_password, current_user["user_id"])
        )
        
        return {"message": "Password updated successfully"}

@router.post("/refresh")
async def refresh_token(current_user = Depends(get_current_user)):
    """Refresh JWT token"""
    
    # Créer nouveau token
    access_token = create_access_token(
        data={"user_id": current_user["user_id"], "username": current_user["username"]}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }