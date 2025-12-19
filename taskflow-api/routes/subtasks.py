"""
Routes pour les sous-tâches (breakdown automatique)
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from database import get_db_connection
from routes.auth import get_current_user

router = APIRouter(prefix="/subtasks", tags=["subtasks"])

@router.get("/task/{task_id}")
async def get_subtasks(task_id: int, current_user: dict = Depends(get_current_user)):
    """Récupère toutes les sous-tâches d'une tâche"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Vérifier que la tâche appartient à l'utilisateur
        cur.execute("SELECT user_id FROM tasks WHERE id = %s", [task_id])
        task = cur.fetchone()
        if not task or task[0] != current_user["user_id"]:
            raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
        cur.execute("""
            SELECT id, parent_task_id, title, description, status, priority, 
                   created_at, completed_at, order_index
            FROM subtasks
            WHERE parent_task_id = %s
            ORDER BY order_index ASC, created_at ASC
        """, [task_id])
        
        rows = cur.fetchall()
        subtasks = []
        for row in rows:
            subtasks.append({
                "id": row[0],
                "parent_task_id": row[1],
                "title": row[2],
                "description": row[3],
                "status": row[4],
                "priority": row[5],
                "created_at": row[6].isoformat() if row[6] else None,
                "completed_at": row[7].isoformat() if row[7] else None,
                "order_index": row[8]
            })
        
        return subtasks
    finally:
        cur.close()
        conn.close()

@router.post("/")
async def create_subtask(
    parent_task_id: int,
    title: str,
    description: Optional[str] = None,
    priority: str = "medium",
    order_index: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Crée une sous-tâche"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Vérifier que la tâche parente appartient à l'utilisateur
        cur.execute("SELECT user_id FROM tasks WHERE id = %s", [parent_task_id])
        task = cur.fetchone()
        if not task or task[0] != current_user["user_id"]:
            raise HTTPException(status_code=404, detail="Tâche parente non trouvée")
        
        cur.execute("""
            INSERT INTO subtasks (parent_task_id, title, description, priority, order_index)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, [parent_task_id, title, description, priority, order_index])
        
        row = cur.fetchone()
        subtask_id = row[0]
        created_at = row[1]
        
        conn.commit()
        
        return {
            "id": subtask_id,
            "parent_task_id": parent_task_id,
            "title": title,
            "description": description,
            "priority": priority,
            "status": "todo",
            "order_index": order_index,
            "created_at": created_at.isoformat() if created_at else None
        }
    finally:
        cur.close()
        conn.close()

@router.post("/auto-breakdown/{task_id}")
async def auto_breakdown_task(
    task_id: int,
    steps: List[str],
    current_user: dict = Depends(get_current_user)
):
    """Décompose automatiquement une tâche en sous-tâches"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Vérifier que la tâche appartient à l'utilisateur
        cur.execute("SELECT user_id, title FROM tasks WHERE id = %s", [task_id])
        task = cur.fetchone()
        if not task or task[0] != current_user["user_id"]:
            raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
        created_subtasks = []
        for index, step in enumerate(steps):
            if step.strip():  # Ignorer les étapes vides
                cur.execute("""
                    INSERT INTO subtasks (parent_task_id, title, priority, order_index)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, created_at
                """, [task_id, step.strip(), "medium", index])
                
                row = cur.fetchone()
                created_subtasks.append({
                    "id": row[0],
                    "parent_task_id": task_id,
                    "title": step.strip(),
                    "status": "todo",
                    "priority": "medium",
                    "order_index": index,
                    "created_at": row[1].isoformat() if row[1] else None
                })
        
        conn.commit()
        
        return {
            "parent_task_id": task_id,
            "subtasks": created_subtasks,
            "count": len(created_subtasks)
        }
    finally:
        cur.close()
        conn.close()

@router.put("/{subtask_id}")
async def update_subtask(
    subtask_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    order_index: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Met à jour une sous-tâche"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Vérifier que la sous-tâche appartient à l'utilisateur
        cur.execute("""
            SELECT s.id, s.parent_task_id, t.user_id
            FROM subtasks s
            JOIN tasks t ON s.parent_task_id = t.id
            WHERE s.id = %s
        """, [subtask_id])
        
        subtask = cur.fetchone()
        if not subtask or subtask[2] != current_user["user_id"]:
            raise HTTPException(status_code=404, detail="Sous-tâche non trouvée")
        
        # Construire la requête de mise à jour dynamiquement
        updates = []
        params = []
        
        if title is not None:
            updates.append("title = %s")
            params.append(title)
        if description is not None:
            updates.append("description = %s")
            params.append(description)
        if status is not None:
            updates.append("status = %s")
            params.append(status)
            if status == "done":
                updates.append("completed_at = NOW()")
            elif status != "done":
                updates.append("completed_at = NULL")
        if priority is not None:
            updates.append("priority = %s")
            params.append(priority)
        if order_index is not None:
            updates.append("order_index = %s")
            params.append(order_index)
        
        if not updates:
            raise HTTPException(status_code=400, detail="Aucune mise à jour fournie")
        
        params.append(subtask_id)
        cur.execute(f"""
            UPDATE subtasks
            SET {', '.join(updates)}
            WHERE id = %s
            RETURNING id, parent_task_id, title, description, status, priority, 
                      created_at, completed_at, order_index
        """, params)
        
        row = cur.fetchone()
        conn.commit()
        
        return {
            "id": row[0],
            "parent_task_id": row[1],
            "title": row[2],
            "description": row[3],
            "status": row[4],
            "priority": row[5],
            "created_at": row[6].isoformat() if row[6] else None,
            "completed_at": row[7].isoformat() if row[7] else None,
            "order_index": row[8]
        }
    finally:
        cur.close()
        conn.close()

@router.delete("/{subtask_id}")
async def delete_subtask(
    subtask_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Supprime une sous-tâche"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Vérifier que la sous-tâche appartient à l'utilisateur
        cur.execute("""
            SELECT s.id, t.user_id
            FROM subtasks s
            JOIN tasks t ON s.parent_task_id = t.id
            WHERE s.id = %s
        """, [subtask_id])
        
        subtask = cur.fetchone()
        if not subtask or subtask[1] != current_user["user_id"]:
            raise HTTPException(status_code=404, detail="Sous-tâche non trouvée")
        
        cur.execute("DELETE FROM subtasks WHERE id = %s", [subtask_id])
        conn.commit()
        
        return {"message": "Sous-tâche supprimée"}
    finally:
        cur.close()
        conn.close()

