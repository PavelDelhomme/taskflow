"""
Routes pour les statistiques motivantes
"""
from fastapi import APIRouter, Depends
from typing import Dict, List
from datetime import datetime, timedelta
from database import get_db_connection
from routes.auth import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Récupère les statistiques du dashboard"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        user_id = current_user["user_id"]
        
        # Tâches terminées aujourd'hui
        cur.execute("""
            SELECT COUNT(*) FROM tasks
            WHERE user_id = %s AND status = 'done' 
            AND DATE(completed_at) = CURRENT_DATE
            AND deleted_at IS NULL
        """, [user_id])
        tasks_completed_today = cur.fetchone()[0]
        
        # Tâches en cours
        cur.execute("""
            SELECT COUNT(*) FROM tasks
            WHERE user_id = %s AND status = 'in_progress'
            AND deleted_at IS NULL
        """, [user_id])
        tasks_in_progress = cur.fetchone()[0]
        
        # Tâches à faire
        cur.execute("""
            SELECT COUNT(*) FROM tasks
            WHERE user_id = %s AND status = 'todo'
            AND deleted_at IS NULL
        """, [user_id])
        tasks_todo = cur.fetchone()[0]
        
        # Tâches terminées cette semaine
        cur.execute("""
            SELECT COUNT(*) FROM tasks
            WHERE user_id = %s AND status = 'done'
            AND completed_at >= DATE_TRUNC('week', CURRENT_DATE)
            AND deleted_at IS NULL
        """, [user_id])
        tasks_completed_week = cur.fetchone()[0]
        
        # Temps total passé aujourd'hui (en minutes)
        cur.execute("""
            SELECT COALESCE(SUM(time_spent_seconds), 0) / 60 FROM tasks
            WHERE user_id = %s AND status = 'done'
            AND DATE(completed_at) = CURRENT_DATE
            AND deleted_at IS NULL
        """, [user_id])
        time_spent_today_minutes = cur.fetchone()[0] or 0
        
        # Tâches terminées par jour (7 derniers jours)
        cur.execute("""
            SELECT DATE(completed_at) as date, COUNT(*) as count
            FROM tasks
            WHERE user_id = %s AND status = 'done'
            AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
            AND deleted_at IS NULL
            GROUP BY DATE(completed_at)
            ORDER BY date ASC
        """, [user_id])
        daily_completions = cur.fetchall()
        
        daily_stats = []
        for row in daily_completions:
            daily_stats.append({
                "date": row[0].isoformat() if isinstance(row[0], datetime) else str(row[0]),
                "count": row[1]
            })
        
        # Streak (jours consécutifs avec au moins une tâche terminée)
        streak = 0
        check_date = datetime.now().date()
        while True:
            cur.execute("""
                SELECT COUNT(*) FROM tasks
                WHERE user_id = %s AND status = 'done'
                AND DATE(completed_at) = %s
                AND deleted_at IS NULL
            """, [user_id, check_date])
            count = cur.fetchone()[0]
            if count > 0:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
        
        # Meilleure journée (plus de tâches terminées)
        cur.execute("""
            SELECT DATE(completed_at) as date, COUNT(*) as count
            FROM tasks
            WHERE user_id = %s AND status = 'done'
            AND deleted_at IS NULL
            GROUP BY DATE(completed_at)
            ORDER BY count DESC
            LIMIT 1
        """, [user_id])
        best_day = cur.fetchone()
        
        best_day_data = None
        if best_day:
            best_day_data = {
                "date": best_day[0].isoformat() if isinstance(best_day[0], datetime) else str(best_day[0]),
                "count": best_day[1]
            }
        
        # Estimation vs Réalité (moyenne)
        cur.execute("""
            SELECT 
                AVG(estimated_time_minutes) as avg_estimated,
                AVG(time_spent_seconds / 60.0) as avg_actual
            FROM tasks
            WHERE user_id = %s 
            AND status = 'done'
            AND estimated_time_minutes IS NOT NULL
            AND time_spent_seconds > 0
            AND deleted_at IS NULL
        """, [user_id])
        time_comparison = cur.fetchone()
        
        time_awareness = None
        if time_comparison and time_comparison[0] and time_comparison[1]:
            avg_estimated = float(time_comparison[0])
            avg_actual = float(time_comparison[1])
            difference_percent = ((avg_actual - avg_estimated) / avg_estimated * 100) if avg_estimated > 0 else 0
            time_awareness = {
                "avg_estimated_minutes": round(avg_estimated, 1),
                "avg_actual_minutes": round(avg_actual, 1),
                "difference_percent": round(difference_percent, 1),
                "tendency": "sous-estimation" if difference_percent > 20 else "sur-estimation" if difference_percent < -20 else "précision"
            }
        
        return {
            "tasks_completed_today": tasks_completed_today,
            "tasks_in_progress": tasks_in_progress,
            "tasks_todo": tasks_todo,
            "tasks_completed_week": tasks_completed_week,
            "time_spent_today_minutes": int(time_spent_today_minutes),
            "daily_stats": daily_stats,
            "streak_days": streak,
            "best_day": best_day_data,
            "time_awareness": time_awareness
        }
    finally:
        cur.close()
        conn.close()

@router.get("/time-comparison")
async def get_time_comparison_stats(current_user: dict = Depends(get_current_user)):
    """Récupère les statistiques de comparaison estimation vs réalité"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        user_id = current_user["user_id"]
        
        cur.execute("""
            SELECT 
                id,
                title,
                estimated_time_minutes,
                time_spent_seconds / 60.0 as actual_minutes,
                (time_spent_seconds / 60.0 - estimated_time_minutes) as difference
            FROM tasks
            WHERE user_id = %s
            AND status = 'done'
            AND estimated_time_minutes IS NOT NULL
            AND time_spent_seconds > 0
            AND deleted_at IS NULL
            ORDER BY completed_at DESC
            LIMIT 50
        """, [user_id])
        
        rows = cur.fetchall()
        comparisons = []
        for row in rows:
            comparisons.append({
                "task_id": row[0],
                "title": row[1],
                "estimated_minutes": row[2],
                "actual_minutes": round(row[3], 1) if row[3] else None,
                "difference_minutes": round(row[4], 1) if row[4] else None
            })
        
        return comparisons
    finally:
        cur.close()
        conn.close()

