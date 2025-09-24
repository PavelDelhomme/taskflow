from fastapi import APIRouter, HTTPException
from models import UserRegister, UserLogin
from auth import hash_password, verify_password, create_token, validate_delhomme_email
from database import get_db
import re
import sqlite3

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
async def register(user: UserRegister):
    # Validation domaine (silencieuse pour sécurité)
    if not validate_delhomme_email(user.email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Validation username
    if not re.match(r'^[a-zA-Z0-9_]{3,20}$', user.username):
        raise HTTPException(status_code=400, detail="Username must be 3-20 characters, alphanumeric and underscore only")
    
    with get_db() as conn:
        # Vérifier si utilisateur existe
        existing = conn.execute(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            (user.username, user.email)
        ).fetchone()
        
        if existing:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Créer utilisateur
        password_hash = hash_password(user.password)
        
        cursor = conn.execute("""
            INSERT INTO users (username, email, password_hash, full_name)
            VALUES (?, ?, ?, ?)
        """, (user.username, user.email, password_hash, user.full_name))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        # Créer token
        token = create_token({"user_id": user_id, "username": user.username})
        
        return {
            "access_token": token, 
            "token_type": "bearer", 
            "user": {
                "id": user_id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name
            }
        }

@router.post("/login")
async def login(user: UserLogin):
    with get_db() as conn:
        db_user = conn.execute(
            "SELECT id, username, password_hash, full_name FROM users WHERE email = ? AND is_active = true",
            (user.email,)
        ).fetchone()
        
        if not db_user or not verify_password(user.password, db_user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_token({"user_id": db_user["id"], "username": db_user["username"]})
        return {
            "access_token": token, 
            "token_type": "bearer", 
            "user": {
                "id": db_user["id"],
                "username": db_user["username"],
                "full_name": db_user["full_name"]
            }
        }
