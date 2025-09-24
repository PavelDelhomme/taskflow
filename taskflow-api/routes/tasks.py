from fastapi import APIRouter, HTTPException, Depends
from models import Task, TaskUpdate
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("")
async def get_tasks(user_id: int = Depends(get_current_user)):
    with get_db() as conn:
        # Base commune pour tous les utilisateurs @delhomme.ovh
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

@router.post("")
async def create_task(task: Task, user_id: int = Depends(get_current_user)):
    with get_db() as conn:
        cursor = conn.execute("""
            INSERT INTO tasks (user_id, title, description, priority, trello_id)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, task.title, task.description, task.priority, task.trello_id))
        
        task_id = cursor.lastrowid
        
        # Log creation
        trello_info = f" (Trello: {task.trello_id})" if task.trello_id else ""
        conn.execute("""
            INSERT INTO task_logs (task_id, action, details)
            VALUES (?, 'created', ?)
        """, (task_id, f"Task created: {task.title}{trello_info}"))
        
        conn.commit()
        
        return {"id": task_id, "message": "Task created"}

@router.put("/{task_id}")
async def update_task(task_id: int, task_update: TaskUpdate, user_id: int = Depends(get_current_user)):
    with get_db() as conn:
        # Vérifier que la tâche existe
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
            
        if task_update.trello_id is not None:
            update_fields.append("trello_id = ?")
            values.append(task_update.trello_id)
        
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
            if task_update.trello_id:
                details += f" | Trello: {task_update.trello_id}"
                
            conn.execute("""
                INSERT INTO task_logs (task_id, action, details)
                VALUES (?, ?, ?)
            """, (task_id, action, details))
            
            conn.commit()
        
        return {"message": "Task updated"}

@router.delete("/{task_id}")
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
