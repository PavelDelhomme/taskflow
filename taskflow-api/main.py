#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🎯 TaskFlow ADHD API - Backend Complet avec PostgreSQL
Système de tracking professionnel optimisé pour TDAH
Author: Paul Delhomme
Version: 2.0 - Production Ready
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from datetime import datetime, timedelta
import logging
import os
import hashlib
import jwt
from passlib.context import CryptContext
import uuid

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 🎯 Configuration Database PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://taskflow:taskflow123@taskflow-db:5432/taskflow_adhd")
SECRET_KEY = os.getenv("SECRET_KEY", "taskflow-adhd-secret-key-paul-delhomme-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 heures

# SQLAlchemy setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ============================================================================
# 🗄️ MODÈLES DATABASE (SQLAlchemy)
# ============================================================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    status = Column(String(20), default="todo")  # todo, in-progress, blocked, waiting-review, done
    priority = Column(String(10), default="medium")  # low, medium, high, urgent
    project = Column(String(100), default="")
    estimated_duration = Column(Integer, default=30)  # minutes
    actual_duration = Column(Integer, default=0)
    focus_count = Column(Integer, default=0)
    distraction_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class FocusSession(Base):
    __tablename__ = "focus_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    task_id = Column(Integer, nullable=False)
    duration = Column(Integer, nullable=False)  # minutes
    quality_score = Column(Integer, default=3)  # 1-5
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

class DailyReport(Base):
    __tablename__ = "daily_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    report_date = Column(DateTime, nullable=False)
    tasks_completed = Column(Integer, default=0)
    tasks_created = Column(Integer, default=0)
    total_focus_time = Column(Integer, default=0)  # minutes
    productivity_score = Column(Float, default=0.0)
    summary = Column(Text, default="")
    challenges = Column(Text, default="")
    next_day_goals = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

# Créer les tables
Base.metadata.create_all(bind=engine)

# ============================================================================
# 📊 MODÈLES PYDANTIC (API)
# ============================================================================

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = ""

class UserLogin(BaseModel):
    username: str
    password: str

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    project: Optional[str] = ""
    estimated_duration: Optional[int] = 30

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    project: Optional[str] = None
    estimated_duration: Optional[int] = None

class FocusSessionCreate(BaseModel):
    task_id: int
    duration: int
    quality_score: Optional[int] = 3
    notes: Optional[str] = ""

# ============================================================================
# 🚀 APPLICATION FASTAPI
# ============================================================================

app = FastAPI(
    title="TaskFlow ADHD API",
    description="API de tracking professionnel optimisée pour TDAH - Paul Delhomme",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS avec nouveaux ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3003",  # Nouveau port Web
        "http://web:3000",
        "http://taskflow-web:3000",
        "https://taskflow.delhomme.ovh"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# 🔐 FONCTIONS D'AUTHENTIFICATION
# ============================================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# ============================================================================
# 🏠 ROUTES PRINCIPALES
# ============================================================================

@app.get("/")
async def root():
    """Page d'accueil API"""
    return {
        "message": "🎯 TaskFlow ADHD API - Système de tracking professionnel",
        "version": "2.0.0",
        "author": "Paul Delhomme",
        "docs": "/api/docs",
        "health": "/health",
        "ports": {
            "api": "8008",
            "web": "3003", 
            "db": "5435"
        },
        "features": ["PostgreSQL", "JWT Auth", "Focus Sessions", "Daily Reports"]
    }

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check complet avec DB"""
    try:
        # Test connection DB
        db.execute("SELECT 1")
        return {
            "status": "healthy",
            "service": "TaskFlow ADHD API",
            "timestamp": datetime.utcnow(),
            "version": "2.0.0",
            "database": "connected",
            "auth": "jwt_enabled",
            "ports": {
                "current_api": "8000 (internal)",
                "external_api": "8008",
                "web": "3003",
                "database": "5435"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow()
        }

# ============================================================================
# 🔐 ROUTES AUTHENTIFICATION
# ============================================================================

@app.post("/api/auth/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Inscription utilisateur"""
    # Vérifier si l'utilisateur existe
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Créer l'utilisateur
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    logger.info(f"Nouvel utilisateur créé: {user.username}")
    
    return {
        "message": "Utilisateur créé avec succès",
        "user_id": user.id,
        "username": user.username
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Connexion utilisateur"""
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Username ou mot de passe incorrect")
    
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Compte désactivé")
    
    # Créer le token JWT
    access_token = create_access_token(data={"sub": user.username})
    
    logger.info(f"Connexion réussie: {user.username}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email
        }
    }

@app.get("/api/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Informations utilisateur connecté"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at
    }

# ============================================================================
# 📝 ROUTES GESTION DES TÂCHES ADHD
# ============================================================================

@app.get("/api/tasks")
async def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    project: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer toutes les tâches de l'utilisateur"""
    query = db.query(Task).filter(Task.user_id == current_user.id)
    
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if project:
        query = query.filter(Task.project == project)
    
    tasks = query.order_by(Task.created_at.desc()).all()
    
    return [{
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "project": task.project,
        "estimated_duration": task.estimated_duration,
        "actual_duration": task.actual_duration,
        "focus_count": task.focus_count,
        "distraction_count": task.distraction_count,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "completed_at": task.completed_at
    } for task in tasks]

@app.post("/api/tasks")
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Créer une nouvelle tâche"""
    task = Task(
        user_id=current_user.id,
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        priority=task_data.priority,
        project=task_data.project,
        estimated_duration=task_data.estimated_duration
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    logger.info(f"Tâche créée par {current_user.username}: {task.title}")
    
    return {
        "id": task.id,
        "message": "Tâche créée avec succès",
        "task": {
            "id": task.id,
            "title": task.title,
            "status": task.status,
            "priority": task.priority
        }
    }

@app.put("/api/tasks/{task_id}")
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mettre à jour une tâche"""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    
    # Mise à jour des champs
    update_data = task_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    
    # Marquer comme complété si status = done
    if task_data.status == "done" and task.status != "done":
        task.completed_at = datetime.utcnow()
    
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    
    logger.info(f"Tâche mise à jour par {current_user.username}: {task.title}")
    
    return {"message": "Tâche mise à jour", "task_id": task.id}

@app.delete("/api/tasks/{task_id}")
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprimer une tâche"""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    
    db.delete(task)
    db.commit()
    
    logger.info(f"Tâche supprimée par {current_user.username}: {task.title}")
    
    return {"message": "Tâche supprimée"}

# ============================================================================
# 🎯 ROUTES SESSIONS DE FOCUS ADHD
# ============================================================================

@app.post("/api/focus-sessions")
async def create_focus_session(
    session_data: FocusSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enregistrer une session de focus"""
    # Vérifier que la tâche appartient à l'utilisateur
    task = db.query(Task).filter(Task.id == session_data.task_id, Task.user_id == current_user.id).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    
    # Créer la session de focus
    session = FocusSession(
        user_id=current_user.id,
        task_id=session_data.task_id,
        duration=session_data.duration,
        quality_score=session_data.quality_score,
        notes=session_data.notes
    )
    
    db.add(session)
    
    # Mettre à jour la tâche
    task.focus_count += 1
    task.actual_duration += session_data.duration
    task.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(session)
    
    logger.info(f"Session focus enregistrée: {session_data.duration} min par {current_user.username}")
    
    return {
        "message": "Session de focus enregistrée",
        "session_id": session.id,
        "duration": session.duration,
        "quality_score": session.quality_score
    }

@app.get("/api/focus-sessions/{task_id}")
async def get_task_focus_sessions(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupérer les sessions de focus d'une tâche"""
    sessions = db.query(FocusSession).filter(
        FocusSession.task_id == task_id,
        FocusSession.user_id == current_user.id
    ).order_by(FocusSession.created_at.desc()).all()
    
    return [{
        "id": session.id,
        "duration": session.duration,
        "quality_score": session.quality_score,
        "notes": session.notes,
        "created_at": session.created_at
    } for session in sessions]

# ============================================================================
# 📊 ROUTES DAILY MEETINGS ET STATISTIQUES
# ============================================================================

@app.get("/api/daily/today")
async def get_daily_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rapport quotidien pour daily meeting"""
    from datetime import date
    today = date.today()
    
    # Tâches du jour
    today_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.created_at >= today
    ).all()
    
    completed_today = [t for t in today_tasks if t.status == "done"]
    in_progress = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status == "in-progress"
    ).all()
    
    blocked_tasks = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status == "blocked"
    ).all()
    
    # Sessions de focus du jour
    today_sessions = db.query(FocusSession).filter(
        FocusSession.user_id == current_user.id,
        FocusSession.created_at >= today
    ).all()
    
    total_focus_time = sum([s.duration for s in today_sessions])
    avg_quality = sum([s.quality_score for s in today_sessions]) / max(len(today_sessions), 1)
    
    return {
        "date": today,
        "user": current_user.username,
        "summary": {
            "tasks_created_today": len(today_tasks),
            "tasks_completed_today": len(completed_today),
            "tasks_in_progress": len(in_progress),
            "blocked_tasks": len(blocked_tasks),
            "focus_sessions": len(today_sessions),
            "total_focus_time": total_focus_time,
            "avg_focus_quality": round(avg_quality, 1)
        },
        "completed_tasks": [{"id": t.id, "title": t.title, "project": t.project} for t in completed_today],
        "in_progress_tasks": [{"id": t.id, "title": t.title, "project": t.project} for t in in_progress],
        "blocked_tasks": [{"id": t.id, "title": t.title, "reason": t.description} for t in blocked_tasks],
        "productivity_score": len(completed_today) * 10 + len(today_sessions) * 5
    }

@app.post("/api/daily/save-report")
async def save_daily_report(
    summary: str,
    challenges: str = "",
    next_day_goals: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Sauvegarder le rapport daily"""
    from datetime import date
    today = date.today()
    
    # Stats du jour
    daily_stats = await get_daily_report(current_user, db)
    
    report = DailyReport(
        user_id=current_user.id,
        report_date=today,
        tasks_completed=daily_stats["summary"]["tasks_completed_today"],
        tasks_created=daily_stats["summary"]["tasks_created_today"],
        total_focus_time=daily_stats["summary"]["total_focus_time"],
        productivity_score=daily_stats["productivity_score"],
        summary=summary,
        challenges=challenges,
        next_day_goals=next_day_goals
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    logger.info(f"Daily report sauvé pour {current_user.username}")
    
    return {"message": "Rapport daily sauvegardé", "report_id": report.id}

# ============================================================================
# 🎯 DONNÉES DE DEMO POUR TESTS
# ============================================================================

@app.post("/api/demo/init")
async def init_demo_data(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Initialiser avec des données de demo pour Paul"""
    demo_tasks_data = [
        {
            "title": "Finaliser API TaskFlow ADHD",
            "description": "Implémenter PostgreSQL + JWT + Tests",
            "status": "in-progress",
            "priority": "high",
            "project": "TaskFlow",
            "estimated_duration": 120
        },
        {
            "title": "Daily standup 11h PITER",
            "description": "Préparer rapport d'avancement",
            "status": "todo",
            "priority": "medium",
            "project": "PITER",
            "estimated_duration": 15
        },
        {
            "title": "Optimiser Docker Compose",
            "description": "Résoudre conflits containers",
            "status": "done",
            "priority": "high",
            "project": "DevOps",
            "estimated_duration": 60
        }
    ]
    
    for task_data in demo_tasks_data:
        task = Task(user_id=current_user.id, **task_data)
        db.add(task)
    
    db.commit()
    
    logger.info(f"Données de demo créées pour {current_user.username}")
    
    return {"message": "Données de demo créées", "tasks_count": len(demo_tasks_data)}

# ============================================================================
# 🚀 LANCEMENT SERVEUR
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )