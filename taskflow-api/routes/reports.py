from fastapi import APIRouter, Depends
from routes.auth import get_current_user
from database import get_db
from datetime import datetime, timedelta

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/daily-summary")
async def get_daily_summary(current_user = Depends(get_current_user)):
    """Générer un résumé quotidien des tâches"""
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        # Tâches terminées aujourd'hui
        cursor.execute("""
            SELECT COUNT(*) as count FROM tasks 
            WHERE user_id = %s 
            AND status = 'done' 
            AND DATE(completed_at) = CURRENT_DATE
        """, (user_id,))
        done_today = cursor.fetchone()['count']
        
        # Tâches en cours
        cursor.execute("""
            SELECT * FROM tasks 
            WHERE user_id = %s 
            AND status = 'in_progress'
            ORDER BY priority DESC, created_at
        """, (user_id,))
        in_progress = cursor.fetchall()
        
        # Tâches bloquées
        cursor.execute("""
            SELECT * FROM tasks 
            WHERE user_id = %s 
            AND status = 'blocked'
        """, (user_id,))
        blocked = cursor.fetchall()
        
        # Générer le résumé
        summary = f"📋 Daily Summary - {datetime.now().strftime('%Y-%m-%d')}\n\n"
        summary += f"✅ Tâches terminées aujourd'hui: {done_today}\n\n"
        
        if in_progress:
            summary += "🔄 En cours:\n"
            for task in in_progress:
                summary += f"  - {task['title']} ({task['priority']})\n"
            summary += "\n"
        
        if blocked:
            summary += "🚫 Bloquées:\n"
            for task in blocked:
                summary += f"  - {task['title']}"
                if task.get('blocked_reason'):
                    summary += f" - {task['blocked_reason']}"
                summary += "\n"
            summary += "\n"
        
        if not in_progress and not blocked:
            summary += "Aucune tâche active.\n"
        
        return {"summary": summary}

@router.get("/weekly-summary")
async def get_weekly_summary(current_user = Depends(get_current_user)):
    """Générer un résumé hebdomadaire des tâches"""
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        # Date de début de la semaine (lundi)
        today = datetime.now().date()
        days_since_monday = today.weekday()
        week_start = today - timedelta(days=days_since_monday)
        
        # Tâches terminées cette semaine
        cursor.execute("""
            SELECT COUNT(*) as count FROM tasks 
            WHERE user_id = %s 
            AND status = 'done' 
            AND DATE(completed_at) >= %s
        """, (user_id, week_start))
        done_week = cursor.fetchone()['count']
        
        # Statistiques par statut
        cursor.execute("""
            SELECT 
                status,
                COUNT(*) as count
            FROM tasks 
            WHERE user_id = %s
            GROUP BY status
        """, (user_id,))
        status_stats = cursor.fetchall()
        
        # Tâches créées cette semaine
        cursor.execute("""
            SELECT COUNT(*) as count FROM tasks 
            WHERE user_id = %s 
            AND DATE(created_at) >= %s
        """, (user_id, week_start))
        created_week = cursor.fetchone()['count']
        
        # Générer le résumé
        summary = f"📊 Weekly Summary - Semaine du {week_start.strftime('%Y-%m-%d')}\n\n"
        summary += f"✅ Tâches terminées cette semaine: {done_week}\n"
        summary += f"➕ Tâches créées cette semaine: {created_week}\n\n"
        
        summary += "📈 Répartition par statut:\n"
        for stat in status_stats:
            summary += f"  - {stat['status']}: {stat['count']}\n"
        
        return {"summary": summary}
