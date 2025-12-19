"""
Routes pour les tags et filtres avancés
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from database import get_db_connection
from routes.auth import get_current_user

router = APIRouter(prefix="/tags", tags=["tags"])

class TagCreate(BaseModel):
    name: str
    color: Optional[str] = "#6B7280"

class TagResponse(BaseModel):
    id: int
    user_id: int
    name: str
    color: str
    created_at: str

@router.get("/", response_model=List[TagResponse])
async def get_tags(current_user: dict = Depends(get_current_user)):
    """Récupère tous les tags de l'utilisateur"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT id, user_id, name, color, created_at
            FROM tags
            WHERE user_id = %s
            ORDER BY name ASC
        """, [current_user["user_id"]])
        
        rows = cur.fetchall()
        tags = []
        for row in rows:
            tags.append({
                "id": row[0],
                "user_id": row[1],
                "name": row[2],
                "color": row[3],
                "created_at": row[4].isoformat() if row[4] else None
            })
        
        return tags
    finally:
        cur.close()
        conn.close()

@router.post("/", response_model=TagResponse)
async def create_tag(tag_data: TagCreate, current_user: dict = Depends(get_current_user)):
    """Crée un nouveau tag"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            INSERT INTO tags (user_id, name, color)
            VALUES (%s, %s, %s)
            RETURNING id, user_id, name, color, created_at
        """, [current_user["user_id"], tag_data.name, tag_data.color])
        
        row = cur.fetchone()
        conn.commit()
        
        return {
            "id": row[0],
            "user_id": row[1],
            "name": row[2],
            "color": row[3],
            "created_at": row[4].isoformat() if row[4] else None
        }
    except Exception as e:
        if "unique constraint" in str(e).lower():
            raise HTTPException(status_code=400, detail="Ce tag existe déjà")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.post("/{tag_id}/assign/{task_id}")
async def assign_tag_to_task(
    tag_id: int,
    task_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Assigne un tag à une tâche"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Vérifier que le tag et la tâche appartiennent à l'utilisateur
        cur.execute("SELECT user_id FROM tags WHERE id = %s", [tag_id])
        tag = cur.fetchone()
        if not tag or tag[0] != current_user["user_id"]:
            raise HTTPException(status_code=404, detail="Tag non trouvé")
        
        cur.execute("SELECT user_id FROM tasks WHERE id = %s", [task_id])
        task = cur.fetchone()
        if not task or task[0] != current_user["user_id"]:
            raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
        cur.execute("""
            INSERT INTO task_tags (task_id, tag_id)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
        """, [task_id, tag_id])
        
        conn.commit()
        return {"message": "Tag assigné avec succès"}
    finally:
        cur.close()
        conn.close()

@router.delete("/{tag_id}/unassign/{task_id}")
async def unassign_tag_from_task(
    tag_id: int,
    task_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Retire un tag d'une tâche"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            DELETE FROM task_tags
            WHERE task_id = %s AND tag_id = %s
        """, [task_id, tag_id])
        
        conn.commit()
        return {"message": "Tag retiré avec succès"}
    finally:
        cur.close()
        conn.close()

@router.get("/task/{task_id}")
async def get_task_tags(task_id: int, current_user: dict = Depends(get_current_user)):
    """Récupère tous les tags d'une tâche"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Vérifier que la tâche appartient à l'utilisateur
        cur.execute("SELECT user_id FROM tasks WHERE id = %s", [task_id])
        task = cur.fetchone()
        if not task or task[0] != current_user["user_id"]:
            raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
        cur.execute("""
            SELECT t.id, t.name, t.color
            FROM tags t
            JOIN task_tags tt ON t.id = tt.tag_id
            WHERE tt.task_id = %s
            ORDER BY t.name ASC
        """, [task_id])
        
        rows = cur.fetchall()
        tags = []
        for row in rows:
            tags.append({
                "id": row[0],
                "name": row[1],
                "color": row[2]
            })
        
        return tags
    finally:
        cur.close()
        conn.close()

@router.delete("/{tag_id}")
async def delete_tag(tag_id: int, current_user: dict = Depends(get_current_user)):
    """Supprime un tag"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            DELETE FROM tags
            WHERE id = %s AND user_id = %s
        """, [tag_id, current_user["user_id"]])
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Tag non trouvé")
        
        conn.commit()
        return {"message": "Tag supprimé"}
    finally:
        cur.close()
        conn.close()

@router.get("/filter/tasks")
async def filter_tasks_by_tags(
    tag_ids: Optional[List[int]] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    project: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Filtre les tâches par tags et autres critères"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        query = """
            SELECT DISTINCT t.*
            FROM tasks t
            WHERE t.user_id = %s AND t.deleted_at IS NULL
        """
        params = [current_user["user_id"]]
        
        if tag_ids:
            query += """
                AND t.id IN (
                    SELECT task_id FROM task_tags WHERE tag_id = ANY(%s)
                )
            """
            params.append(tag_ids)
        
        if status:
            query += " AND t.status = %s"
            params.append(status)
        
        if priority:
            query += " AND t.priority = %s"
            params.append(priority)
        
        if project:
            query += " AND t.project = %s"
            params.append(project)
        
        query += " ORDER BY t.created_at DESC"
        
        cur.execute(query, params)
        rows = cur.fetchall()
        
        tasks = []
        for row in rows:
            tasks.append(dict(row))
        
        return tasks
    finally:
        cur.close()
        conn.close()

