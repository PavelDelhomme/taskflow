from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from routes.auth import get_current_user
from database import get_db

router = APIRouter(prefix="/workflows", tags=["Workflows"])

# Models
class WorkflowCreate(BaseModel):
    name: str
    steps: str
    category: str = "dev"
    project: Optional[str] = None

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    steps: Optional[str] = None
    category: Optional[str] = None
    project: Optional[str] = None

@router.get("")
async def get_workflows(current_user = Depends(get_current_user)):
    """Récupérer tous les workflows de l'utilisateur"""
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        cursor.execute("""
            SELECT * FROM workflows 
            WHERE user_id = %s
            ORDER BY category, name
        """, (user_id,))
        workflows = cursor.fetchall()
        
        return [dict(workflow) for workflow in workflows]

@router.post("")
async def create_workflow(workflow_data: WorkflowCreate, current_user = Depends(get_current_user)):
    """Créer un nouveau workflow"""
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        cursor.execute("""
            INSERT INTO workflows (user_id, name, steps, category, project) 
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
        """, (user_id, workflow_data.name, workflow_data.steps, workflow_data.category, workflow_data.project))
        
        new_workflow = cursor.fetchone()
        return dict(new_workflow)

@router.put("/{workflow_id}")
async def update_workflow(workflow_id: int, workflow_data: WorkflowUpdate, current_user = Depends(get_current_user)):
    """Mettre à jour un workflow"""
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        # Vérifier que le workflow existe
        cursor.execute(
            "SELECT * FROM workflows WHERE id = %s AND user_id = %s",
            (workflow_id, user_id)
        )
        existing = cursor.fetchone()
        
        if not existing:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Construire requête UPDATE
        update_fields = []
        params = []
        
        if workflow_data.name is not None:
            update_fields.append("name = %s")
            params.append(workflow_data.name)
        
        if workflow_data.steps is not None:
            update_fields.append("steps = %s")
            params.append(workflow_data.steps)
        
        if workflow_data.category is not None:
            update_fields.append("category = %s")
            params.append(workflow_data.category)
        
        if workflow_data.project is not None:
            update_fields.append("project = %s")
            params.append(workflow_data.project)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        query = f"UPDATE workflows SET {', '.join(update_fields)} WHERE id = %s AND user_id = %s RETURNING *"
        params.extend([workflow_id, user_id])
        
        cursor.execute(query, params)
        updated = cursor.fetchone()
        
        return dict(updated)

@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: int, current_user = Depends(get_current_user)):
    """Supprimer un workflow"""
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        cursor.execute(
            "DELETE FROM workflows WHERE id = %s AND user_id = %s",
            (workflow_id, user_id)
        )
        
        return {"message": "Workflow deleted successfully"}

@router.get("/remind-new-ticket")
async def remind_new_ticket(current_user = Depends(get_current_user)):
    """Endpoint pour rappel de prise de nouveau ticket"""
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        # Vérifier s'il y a des tâches actives
        cursor.execute("""
            SELECT COUNT(*) as count FROM tasks 
            WHERE status = 'in_progress' AND user_id = %s
        """, (user_id,))
        active_count = cursor.fetchone()['count']
        
        if active_count == 0:
            # Récupérer le workflow de rappel
            cursor.execute("""
                SELECT steps FROM workflows 
                WHERE category = 'reminder' AND user_id = %s
                LIMIT 1
            """, (user_id,))
            reminder_workflow = cursor.fetchone()
            
            message = reminder_workflow['steps'] if reminder_workflow else "Prendre un nouveau ticket Trello !"
            
            return {
                "needs_ticket": True,
                "message": message
            }
        
        return {"needs_ticket": False}