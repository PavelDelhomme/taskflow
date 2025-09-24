from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta
import sqlite3
import hashlib
import jwt
import os
import re
from contextlib import contextmanager

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "taskflow-adhd-secret-key-paul-delhomme-2025")
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USER = os.getenv("EMAIL_USER", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "taskflow@delhomme.ovh")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24h pour multi-sessions

# Domaine autorisé pour inscription
ALLOWED_DOMAIN = "@delhomme.ovh"

# FastAPI app
app = FastAPI(title="TaskFlow ADHD API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for multi-device
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Database
DATABASE = "/app/data/taskflow.db"

@contextmanager
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Models
class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Task(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = 'medium'

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    blocked_reason: Optional[str] = None

# Hash functions
def hash_password(password: str) -> str:
    """Hash password with SHA-256 + salt"""
    import secrets
    import base64
    
    salt = secrets.token_bytes(32)
    salt_b64 = base64.b64encode(salt).decode('utf-8')
    password_salt = password + salt_b64
    hashed = hashlib.sha256(password_salt.encode('utf-8')).hexdigest()
    return f"sha256${salt_b64}${hashed}"

def send_email(to_email: str, subject: str, body: str):
    """Envoyer un email de notification"""
    if not EMAIL_USER or not EMAIL_PASSWORD:
        print(f"Email skipped (no config): {subject}")
        return
    
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_FROM
        msg['To'] = to_email
        msg['Subject'] = f"🎯 TaskFlow ADHD - {subject}"
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(EMAIL_FROM, to_email, text)
        server.quit()
        print(f"Email sent to {to_email}: {subject}")
    except Exception as e:
        print(f"Email failed: {e}")



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

# Initialize DB
def init_db():
    os.makedirs("/app/data", exist_ok=True)
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'todo',
                priority TEXT DEFAULT 'medium',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                blocked_reason TEXT,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                standby_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            
            CREATE TABLE IF NOT EXISTS task_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                details TEXT,
                FOREIGN KEY (task_id) REFERENCES tasks (id)
            );
            
            CREATE TABLE IF NOT EXISTS workflows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                steps TEXT NOT NULL,
                category TEXT DEFAULT 'dev',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                message TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        """)
        
        # Créer utilisateur Paul avec ton mot de passe sécurisé
        try:
            # Ton hash généré : utilise celui de notre calcul précédent
            password_hash = "sha256$aa+qb6XJ9lrOlR1zGCcqUqI6PkT9mhhkBhOTRSP039Q=$b2a06b2d19777fb4151ea69be5b9da909db126ad6eaa95069b3301b251bf59b7"
            
            cursor = conn.execute("""
                INSERT INTO users (username, email, password_hash, full_name) 
                VALUES (?, ?, ?, ?)
            """, ("paul", "paul@delhomme.ovh", password_hash, "Paul Delhomme"))
            
            user_id = cursor.lastrowid
            
            # Ajouter workflows par défaut
            workflows = [
                ("Pré développement", """1. Vérifie la tâche assignée sur Trello (MEP Tech/backlog/sprint)
2. Crée une nouvelle branche propre depuis dev
3. Installe les dépendances si besoin: composer install
4. Met à jour README si fonctionnalité majeure
5. Déplace la carte Trello en "En cours" """, "dev"),
                
                ("Pendant développement", """1. Avance le ticket Trello selon l'état
2. Développe la feature/correctif
3. Lance les tests automatisés localement
4. Met à jour l'avancement pour le Daily 11h
5. Documente les blocages rencontrés""", "dev"),
                
                ("Pré Pull Request", """1. Synchronise avec dev (git merge/rebase origin/dev)
2. Vérifie le nom du commit (feat:, fix:, hotfix:)
3. Lance tous les tests (Playwright, PHPUnit, PHPStan, PHPCS)
4. Crée la PR (feat/branch → dev)
5. Ajoute le lien PR en pièce jointe Trello
6. Déplace carte en "Merge Request"
7. Rédige description claire de la PR""", "git"),
                
                ("Post Merge", """1. Pull la branche dev localement
2. Vérifie le déploiement CI/CD
3. Relance tests end-to-end si nécessaire
4. Déplace carte Trello (Test/Done)
5. Prévient l'équipe si impact sur leur périmètre
6. Nettoie la branche feature locale""", "git"),
                
                ("Checklist Quotidienne", """1. Vérifier les Logs de Brevo pour emails bloqués
2. Débloquer tous les mails non piter.at
3. Analyser si tout fonctionne bien
4. Vérifier les filtres Brevo
5. Contrôler les contrats et déblocages
6. Daily meeting 11h - Préparer avancement""", "daily"),
                
                ("Rappel Tickets", """🎯 AUCUNE TÂCHE ACTIVE - Actions à faire:

1. Aller sur Trello → Colonne "Tests-Auto"
2. Prendre un ticket de test automatisé
3. OU Aller sur "MEP Tech" → Prendre nouvelle feature
4. OU Contacter collègue sur tâche partagée pour aider
5. OU Reprendre tâche en standby si déblocage possible

⚠️ Ne JAMAIS rester sans tâche active !""", "reminder")
            ]
            
            for name, steps, category in workflows:
                conn.execute(
                    "INSERT INTO workflows (user_id, name, steps, category) VALUES (?, ?, ?, ?)",
                    (user_id, name, steps, category)
                )
                
            conn.commit()
        except sqlite3.IntegrityError:
            pass

# Auth functions
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

# Routes
@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}

@app.post("/auth/register")
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

@app.post("/auth/login")
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

@app.get("/tasks")
async def get_tasks(user_id: int = Depends(get_current_user)):
    with get_db() as conn:
        # Note: Tous les utilisateurs @delhomme.ovh voient les mêmes tâches (base commune)
        tasks = conn.execute("""
            SELECT * FROM tasks 
            ORDER BY 
                CASE status 
                    WHEN 'in_progress' THEN 1
                    WHEN 'blocked' THEN 2
                    WHEN 'standby' THEN 3
                    WHEN 'todo' THEN 4
                    WHEN 'review' THEN 5
                    WHEN 'done' THEN 6
                END,
                priority DESC,
                created_at DESC
        """).fetchall()
        
        return [dict(task) for task in tasks]

@app.post("/tasks")
async def create_task(task: Task, user_id: int = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.execute("""
            INSERT INTO tasks (user_id, title, description, priority)
            VALUES (?, ?, ?, ?)
        """, (user_id, task.title, task.description, task.priority))
        
        task_id = cursor.lastrowid
        
        # Log creation
        conn.execute("""
            INSERT INTO task_logs (task_id, action, details)
            VALUES (?, 'created', ?)
        """, (task_id, f"Task created: {task.title}"))
        
        conn.commit()
        
        return {"id": task_id, "message": "Task created"}

@app.put("/tasks/{task_id}")
async def update_task(task_id: int, task_update: TaskUpdate, user_id: int = Depends(get_current_user)):
    with get_db() as conn:
        # Vérifier que la tâche existe (pas de restriction user pour base commune)
        existing = conn.execute(
            "SELECT * FROM tasks WHERE id = ?",
            (task_id,)
        ).fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Update fields
        update_fields = []
        values = []
        
        if task_update.title is not None:
            update_fields.append("title = ?")
            values.append(task_update.title)
            
        if task_update.description is not None:
            update_fields.append("description = ?")
            values.append(task_update.description)
            
        if task_update.status is not None:
            update_fields.append("status = ?")
            values.append(task_update.status)
            
            # Log timestamps selon le statut
            if task_update.status == 'in_progress' and existing['status'] != 'in_progress':
                update_fields.append("started_at = CURRENT_TIMESTAMP")
            elif task_update.status == 'done' and existing['status'] != 'done':
                update_fields.append("completed_at = CURRENT_TIMESTAMP")
            elif task_update.status == 'standby' and existing['status'] != 'standby':
                update_fields.append("standby_at = CURRENT_TIMESTAMP")
                
        if task_update.priority is not None:
            update_fields.append("priority = ?")
            values.append(task_update.priority)
            
        if task_update.blocked_reason is not None:
            update_fields.append("blocked_reason = ?")
            values.append(task_update.blocked_reason)
        
        if update_fields:
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(task_id)
            
            conn.execute(f"""
                UPDATE tasks 
                SET {', '.join(update_fields)}
                WHERE id = ?
            """, values)
            
            # Log action
            action = task_update.status or 'updated'
            details = f"Status: {task_update.status}" if task_update.status else "Task updated"
            if task_update.blocked_reason:
                details += f" | Blocked: {task_update.blocked_reason}"
                
            conn.execute("""
                INSERT INTO task_logs (task_id, action, details)
                VALUES (?, ?, ?)
            """, (task_id, action, details))
            
            conn.commit()
        
        return {"message": "Task updated"}

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: int, user_id: int = Depends(get_current_user)):
    with get_db() as conn:
        result = conn.execute(
            "DELETE FROM tasks WHERE id = ?",
            (task_id,)
        )
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Task not found")
        
        conn.commit()
        return {"message": "Task deleted"}

@app.get("/daily-summary")
async def get_daily_summary(user_id: int = Depends(get_current_user)):
    with get_db() as conn:
        # Tasks en cours
        in_progress = conn.execute("""
            SELECT title, description, blocked_reason 
            FROM tasks 
            WHERE status = 'in_progress'
            ORDER BY priority DESC
        """).fetchall()
        
        # Tasks bloquées
        blocked = conn.execute("""
            SELECT title, blocked_reason 
            FROM tasks 
            WHERE status = 'blocked'
        """).fetchall()
        
        # Tasks en standby
        standby = conn.execute("""
            SELECT title, description
            FROM tasks 
            WHERE status = 'standby'
        """).fetchall()
        
        # Tasks terminées aujourd'hui
        completed_today = conn.execute("""
            SELECT title 
            FROM tasks 
            WHERE status = 'done' 
            AND DATE(completed_at) = DATE('now')
        """).fetchall()
        
        # Tasks en review
        in_review = conn.execute("""
            SELECT title 
            FROM tasks 
            WHERE status = 'review'
        """).fetchall()
        
        # Générer résumé
        summary = "📋 **DAILY SUMMARY**\n\n"
        
        if in_progress:
            summary += "🔄 **En cours:**\n"
            for task in in_progress:
                summary += f"- {task['title']}\n"
            summary += "\n"
        
        if completed_today:
            summary += "✅ **Terminé aujourd'hui:**\n"
            for task in completed_today:
                summary += f"- {task['title']}\n"
            summary += "\n"
        
        if blocked:
            summary += "🚫 **Blocages:**\n"
            for task in blocked:
                summary += f"- {task['title']}: {task['blocked_reason']}\n"
            summary += "\n"
        
        if standby:
            summary += "⏸️ **En standby:**\n"
            for task in standby:
                summary += f"- {task['title']}\n"
            summary += "\n"
        
        if in_review:
            summary += "⏳ **En review:**\n"
            for task in in_review:
                summary += f"- {task['title']}\n"
            summary += "\n"
        
        # Rappel si aucune tâche active
        active_tasks = len(in_progress)
        if active_tasks == 0:
            summary += "🎯 **AUCUNE TÂCHE ACTIVE** - Prendre nouveau ticket Trello !\n"
            summary += "➡️ Voir workflow 'Rappel Tickets' pour actions à faire\n\n"
        
        summary += "🎯 **Prochaines étapes:** [À compléter]\n"
        summary += "💬 **Points à signaler:** [À compléter]"
        
        return {"summary": summary, "needs_new_ticket": active_tasks == 0}

@app.get("/weekly-summary")
async def get_weekly_summary(user_id: int = Depends(get_current_user)):
    with get_db() as conn:
        # Stats de la semaine
        stats = conn.execute("""
            SELECT 
                COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_count,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
                COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_count,
                COUNT(CASE WHEN status = 'standby' THEN 1 END) as standby_count,
                COUNT(*) as total_count
            FROM tasks 
            WHERE created_at >= datetime('now', '-7 days')
        """).fetchone()
        
        # Tâches terminées cette semaine
        completed_week = conn.execute("""
            SELECT title, completed_at 
            FROM tasks 
            WHERE status = 'done' 
            AND completed_at >= datetime('now', '-7 days')
            ORDER BY completed_at DESC
        """).fetchall()
        
        # Blocages persistants
        persistent_blocks = conn.execute("""
            SELECT title, blocked_reason, updated_at
            FROM tasks 
            WHERE status = 'blocked' 
            AND updated_at <= datetime('now', '-2 days')
        """).fetchall()
        
        # Standby trop long
        long_standby = conn.execute("""
            SELECT title, standby_at
            FROM tasks 
            WHERE status = 'standby' 
            AND standby_at <= datetime('now', '-3 days')
        """).fetchall()
        
        summary = "📊 **WEEKLY SUMMARY**\n\n"
        summary += f"📈 **Stats:** {stats['completed_count']} terminées, {stats['in_progress_count']} en cours, {stats['blocked_count']} bloquées, {stats['standby_count']} en standby\n\n"
        
        if completed_week:
            summary += "✅ **Accompli cette semaine:**\n"
            for task in completed_week[:5]:  # Top 5
                summary += f"- {task['title']}\n"
            summary += "\n"
        
        if persistent_blocks:
            summary += "⚠️ **Blocages persistants (>2j):**\n"
            for task in persistent_blocks:
                summary += f"- {task['title']}: {task['blocked_reason']}\n"
            summary += "\n"
        
        if long_standby:
            summary += "⏸️ **Standby trop long (>3j):**\n"
            for task in long_standby:
                summary += f"- {task['title']}\n"
            summary += "\n"
        
        summary += "🎯 **Focus semaine prochaine:** [À définir]\n"
        summary += "📞 **Points pour le responsable:** [À compléter]"
        
        return {"summary": summary}

@app.get("/workflows")
async def get_workflows(user_id: int = Depends(get_current_user)):
    with get_db() as conn:
        workflows = conn.execute("""
            SELECT * FROM workflows 
            ORDER BY category, name
        """).fetchall()
        
        return [dict(workflow) for workflow in workflows]

@app.get("/remind-new-ticket")
async def remind_new_ticket(user_id: int = Depends(get_current_user)):
    """Endpoint pour rappel de prise de nouveau ticket"""
    with get_db() as conn:
        # Vérifier s'il y a des tâches actives
        active_count = conn.execute("""
            SELECT COUNT(*) as count FROM tasks 
            WHERE status = 'in_progress'
        """).fetchone()['count']
        
        if active_count == 0:
            # Récupérer le workflow de rappel
            reminder_workflow = conn.execute("""
                SELECT steps FROM workflows 
                WHERE category = 'reminder' 
                LIMIT 1
            """).fetchone()
            
            message = reminder_workflow['steps'] if reminder_workflow else "Prendre un nouveau ticket Trello !"
            
            return {
                "needs_ticket": True,
                "message": message
            }
        
        return {"needs_ticket": False}

@app.post("/send-reminder-email")
async def send_reminder_email(user_id: int = Depends(get_current_user)):
    """Envoyer un email de rappel si aucune tâche active"""
    with get_db() as conn:
        # Récupérer user email
        user = conn.execute(
            "SELECT email FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Vérifier s'il y a des tâches actives
        active_count = conn.execute("""
            SELECT COUNT(*) as count FROM tasks 
            WHERE status = 'in_progress'
        """).fetchone()['count']
        
        if active_count == 0:
            subject = "Rappel - Aucune tâche active"
            body = """
🎯 TASKFLOW ADHD - RAPPEL AUTOMATIQUE

Tu n'as aucune tâche active !

Actions à faire :
1. Aller sur Trello → Colonne "Tests-Auto"
2. Prendre un ticket de test automatisé
3. OU Aller sur "MEP Tech" → Prendre nouvelle feature
4. OU Contacter collègue sur tâche partagée pour aider
5. OU Reprendre tâche en standby si déblocage possible

⚠️ Ne JAMAIS rester sans tâche active !

Accès à TaskFlow : http://localhost:3003
            """
            
            send_email(user['email'], subject, body)
            
            return {"sent": True, "message": "Email de rappel envoyé"}
        
        return {"sent": False, "message": "Tâches actives trouvées, pas d'email nécessaire"}


# Initialize on startup
@app.on_event("startup")
async def startup():
    init_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
