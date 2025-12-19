"""
Routes pour les pauses structurées
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from database import get_db_connection
from routes.auth import get_current_user

router = APIRouter(prefix="/breaks", tags=["breaks"])

class BreakStart(BaseModel):
    break_type: str = "short"  # short, long, lunch
    activity_suggestion: Optional[str] = None

@router.post("/start")
async def start_break(break_data: BreakStart, current_user: dict = Depends(get_current_user)):
    """Démarre une pause"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            INSERT INTO breaks (user_id, break_type, activity_suggestion)
            VALUES (%s, %s, %s)
            RETURNING id, user_id, break_type, started_at, activity_suggestion
        """, [
            current_user["user_id"],
            break_data.break_type,
            break_data.activity_suggestion
        ])
        
        row = cur.fetchone()
        conn.commit()
        
        return {
            "id": row[0],
            "user_id": row[1],
            "break_type": row[2],
            "started_at": row[3].isoformat() if row[3] else None,
            "activity_suggestion": row[4]
        }
    finally:
        cur.close()
        conn.close()

@router.post("/{break_id}/end")
async def end_break(break_id: int, current_user: dict = Depends(get_current_user)):
    """Termine une pause"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Vérifier que la pause appartient à l'utilisateur
        cur.execute("""
            SELECT id FROM breaks
            WHERE id = %s AND user_id = %s AND ended_at IS NULL
        """, [break_id, current_user["user_id"]])
        
        break_record = cur.fetchone()
        if not break_record:
            raise HTTPException(status_code=404, detail="Pause non trouvée ou déjà terminée")
        
        cur.execute("""
            UPDATE breaks
            SET ended_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, user_id, break_type, started_at, ended_at, activity_suggestion
        """, [break_id])
        
        row = cur.fetchone()
        conn.commit()
        
        # Calculer la durée
        if row[3] and row[4]:
            duration_seconds = (row[4] - row[3]).total_seconds()
            duration_minutes = int(duration_seconds / 60)
        else:
            duration_minutes = 0
        
        return {
            "id": row[0],
            "user_id": row[1],
            "break_type": row[2],
            "started_at": row[3].isoformat() if row[3] else None,
            "ended_at": row[4].isoformat() if row[4] else None,
            "duration_minutes": duration_minutes,
            "activity_suggestion": row[5]
        }
    finally:
        cur.close()
        conn.close()

@router.get("/today")
async def get_today_breaks(current_user: dict = Depends(get_current_user)):
    """Récupère les pauses d'aujourd'hui"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT id, user_id, break_type, started_at, ended_at, activity_suggestion
            FROM breaks
            WHERE user_id = %s
            AND DATE(started_at) = CURRENT_DATE
            ORDER BY started_at DESC
        """, [current_user["user_id"]])
        
        rows = cur.fetchall()
        breaks = []
        for row in rows:
            duration_minutes = 0
            if row[3] and row[4]:
                duration_seconds = (row[4] - row[3]).total_seconds()
                duration_minutes = int(duration_seconds / 60)
            elif row[3]:
                # Pause en cours
                duration_seconds = (datetime.now() - row[3]).total_seconds()
                duration_minutes = int(duration_seconds / 60)
            
            breaks.append({
                "id": row[0],
                "user_id": row[1],
                "break_type": row[2],
                "started_at": row[3].isoformat() if row[3] else None,
                "ended_at": row[4].isoformat() if row[4] else None,
                "duration_minutes": duration_minutes,
                "activity_suggestion": row[5],
                "is_active": row[4] is None
            })
        
        return breaks
    finally:
        cur.close()
        conn.close()

@router.get("/stats")
async def get_break_stats(current_user: dict = Depends(get_current_user)):
    """Statistiques sur les pauses"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Nombre de pauses aujourd'hui
        cur.execute("""
            SELECT COUNT(*) FROM breaks
            WHERE user_id = %s
            AND DATE(started_at) = CURRENT_DATE
        """, [current_user["user_id"]])
        breaks_today = cur.fetchone()[0]
        
        # Temps total de pause aujourd'hui (en minutes)
        cur.execute("""
            SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60), 0)
            FROM breaks
            WHERE user_id = %s
            AND DATE(started_at) = CURRENT_DATE
            AND ended_at IS NOT NULL
        """, [current_user["user_id"]])
        total_break_time_minutes = int(cur.fetchone()[0] or 0)
        
        # Pause en cours
        cur.execute("""
            SELECT id, started_at FROM breaks
            WHERE user_id = %s
            AND ended_at IS NULL
            ORDER BY started_at DESC
            LIMIT 1
        """, [current_user["user_id"]])
        active_break = cur.fetchone()
        
        active_break_data = None
        if active_break:
            duration_seconds = (datetime.now() - active_break[1]).total_seconds()
            active_break_data = {
                "id": active_break[0],
                "started_at": active_break[1].isoformat() if active_break[1] else None,
                "duration_minutes": int(duration_seconds / 60)
            }
        
        return {
            "breaks_today": breaks_today,
            "total_break_time_minutes": total_break_time_minutes,
            "active_break": active_break_data
        }
    finally:
        cur.close()
        conn.close()

