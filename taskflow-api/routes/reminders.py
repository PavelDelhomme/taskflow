"""
Routes pour les rappels contextuels intelligents
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from database import get_db_connection
from routes.auth import get_current_user

router = APIRouter(prefix="/reminders", tags=["reminders"])

class ReminderCreate(BaseModel):
    task_id: Optional[int] = None
    reminder_type: str  # 'due_date', 'blocked_days', 'custom'
    reminder_time: datetime
    context_data: Optional[dict] = None

class ReminderResponse(BaseModel):
    id: int
    user_id: int
    task_id: Optional[int]
    reminder_type: str
    reminder_time: str
    is_sent: bool
    sent_at: Optional[str]
    snooze_count: int
    snooze_until: Optional[str]

@router.get("/pending")
async def get_pending_reminders(current_user: dict = Depends(get_current_user)):
    """Récupère les rappels en attente"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT id, user_id, task_id, reminder_type, reminder_time, 
                   is_sent, sent_at, snooze_count, snooze_until, context_data
            FROM reminders
            WHERE user_id = %s
            AND is_sent = false
            AND (snooze_until IS NULL OR snooze_until <= CURRENT_TIMESTAMP)
            AND reminder_time <= CURRENT_TIMESTAMP + INTERVAL '1 hour'
            ORDER BY reminder_time ASC
        """, [current_user["user_id"]])
        
        rows = cur.fetchall()
        reminders = []
        for row in rows:
            reminders.append({
                "id": row[0],
                "user_id": row[1],
                "task_id": row[2],
                "reminder_type": row[3],
                "reminder_time": row[4].isoformat() if row[4] else None,
                "is_sent": row[5],
                "sent_at": row[6].isoformat() if row[6] else None,
                "snooze_count": row[7],
                "snooze_until": row[8].isoformat() if row[8] else None,
                "context_data": row[9]
            })
        
        return reminders
    finally:
        cur.close()
        conn.close()

@router.post("/")
async def create_reminder(reminder_data: ReminderCreate, current_user: dict = Depends(get_current_user)):
    """Crée un nouveau rappel"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Vérifier que la tâche appartient à l'utilisateur si task_id est fourni
        if reminder_data.task_id:
            cur.execute("SELECT user_id FROM tasks WHERE id = %s", [reminder_data.task_id])
            task = cur.fetchone()
            if not task or task[0] != current_user["user_id"]:
                raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
        cur.execute("""
            INSERT INTO reminders (user_id, task_id, reminder_type, reminder_time, context_data)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, user_id, task_id, reminder_type, reminder_time, is_sent, sent_at, snooze_count, snooze_until
        """, [
            current_user["user_id"],
            reminder_data.task_id,
            reminder_data.reminder_type,
            reminder_data.reminder_time,
            reminder_data.context_data
        ])
        
        row = cur.fetchone()
        conn.commit()
        
        return {
            "id": row[0],
            "user_id": row[1],
            "task_id": row[2],
            "reminder_type": row[3],
            "reminder_time": row[4].isoformat() if row[4] else None,
            "is_sent": row[5],
            "sent_at": row[6].isoformat() if row[6] else None,
            "snooze_count": row[7],
            "snooze_until": row[8].isoformat() if row[8] else None
        }
    finally:
        cur.close()
        conn.close()

@router.post("/auto-create")
async def auto_create_reminders(current_user: dict = Depends(get_current_user)):
    """Crée automatiquement des rappels pour les tâches"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Rappels pour les tâches avec due_date dans les prochaines heures
        cur.execute("""
            SELECT id, due_date FROM tasks
            WHERE user_id = %s
            AND due_date IS NOT NULL
            AND due_date > CURRENT_TIMESTAMP
            AND due_date <= CURRENT_TIMESTAMP + INTERVAL '24 hours'
            AND deleted_at IS NULL
            AND id NOT IN (
                SELECT task_id FROM reminders 
                WHERE task_id IS NOT NULL 
                AND reminder_type = 'due_date'
                AND is_sent = false
            )
        """, [current_user["user_id"]])
        
        tasks_with_due_date = cur.fetchall()
        created_count = 0
        
        for task in tasks_with_due_date:
            task_id, due_date = task[0], task[1]
            
            # Créer 3 rappels : 1h avant, 30min avant, au moment
            reminders_times = [
                due_date - timedelta(hours=1),
                due_date - timedelta(minutes=30),
                due_date
            ]
            
            for reminder_time in reminders_times:
                if reminder_time > datetime.now():
                    cur.execute("""
                        INSERT INTO reminders (user_id, task_id, reminder_type, reminder_time)
                        VALUES (%s, %s, 'due_date', %s)
                        ON CONFLICT DO NOTHING
                    """, [current_user["user_id"], task_id, reminder_time])
                    created_count += 1
        
        # Rappels pour les tâches bloquées depuis plus de 3 jours
        cur.execute("""
            SELECT id FROM tasks
            WHERE user_id = %s
            AND status = 'blocked'
            AND updated_at <= CURRENT_TIMESTAMP - INTERVAL '3 days'
            AND deleted_at IS NULL
            AND id NOT IN (
                SELECT task_id FROM reminders 
                WHERE task_id IS NOT NULL 
                AND reminder_type = 'blocked_days'
                AND is_sent = false
            )
        """, [current_user["user_id"]])
        
        blocked_tasks = cur.fetchall()
        for task in blocked_tasks:
            cur.execute("""
                INSERT INTO reminders (user_id, task_id, reminder_type, reminder_time)
                VALUES (%s, %s, 'blocked_days', CURRENT_TIMESTAMP)
            """, [current_user["user_id"], task[0]])
            created_count += 1
        
        conn.commit()
        
        return {"created": created_count, "message": f"{created_count} rappels créés automatiquement"}
    finally:
        cur.close()
        conn.close()

@router.post("/{reminder_id}/snooze")
async def snooze_reminder(
    reminder_id: int,
    minutes: int = 15,
    current_user: dict = Depends(get_current_user)
):
    """Reporter un rappel (snooze)"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            UPDATE reminders
            SET snooze_count = snooze_count + 1,
                snooze_until = CURRENT_TIMESTAMP + INTERVAL '%s minutes',
                reminder_time = reminder_time + INTERVAL '%s minutes'
            WHERE id = %s AND user_id = %s
            RETURNING id, snooze_count, snooze_until
        """, [minutes, minutes, reminder_id, current_user["user_id"]])
        
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Rappel non trouvé")
        
        conn.commit()
        
        return {
            "id": row[0],
            "snooze_count": row[1],
            "snooze_until": row[2].isoformat() if row[2] else None
        }
    finally:
        cur.close()
        conn.close()

@router.post("/{reminder_id}/mark-sent")
async def mark_reminder_sent(reminder_id: int, current_user: dict = Depends(get_current_user)):
    """Marque un rappel comme envoyé"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            UPDATE reminders
            SET is_sent = true, sent_at = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s
        """, [reminder_id, current_user["user_id"]])
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Rappel non trouvé")
        
        conn.commit()
        return {"message": "Rappel marqué comme envoyé"}
    finally:
        cur.close()
        conn.close()

@router.delete("/{reminder_id}")
async def delete_reminder(reminder_id: int, current_user: dict = Depends(get_current_user)):
    """Supprime un rappel"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            DELETE FROM reminders
            WHERE id = %s AND user_id = %s
        """, [reminder_id, current_user["user_id"]])
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Rappel non trouvé")
        
        conn.commit()
        return {"message": "Rappel supprimé"}
    finally:
        cur.close()
        conn.close()

