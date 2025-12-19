"""
Routes pour les notes et brain dump
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from database import get_db_connection
from routes.auth import get_current_user

router = APIRouter(prefix="/notes", tags=["notes"])

class NoteCreate(BaseModel):
    content: str
    task_id: Optional[int] = None
    is_brain_dump: bool = False

class NoteResponse(BaseModel):
    id: int
    user_id: int
    content: str
    task_id: Optional[int]
    is_brain_dump: bool
    created_at: str
    updated_at: str

@router.get("/", response_model=List[NoteResponse])
async def get_notes(
    task_id: Optional[int] = None,
    brain_dump_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Récupère toutes les notes de l'utilisateur"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        query = """
            SELECT id, user_id, content, task_id, is_brain_dump, created_at, updated_at
            FROM notes
            WHERE user_id = %s
        """
        params = [current_user["user_id"]]
        
        if task_id:
            query += " AND task_id = %s"
            params.append(task_id)
        
        if brain_dump_only:
            query += " AND is_brain_dump = true"
        
        query += " ORDER BY created_at DESC"
        
        cur.execute(query, params)
        rows = cur.fetchall()
        
        notes = []
        for row in rows:
            notes.append({
                "id": row[0],
                "user_id": row[1],
                "content": row[2],
                "task_id": row[3],
                "is_brain_dump": row[4],
                "created_at": row[5].isoformat() if row[5] else None,
                "updated_at": row[6].isoformat() if row[6] else None
            })
        
        return notes
    finally:
        cur.close()
        conn.close()

@router.post("/", response_model=NoteResponse)
async def create_note(note_data: NoteCreate, current_user: dict = Depends(get_current_user)):
    """Crée une nouvelle note"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Si task_id est fourni, vérifier que la tâche existe
        if note_data.task_id:
            cur.execute("SELECT user_id FROM tasks WHERE id = %s", [note_data.task_id])
            task = cur.fetchone()
            if not task or task[0] != current_user["user_id"]:
                raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
        cur.execute("""
            INSERT INTO notes (user_id, content, task_id, is_brain_dump)
            VALUES (%s, %s, %s, %s)
            RETURNING id, user_id, content, task_id, is_brain_dump, created_at, updated_at
        """, [
            current_user["user_id"],
            note_data.content,
            note_data.task_id,
            note_data.is_brain_dump
        ])
        
        row = cur.fetchone()
        conn.commit()
        
        return {
            "id": row[0],
            "user_id": row[1],
            "content": row[2],
            "task_id": row[3],
            "is_brain_dump": row[4],
            "created_at": row[5].isoformat() if row[5] else None,
            "updated_at": row[6].isoformat() if row[6] else None
        }
    finally:
        cur.close()
        conn.close()

@router.post("/{note_id}/convert-to-tasks")
async def convert_note_to_tasks(
    note_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Convertit une note brain dump en tâches (détecte les lignes commençant par - ou *)"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Récupérer la note
        cur.execute("""
            SELECT content FROM notes
            WHERE id = %s AND user_id = %s AND is_brain_dump = true
        """, [note_id, current_user["user_id"]])
        
        note = cur.fetchone()
        if not note:
            raise HTTPException(status_code=404, detail="Note brain dump non trouvée")
        
        content = note[0]
        lines = content.split('\n')
        
        created_tasks = []
        for line in lines:
            line = line.strip()
            # Détecter les lignes qui ressemblent à des tâches (commencent par -, *, ou numérotées)
            if line and (line.startswith('-') or line.startswith('*') or line[0].isdigit()):
                # Nettoyer la ligne
                task_title = line.lstrip('-* ').lstrip('0123456789. ')
                
                if task_title:
                    cur.execute("""
                        INSERT INTO tasks (user_id, title, description, status, priority)
                        VALUES (%s, %s, %s, 'todo', 'medium')
                        RETURNING id, title
                    """, [current_user["user_id"], task_title, f"Créée depuis brain dump (note #{note_id})"])
                    
                    task_row = cur.fetchone()
                    created_tasks.append({
                        "id": task_row[0],
                        "title": task_row[1]
                    })
        
        conn.commit()
        
        return {
            "note_id": note_id,
            "tasks_created": created_tasks,
            "count": len(created_tasks)
        }
    finally:
        cur.close()
        conn.close()

@router.put("/{note_id}")
async def update_note(
    note_id: int,
    content: str,
    current_user: dict = Depends(get_current_user)
):
    """Met à jour une note"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            UPDATE notes
            SET content = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s
            RETURNING id, user_id, content, task_id, is_brain_dump, created_at, updated_at
        """, [content, note_id, current_user["user_id"]])
        
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Note non trouvée")
        
        conn.commit()
        
        return {
            "id": row[0],
            "user_id": row[1],
            "content": row[2],
            "task_id": row[3],
            "is_brain_dump": row[4],
            "created_at": row[5].isoformat() if row[5] else None,
            "updated_at": row[6].isoformat() if row[6] else None
        }
    finally:
        cur.close()
        conn.close()

@router.delete("/{note_id}")
async def delete_note(note_id: int, current_user: dict = Depends(get_current_user)):
    """Supprime une note"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            DELETE FROM notes
            WHERE id = %s AND user_id = %s
        """, [note_id, current_user["user_id"]])
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Note non trouvée")
        
        conn.commit()
        return {"message": "Note supprimée"}
    finally:
        cur.close()
        conn.close()

@router.get("/search")
async def search_notes(
    query: str,
    current_user: dict = Depends(get_current_user)
):
    """Recherche dans les notes"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT id, user_id, content, task_id, is_brain_dump, created_at, updated_at
            FROM notes
            WHERE user_id = %s AND content ILIKE %s
            ORDER BY created_at DESC
        """, [current_user["user_id"], f"%{query}%"])
        
        rows = cur.fetchall()
        notes = []
        for row in rows:
            notes.append({
                "id": row[0],
                "user_id": row[1],
                "content": row[2],
                "task_id": row[3],
                "is_brain_dump": row[4],
                "created_at": row[5].isoformat() if row[5] else None,
                "updated_at": row[6].isoformat() if row[6] else None
            })
        
        return notes
    finally:
        cur.close()
        conn.close()

