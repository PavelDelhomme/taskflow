from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database import get_db
from auth import get_current_user

# Router
router = APIRouter(prefix="/tasks", tags=["Tasks"])

# Models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # low, medium, high
    trello_id: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # todo, in_progress, done, blocked, standby
    priority: Optional[str] = None
    blocked_reason: Optional[str] = None
    trello_id: Optional[str] = None

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

# 📋 ROUTES TASKS

@router.post("/", response_model=TaskResponse)
async def create_task(task_data: TaskCreate, current_user = Depends(get_current_user)):
    """Créer une nouvelle tâche"""
    
    with get_db() as cursor:
        cursor.execute("""
            INSERT INTO tasks (user_id, title, description, priority, trello_id) 
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
        """, (
            current_user["user_id"],
            task_data.title,
            task_data.description,
            task_data.priority,
            task_data.trello_id
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
        params = [current_user["user_id"]]
        
        # Filtres optionnels
        if status:
            query += " AND status = %s"
            params.append(status)
            
        if priority:
            query += " AND priority = %s"
            params.append(priority)
            
        query += " ORDER BY created_at DESC LIMIT %s"
        params.append(limit)
        
        cursor.execute(query, params)
        tasks = cursor.fetchall()
        
        return tasks

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
    """Mettre à jour une tâche"""
    
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
            
            # Auto-timestamps selon status
            if task_data.status == "in_progress":
                update_fields.append("started_at = CURRENT_TIMESTAMP")
            elif task_data.status == "done":
                update_fields.append("completed_at = CURRENT_TIMESTAMP")
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
    """Statistiques des tâches"""
    
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
                COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority
            FROM tasks 
            WHERE user_id = %s
        """, (current_user["user_id"],))
        
        stats = cursor.fetchone()
        return stats