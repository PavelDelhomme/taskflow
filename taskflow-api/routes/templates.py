"""
Routes pour les templates de tâches
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime
from database import get_db_connection
from routes.auth import get_current_user

router = APIRouter(prefix="/templates", tags=["templates"])

@router.get("/")
async def get_templates(current_user: dict = Depends(get_current_user)):
    """Récupère tous les templates de l'utilisateur et les templates publics"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT id, user_id, name, title, description, priority, 
                   estimated_time_minutes, workflow_id, tags, is_public, created_at
            FROM task_templates
            WHERE user_id = %s OR is_public = true
            ORDER BY created_at DESC
        """, [current_user["user_id"]])
        
        rows = cur.fetchall()
        templates = []
        for row in rows:
            templates.append({
                "id": row[0],
                "user_id": row[1],
                "name": row[2],
                "title": row[3],
                "description": row[4],
                "priority": row[5],
                "estimated_time_minutes": row[6],
                "workflow_id": row[7],
                "tags": row[8] if row[8] else [],
                "is_public": row[9],
                "created_at": row[10].isoformat() if row[10] else None
            })
        
        return templates
    finally:
        cur.close()
        conn.close()

@router.post("/")
async def create_template(
    name: str,
    title: str,
    description: Optional[str] = None,
    priority: str = "medium",
    estimated_time_minutes: Optional[int] = None,
    workflow_id: Optional[int] = None,
    tags: Optional[List[str]] = None,
    is_public: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Crée un nouveau template"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            INSERT INTO task_templates 
            (user_id, name, title, description, priority, estimated_time_minutes, workflow_id, tags, is_public)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, [
            current_user["user_id"], name, title, description, priority,
            estimated_time_minutes, workflow_id, tags or [], is_public
        ])
        
        template_id = cur.fetchone()[0]
        conn.commit()
        
        return {"id": template_id, "message": "Template créé avec succès"}
    finally:
        cur.close()
        conn.close()

@router.post("/{template_id}/create-task")
async def create_task_from_template(
    template_id: int,
    project: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Crée une tâche à partir d'un template"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Récupérer le template
        cur.execute("""
            SELECT name, title, description, priority, estimated_time_minutes, workflow_id, tags
            FROM task_templates
            WHERE id = %s AND (user_id = %s OR is_public = true)
        """, [template_id, current_user["user_id"]])
        
        template = cur.fetchone()
        if not template:
            raise HTTPException(status_code=404, detail="Template non trouvé")
        
        # Créer la tâche
        cur.execute("""
            INSERT INTO tasks (user_id, title, description, priority, estimated_time_minutes, project)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, [
            current_user["user_id"], template[1], template[2], template[3],
            template[4], project
        ])
        
        task_id = cur.fetchone()[0]
        
        # Si le template a des tags, les ajouter (nécessite d'abord créer les tags)
        if template[6]:
            for tag_name in template[6]:
                # Vérifier si le tag existe
                cur.execute("""
                    SELECT id FROM tags WHERE user_id = %s AND name = %s
                """, [current_user["user_id"], tag_name])
                tag_row = cur.fetchone()
                
                if tag_row:
                    tag_id = tag_row[0]
                else:
                    # Créer le tag
                    cur.execute("""
                        INSERT INTO tags (user_id, name) VALUES (%s, %s) RETURNING id
                    """, [current_user["user_id"], tag_name])
                    tag_id = cur.fetchone()[0]
                
                # Lier le tag à la tâche
                cur.execute("""
                    INSERT INTO task_tags (task_id, tag_id) VALUES (%s, %s)
                    ON CONFLICT DO NOTHING
                """, [task_id, tag_id])
        
        conn.commit()
        
        return {"task_id": task_id, "message": "Tâche créée depuis le template"}
    finally:
        cur.close()
        conn.close()

@router.delete("/{template_id}")
async def delete_template(
    template_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Supprime un template"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            DELETE FROM task_templates
            WHERE id = %s AND user_id = %s
        """, [template_id, current_user["user_id"]])
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Template non trouvé")
        
        conn.commit()
        return {"message": "Template supprimé"}
    finally:
        cur.close()
        conn.close()

