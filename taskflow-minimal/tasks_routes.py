# 📋 TaskFlow ADHD - Routes des Tâches COMPLÈTES
# Basé sur tasks.py + fonctionnalités ADHD + intégration Trello

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import json

from database import get_db
from auth_routes import get_current_user

# Router
router = APIRouter(prefix="/tasks", tags=["📋 Tasks Management"])

# Models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # low, medium, high, urgent
    trello_id: Optional[str] = None
    estimated_duration: Optional[int] = None  # en minutes

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # todo, in_progress, done, blocked, standby
    priority: Optional[str] = None
    blocked_reason: Optional[str] = None
    trello_id: Optional[str] = None
    estimated_duration: Optional[int] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    trello_id: Optional[str]
    estimated_duration: Optional[int]
    created_at: datetime
    updated_at: datetime
    blocked_reason: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    standby_at: Optional[datetime]
    actual_duration: Optional[int]  # temps réel en minutes

# 📋 ROUTES TASKS

@router.post("/", response_model=TaskResponse)
async def create_task(task_data: TaskCreate, current_user = Depends(get_current_user)):
    """Créer une nouvelle tâche"""
    
    with get_db() as cursor:
        cursor.execute("""
            INSERT INTO tasks (
                user_id, title, description, priority, trello_id,
                estimated_duration
            ) 
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            current_user["user_id"],
            task_data.title,
            task_data.description,
            task_data.priority,
            task_data.trello_id,
            task_data.estimated_duration
        ))
        
        new_task = cursor.fetchone()
        
        # Log création
        cursor.execute("""
            INSERT INTO task_logs (task_id, action, details) 
            VALUES (%s, %s, %s)
        """, (new_task["id"], "created", f"Task created: {task_data.title}"))
        
        return new_task

@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    limit: int = Query(50, le=100, description="Max tasks to return"),
    include_completed: bool = Query(False, description="Include completed tasks"),
    current_user = Depends(get_current_user)
):
    """Récupérer toutes les tâches de l'utilisateur avec filtres ADHD-friendly"""
    
    with get_db() as cursor:
        # Base query
        query = "SELECT * FROM tasks WHERE user_id = %s"
        params = [current_user["user_id"]]
        
        # Filtres
        if status:
            query += " AND status = %s"
            params.append(status)
            
        if priority:
            query += " AND priority = %s"
            params.append(priority)
            
        if not include_completed:
            query += " AND status != 'done'"
            
        # Tri intelligent ADHD : priorité + urgence + date
        query += """ 
            ORDER BY 
                CASE priority 
                    WHEN 'urgent' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    WHEN 'low' THEN 4 
                END,
                CASE status 
                    WHEN 'blocked' THEN 1
                    WHEN 'in_progress' THEN 2 
                    WHEN 'todo' THEN 3 
                    WHEN 'standby' THEN 4
                    WHEN 'done' THEN 5
                END,
                created_at DESC 
            LIMIT %s
        """
        params.append(limit)
        
        cursor.execute(query, params)
        tasks = cursor.fetchall()
        
        return tasks

@router.get("/focus", response_model=List[TaskResponse])
async def get_focus_tasks(current_user = Depends(get_current_user)):
    """Récupérer les tâches FOCUS pour ADHD (max 3 tâches prioritaires)"""
    
    with get_db() as cursor:
        cursor.execute("""
            SELECT * FROM tasks 
            WHERE user_id = %s 
            AND status IN ('todo', 'in_progress')
            ORDER BY 
                CASE priority 
                    WHEN 'urgent' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    WHEN 'low' THEN 4 
                END,
                CASE status 
                    WHEN 'in_progress' THEN 1 
                    WHEN 'todo' THEN 2 
                END,
                created_at ASC
            LIMIT 3
        """, (current_user["user_id"],))
        
        focus_tasks = cursor.fetchall()
        return focus_tasks

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, current_user = Depends(get_current_user)):
    """Récupérer une tâche spécifique"""
    
    with get_db() as cursor:
        cursor.execute(
            "SELECT * FROM tasks WHERE id = %s AND user_id = %s",
            (task_id, current_user["user_id"])
        )
        task = cursor.fetchone()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
            
        return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task_data: TaskUpdate, current_user = Depends(get_current_user)):
    """Mettre à jour une tâche avec gestion intelligente des timestamps"""
    
    with get_db() as cursor:
        # Vérifier que la tâche existe
        cursor.execute(
            "SELECT * FROM tasks WHERE id = %s AND user_id = %s",
            (task_id, current_user["user_id"])
        )
        existing_task = cursor.fetchone()
        
        if not existing_task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Construire requête UPDATE dynamique
        update_fields = []
        params = []
        
        if task_data.title is not None:
            update_fields.append("title = %s")
            params.append(task_data.title)
            
        if task_data.description is not None:
            update_fields.append("description = %s")
            params.append(task_data.description)
            
        if task_data.status is not None:
            update_fields.append("status = %s")
            params.append(task_data.status)
            
            # Auto-timestamps selon status + calcul durée réelle
            if task_data.status == "in_progress" and existing_task["status"] != "in_progress":
                update_fields.append("started_at = CURRENT_TIMESTAMP")
            elif task_data.status == "done" and existing_task["status"] != "done":
                update_fields.append("completed_at = CURRENT_TIMESTAMP")
                # Calculer durée réelle
                if existing_task["started_at"]:
                    cursor.execute(
                        "SELECT EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - %s))/60 as duration",
                        (existing_task["started_at"],)
                    )
                    duration_result = cursor.fetchone()
                    if duration_result:
                        actual_duration = int(duration_result["duration"])
                        update_fields.append("actual_duration = %s")
                        params.append(actual_duration)
            elif task_data.status == "standby":
                update_fields.append("standby_at = CURRENT_TIMESTAMP")
                
        if task_data.priority is not None:
            update_fields.append("priority = %s")
            params.append(task_data.priority)
            
        if task_data.blocked_reason is not None:
            update_fields.append("blocked_reason = %s")
            params.append(task_data.blocked_reason)
            
        if task_data.trello_id is not None:
            update_fields.append("trello_id = %s")
            params.append(task_data.trello_id)
            
        if task_data.estimated_duration is not None:
            update_fields.append("estimated_duration = %s")
            params.append(task_data.estimated_duration)
        
        # Toujours mettre à jour updated_at
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Exécuter UPDATE
        query = f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = %s AND user_id = %s RETURNING *"
        params.extend([task_id, current_user["user_id"]])
        
        cursor.execute(query, params)
        updated_task = cursor.fetchone()
        
        # Log changement
        changes = [f"{field}={value}" for field, value in task_data.dict(exclude_unset=True).items()]
        cursor.execute("""
            INSERT INTO task_logs (task_id, action, details) 
            VALUES (%s, %s, %s)
        """, (task_id, "updated", f"Updated: {', '.join(changes)}"))
        
        return updated_task

@router.patch("/{task_id}/status")
async def quick_status_update(
    task_id: int, 
    status: str = Query(..., regex="^(todo|in_progress|done|blocked|standby)$"),
    blocked_reason: Optional[str] = Query(None),
    current_user = Depends(get_current_user)
):
    """Mise à jour rapide du statut (pour UI mobile/rapide)"""
    
    task_update = TaskUpdate(status=status)
    if blocked_reason and status == "blocked":
        task_update.blocked_reason = blocked_reason
        
    return await update_task(task_id, task_update, current_user)

@router.delete("/{task_id}")
async def delete_task(task_id: int, current_user = Depends(get_current_user)):
    """Supprimer une tâche"""
    
    with get_db() as cursor:
        # Vérifier que la tâche existe
        cursor.execute(
            "SELECT title FROM tasks WHERE id = %s AND user_id = %s",
            (task_id, current_user["user_id"])
        )
        task = cursor.fetchone()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Supprimer (cascade supprime les logs)
        cursor.execute(
            "DELETE FROM tasks WHERE id = %s AND user_id = %s",
            (task_id, current_user["user_id"])
        )
        
        return {"message": f"Task '{task['title']}' deleted successfully"}

@router.get("/{task_id}/logs")
async def get_task_logs(task_id: int, current_user = Depends(get_current_user)):
    """Récupérer l'historique d'une tâche"""
    
    with get_db() as cursor:
        # Vérifier que la tâche appartient à l'utilisateur
        cursor.execute(
            "SELECT id FROM tasks WHERE id = %s AND user_id = %s",
            (task_id, current_user["user_id"])
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Récupérer logs
        cursor.execute(
            "SELECT * FROM task_logs WHERE task_id = %s ORDER BY timestamp DESC",
            (task_id,)
        )
        logs = cursor.fetchall()
        
        return logs

@router.get("/stats/summary")
async def get_tasks_stats(current_user = Depends(get_current_user)):
    """Statistiques des tâches avec métriques ADHD-friendly"""
    
    with get_db() as cursor:
        # Stats générales
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
                COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked,
                COUNT(CASE WHEN status = 'standby' THEN 1 END) as standby,
                COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_priority,
                COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
                COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
                COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority
            FROM tasks 
            WHERE user_id = %s
        """, (current_user["user_id"],))
        
        stats = cursor.fetchone()
        
        # Tâches overdue (pas mises à jour depuis 3+ jours)
        cursor.execute("""
            SELECT COUNT(*) as overdue_count
            FROM tasks 
            WHERE user_id = %s 
            AND status IN ('todo', 'in_progress')
            AND updated_at < NOW() - INTERVAL '3 days'
        """, (current_user["user_id"],))
        
        overdue = cursor.fetchone()
        
        # Performance cette semaine
        cursor.execute("""
            SELECT 
                COUNT(*) as completed_this_week,
                AVG(actual_duration) as avg_duration,
                AVG(CASE WHEN estimated_duration IS NOT NULL AND actual_duration IS NOT NULL 
                    THEN (actual_duration::float / estimated_duration) * 100 
                    ELSE NULL END) as time_estimation_accuracy
            FROM tasks 
            WHERE user_id = %s 
            AND status = 'done'
            AND completed_at >= NOW() - INTERVAL '7 days'
        """, (current_user["user_id"],))
        
        performance = cursor.fetchone()
        
        return {
            **dict(stats),
            "overdue_tasks": overdue["overdue_count"],
            "completed_this_week": performance["completed_this_week"] or 0,
            "avg_task_duration": performance["avg_duration"],
            "time_estimation_accuracy": performance["time_estimation_accuracy"]
        }

@router.get("/adhd/dashboard")
async def get_adhd_dashboard(current_user = Depends(get_current_user)):
    """Dashboard spécialisé ADHD avec recommandations"""
    
    with get_db() as cursor:
        # Tâche courante (in_progress)
        cursor.execute("""
            SELECT * FROM tasks 
            WHERE user_id = %s AND status = 'in_progress'
            ORDER BY started_at DESC LIMIT 1
        """, (current_user["user_id"],))
        current_task = cursor.fetchone()
        
        # Prochaines tâches focus (3 max)
        cursor.execute("""
            SELECT * FROM tasks 
            WHERE user_id = %s AND status = 'todo'
            ORDER BY 
                CASE priority 
                    WHEN 'urgent' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    WHEN 'low' THEN 4 
                END,
                created_at ASC
            LIMIT 3
        """, (current_user["user_id"],))
        next_tasks = cursor.fetchall()
        
        # Tâches bloquées
        cursor.execute("""
            SELECT * FROM tasks 
            WHERE user_id = %s AND status = 'blocked'
            ORDER BY updated_at DESC
        """, (current_user["user_id"],))
        blocked_tasks = cursor.fetchall()
        
        # Recommandations ADHD
        recommendations = []
        
        if len(next_tasks) == 0:
            recommendations.append("🎯 Créer quelques tâches pour rester organisé")
        elif len(next_tasks) > 10:
            recommendations.append("📝 Trop de tâches! Prioriser les 3 plus importantes")
            
        if current_task and current_task.get("started_at"):
            started = current_task["started_at"]
            duration = (datetime.now() - started).total_seconds() / 60
            if duration > 90:  # Plus de 1h30
                recommendations.append("⏰ Pause recommandée! Tâche en cours depuis plus d'1h30")
        
        if len(blocked_tasks) > 0:
            recommendations.append(f"🚫 {len(blocked_tasks)} tâche(s) bloquée(s) à débloquer")
        
        return {
            "current_task": current_task,
            "next_tasks": next_tasks,
            "blocked_tasks": blocked_tasks,
            "recommendations": recommendations,
            "focus_score": min(100, max(0, 100 - len(next_tasks) * 5 - len(blocked_tasks) * 10))
        }