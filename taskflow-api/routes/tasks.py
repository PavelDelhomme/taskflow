from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database import get_db
from routes.auth import get_current_user

# Router
router = APIRouter(prefix="/tasks", tags=["Tasks"])

# Models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # low, medium, high
    trello_id: Optional[str] = None
    due_date: Optional[datetime] = None
    project: Optional[str] = None
    estimated_time_minutes: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # todo, in_progress, done, blocked, standby
    priority: Optional[str] = None
    blocked_reason: Optional[str] = None
    trello_id: Optional[str] = None
    due_date: Optional[datetime] = None
    project: Optional[str] = None
    estimated_time_minutes: Optional[int] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    trello_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    blocked_reason: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    standby_at: Optional[datetime]
    due_date: Optional[datetime]
    time_spent_seconds: Optional[int] = 0
    time_in_progress_seconds: Optional[int] = 0
    project: Optional[str] = None
    estimated_time_minutes: Optional[int] = None

# 📋 ROUTES TASKS

@router.post("/", response_model=TaskResponse)
async def create_task(task_data: TaskCreate, current_user = Depends(get_current_user)):
    """Créer une nouvelle tâche"""
    
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        cursor.execute("""
            INSERT INTO tasks (user_id, title, description, priority, trello_id, due_date, project, estimated_time_minutes) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            user_id,
            task_data.title,
            task_data.description,
            task_data.priority,
            task_data.trello_id,
            task_data.due_date,
            task_data.project,
            task_data.estimated_time_minutes
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
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 50,
    current_user = Depends(get_current_user)
):
    """Récupérer toutes les tâches de l'utilisateur"""
    
    with get_db() as cursor:
        # Base query
        query = "SELECT * FROM tasks WHERE user_id = %s"
        user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
        params = [user_id]
        
        # Exclure les tâches supprimées par défaut
        query += " AND deleted_at IS NULL"
        
        # Filtres optionnels
        if status:
            query += " AND status = %s"
            params.append(status)
            
        if priority:
            query += " AND priority = %s"
            params.append(priority)
            
        # Tri par due_date (tâches avec date à faire en premier, puis par date croissante)
        # Puis par priorité, puis par date de création
        query += """ ORDER BY 
            CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
            due_date ASC NULLS LAST,
            CASE priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
                ELSE 5 
            END,
            created_at DESC 
            LIMIT %s"""
        params.append(limit)
        
        cursor.execute(query, params)
        tasks = cursor.fetchall()
        
        return tasks

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, current_user = Depends(get_current_user)):
    """Récupérer une tâche spécifique"""
    
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        cursor.execute(
            "SELECT * FROM tasks WHERE id = %s AND user_id = %s",
            (task_id, user_id)
        )
        task = cursor.fetchone()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
            
        return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task_data: TaskUpdate, current_user = Depends(get_current_user)):
    """Mettre à jour une tâche"""
    
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        # Vérifier que la tâche existe
        cursor.execute(
            "SELECT * FROM tasks WHERE id = %s AND user_id = %s",
            (task_id, user_id)
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
            # Récupérer l'ancien statut pour calculer le temps
            old_status = existing_task.get('status')
            old_started_at = existing_task.get('started_at')
            old_time_in_progress = existing_task.get('time_in_progress_seconds') or 0
            old_time_spent = existing_task.get('time_spent_seconds') or 0
            
            update_fields.append("status = %s")
            params.append(task_data.status)
            
            # Auto-timestamps selon status
            if task_data.status == "in_progress":
                if not old_started_at:
                    update_fields.append("started_at = CURRENT_TIMESTAMP")
                # Si on passe de standby/blocked/todo à in_progress, on démarre le timer
                if old_status in ['standby', 'blocked', 'todo', 'review']:
                    update_fields.append("started_at = CURRENT_TIMESTAMP")
            elif task_data.status == "done":
                update_fields.append("completed_at = CURRENT_TIMESTAMP")
                # Calculer le temps total passé si on était en cours
                if old_status == "in_progress" and old_started_at:
                    # Utiliser EXTRACT pour calculer la différence en secondes
                    update_fields.append("""
                        time_in_progress_seconds = time_in_progress_seconds + 
                        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER
                    """.strip())
                    update_fields.append("""
                        time_spent_seconds = time_spent_seconds + 
                        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER
                    """.strip())
            elif task_data.status == "standby":
                update_fields.append("standby_at = CURRENT_TIMESTAMP")
                # Si on passe de in_progress à standby, on calcule le temps passé
                if old_status == "in_progress" and old_started_at:
                    # Utiliser EXTRACT pour calculer la différence en secondes
                    update_fields.append("""
                        time_in_progress_seconds = time_in_progress_seconds + 
                        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER
                    """.strip())
                    update_fields.append("""
                        time_spent_seconds = time_spent_seconds + 
                        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER
                    """.strip())
                    update_fields.append("started_at = NULL")
                
        if task_data.priority is not None:
            update_fields.append("priority = %s")
            params.append(task_data.priority)
            
        if task_data.blocked_reason is not None:
            update_fields.append("blocked_reason = %s")
            params.append(task_data.blocked_reason)
            
        if task_data.trello_id is not None:
            update_fields.append("trello_id = %s")
            params.append(task_data.trello_id)
            
        if task_data.due_date is not None:
            update_fields.append("due_date = %s")
            params.append(task_data.due_date)
        
        if task_data.project is not None:
            update_fields.append("project = %s")
            params.append(task_data.project)
        
        if task_data.estimated_time_minutes is not None:
            update_fields.append("estimated_time_minutes = %s")
            params.append(task_data.estimated_time_minutes)
        
        # Toujours mettre à jour updated_at
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Exécuter UPDATE
        query = f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = %s AND user_id = %s RETURNING *"
        params.extend([task_id, user_id])
        
        cursor.execute(query, params)
        updated_task = cursor.fetchone()
        
        # Log changement
        changes = [f"{field}={value}" for field, value in task_data.dict(exclude_unset=True).items()]
        cursor.execute("""
            INSERT INTO task_logs (task_id, action, details) 
            VALUES (%s, %s, %s)
        """, (task_id, "updated", f"Updated: {', '.join(changes)}"))
        
        return updated_task

@router.delete("/{task_id}")
async def delete_task(task_id: int, current_user = Depends(get_current_user)):
    """Supprimer une tâche"""
    
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        # Vérifier que la tâche existe
        cursor.execute(
            "SELECT title FROM tasks WHERE id = %s AND user_id = %s",
            (task_id, user_id)
        )
        task = cursor.fetchone()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Soft delete - marquer comme supprimé
        cursor.execute(
            "UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = %s AND user_id = %s",
            (task_id, user_id)
        )
        
        return {"message": f"Task '{task['title']}' deleted successfully"}

@router.post("/{task_id}/restore")
async def restore_task(task_id: int, current_user = Depends(get_current_user)):
    """Restaurer une tâche supprimée"""
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        cursor.execute(
            "UPDATE tasks SET deleted_at = NULL WHERE id = %s AND user_id = %s",
            (task_id, user_id)
        )
        
        return {"message": "Task restored successfully"}

@router.get("/{task_id}/logs")
async def get_task_logs(task_id: int, current_user = Depends(get_current_user)):
    """Récupérer l'historique d'une tâche"""
    
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        # Vérifier que la tâche appartient à l'utilisateur
        cursor.execute(
            "SELECT id FROM tasks WHERE id = %s AND user_id = %s",
            (task_id, user_id)
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

@router.post("/{task_id}/update-time")
async def update_task_time(task_id: int, time_data: dict, current_user = Depends(get_current_user)):
    """Mettre à jour le temps passé sur une tâche (pour time tracking continu)"""
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        # Vérifier que la tâche existe et appartient à l'utilisateur
        cursor.execute(
            "SELECT * FROM tasks WHERE id = %s AND user_id = %s",
            (task_id, user_id)
        )
        existing_task = cursor.fetchone()
        
        if not existing_task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Mettre à jour le temps
        update_fields = []
        params = []
        
        if 'time_in_progress_seconds' in time_data:
            update_fields.append("time_in_progress_seconds = %s")
            params.append(time_data['time_in_progress_seconds'])
        
        if 'time_spent_seconds' in time_data:
            update_fields.append("time_spent_seconds = %s")
            params.append(time_data['time_spent_seconds'])
        
        if update_fields:
            query = f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = %s AND user_id = %s RETURNING *"
            params.extend([task_id, user_id])
            cursor.execute(query, params)
            updated_task = cursor.fetchone()
            return dict(updated_task)
        
        return existing_task

@router.get("/stats/summary")
async def get_tasks_stats(current_user = Depends(get_current_user)):
    """Statistiques des tâches"""
    
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
                COUNT(CASE WHEN status = 'done' THEN 1 END) as done,
                COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked,
                COUNT(CASE WHEN status = 'standby' THEN 1 END) as standby,
                COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
                COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
                COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority,
                SUM(time_spent_seconds) as total_time_spent,
                SUM(time_in_progress_seconds) as total_time_in_progress
            FROM tasks 
            WHERE user_id = %s AND deleted_at IS NULL
        """, (user_id,))
        
        stats = cursor.fetchone()
        return stats

@router.get("/stats/current")
async def get_current_activity(current_user = Depends(get_current_user)):
    """Rapport rapide de l'activité actuelle"""
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        # Tâches en cours avec temps
        cursor.execute("""
            SELECT 
                id, title, status, priority, project,
                started_at, time_in_progress_seconds, time_spent_seconds,
                EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER as current_session_time
            FROM tasks 
            WHERE user_id = %s AND status = 'in_progress' AND deleted_at IS NULL
            ORDER BY started_at DESC
        """, (user_id,))
        in_progress = cursor.fetchall()
        
        # Tâches terminées aujourd'hui
        cursor.execute("""
            SELECT COUNT(*) as count, SUM(time_spent_seconds) as total_time
            FROM tasks 
            WHERE user_id = %s AND status = 'done' 
            AND DATE(completed_at) = CURRENT_DATE
            AND deleted_at IS NULL
        """, (user_id,))
        today_completed = cursor.fetchone()
        
        # Tâches par projet
        cursor.execute("""
            SELECT 
                COALESCE(project, 'Sans projet') as project,
                COUNT(*) as count,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count
            FROM tasks 
            WHERE user_id = %s AND deleted_at IS NULL
            GROUP BY project
            ORDER BY count DESC
        """, (user_id,))
        by_project = cursor.fetchall()
        
        return {
            "in_progress": [dict(task) for task in in_progress],
            "today_completed": dict(today_completed),
            "by_project": [dict(proj) for proj in by_project]
        }