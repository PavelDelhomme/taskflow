"""
Routes pour le tracking du niveau d'énergie
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, date
from database import get_db_connection
from routes.auth import get_current_user

router = APIRouter(prefix="/energy", tags=["energy"])

class EnergyLogCreate(BaseModel):
    energy_level: int  # 1-5
    notes: Optional[str] = None

class EnergyLogResponse(BaseModel):
    id: int
    user_id: int
    energy_level: int
    timestamp: str
    notes: Optional[str]

@router.post("/log", response_model=EnergyLogResponse)
async def log_energy_level(
    energy_data: EnergyLogCreate,
    current_user: dict = Depends(get_current_user)
):
    """Enregistre un niveau d'énergie"""
    if energy_data.energy_level < 1 or energy_data.energy_level > 5:
        raise HTTPException(status_code=400, detail="Le niveau d'énergie doit être entre 1 et 5")
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            INSERT INTO energy_logs (user_id, energy_level, notes)
            VALUES (%s, %s, %s)
            RETURNING id, user_id, energy_level, timestamp, notes
        """, [current_user["user_id"], energy_data.energy_level, energy_data.notes])
        
        row = cur.fetchone()
        conn.commit()
        
        return {
            "id": row[0],
            "user_id": row[1],
            "energy_level": row[2],
            "timestamp": row[3].isoformat() if row[3] else None,
            "notes": row[4]
        }
    finally:
        cur.close()
        conn.close()

@router.get("/logs", response_model=List[EnergyLogResponse])
async def get_energy_logs(
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    """Récupère les logs d'énergie des X derniers jours"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT id, user_id, energy_level, timestamp, notes
            FROM energy_logs
            WHERE user_id = %s
            AND timestamp >= CURRENT_DATE - INTERVAL '%s days'
            ORDER BY timestamp DESC
        """, [current_user["user_id"], days])
        
        rows = cur.fetchall()
        logs = []
        for row in rows:
            logs.append({
                "id": row[0],
                "user_id": row[1],
                "energy_level": row[2],
                "timestamp": row[3].isoformat() if row[3] else None,
                "notes": row[4]
            })
        
        return logs
    finally:
        cur.close()
        conn.close()

@router.get("/patterns")
async def get_energy_patterns(current_user: dict = Depends(get_current_user)):
    """Analyse les patterns d'énergie (par heure de la journée)"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT 
                EXTRACT(HOUR FROM timestamp) as hour,
                AVG(energy_level) as avg_energy,
                COUNT(*) as count
            FROM energy_logs
            WHERE user_id = %s
            AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY EXTRACT(HOUR FROM timestamp)
            ORDER BY hour ASC
        """, [current_user["user_id"]])
        
        rows = cur.fetchall()
        patterns = []
        for row in rows:
            patterns.append({
                "hour": int(row[0]),
                "avg_energy": round(float(row[1]), 2),
                "count": row[2]
            })
        
        return patterns
    finally:
        cur.close()
        conn.close()

@router.get("/current")
async def get_current_energy_level(current_user: dict = Depends(get_current_user)):
    """Récupère le dernier niveau d'énergie enregistré"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT id, user_id, energy_level, timestamp, notes
            FROM energy_logs
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT 1
        """, [current_user["user_id"]])
        
        row = cur.fetchone()
        if not row:
            return None
        
        return {
            "id": row[0],
            "user_id": row[1],
            "energy_level": row[2],
            "timestamp": row[3].isoformat() if row[3] else None,
            "notes": row[4]
        }
    finally:
        cur.close()
        conn.close()

