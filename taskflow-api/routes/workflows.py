from fastapi import APIRouter, Depends
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/workflows", tags=["workflows"])

@router.get("")
async def get_workflows(user_id: int = Depends(get_current_user)):
    with get_db() as conn:
        workflows = conn.execute("""
            SELECT * FROM workflows 
            ORDER BY category, name
        """).fetchall()
        
        return [dict(workflow) for workflow in workflows]

@router.get("/remind-new-ticket")
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
