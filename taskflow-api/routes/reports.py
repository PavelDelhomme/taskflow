from fastapi import APIRouter, Depends
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/daily-summary")
async def get_daily_summary(user_id: int = Depends(get_current_user)):
    with get_db() as conn:
        # Tasks en cours
        in_progress = conn.execute("""
            SELECT title, description, blocked_reason, trello_id
            FROM tasks 
            WHERE status = 'in_progress'
            ORDER BY priority DESC
        """).fetchall()
        
        # Tasks bloquées
        blocked = conn.execute("""
            SELECT title, blocked_reason, trello_id
            FROM tasks 
            WHERE status = 'blocked'
        """).fetchall()
        
        # Tasks en standby
        standby = conn.execute("""
            SELECT title, description, trello_id
            FROM tasks 
            WHERE status = 'standby'
        """).fetchall()
        
        # Tasks terminées aujourd'hui
        completed_today = conn.execute("""
            SELECT title, trello_id
            FROM tasks 
            WHERE status = 'done' 
            AND DATE(completed_at) = DATE('now')
        """).fetchall()
        
        # Tasks en review
        in_review = conn.execute("""
            SELECT title, trello_id
            FROM tasks 
            WHERE status = 'review'
        """).fetchall()
        
        # Générer résumé
        summary = "📋 **DAILY SUMMARY**\n\n"
        
        if in_progress:
            summary += "🔄 **En cours:**\n"
            for task in in_progress:
                trello_info = f" (Trello: {task['trello_id']})" if task['trello_id'] else ""
                summary += f"- {task['title']}{trello_info}\n"
            summary += "\n"
        
        if completed_today:
            summary += "✅ **Terminé aujourd'hui:**\n"
            for task in completed_today:
                trello_info = f" (Trello: {task['trello_id']})" if task['trello_id'] else ""
                summary += f"- {task['title']}{trello_info}\n"
            summary += "\n"
        
        if blocked:
            summary += "🚫 **Blocages:**\n"
            for task in blocked:
                trello_info = f" (Trello: {task['trello_id']})" if task['trello_id'] else ""
                summary += f"- {task['title']}: {task['blocked_reason']}{trello_info}\n"
            summary += "\n"
        
        if standby:
            summary += "⏸️ **En standby:**\n"
            for task in standby:
                trello_info = f" (Trello: {task['trello_id']})" if task['trello_id'] else ""
                summary += f"- {task['title']}{trello_info}\n"
            summary += "\n"
        
        if in_review:
            summary += "⏳ **En review:**\n"
            for task in in_review:
                trello_info = f" (Trello: {task['trello_id']})" if task['trello_id'] else ""
                summary += f"- {task['title']}{trello_info}\n"
            summary += "\n"
        
        # Rappel si aucune tâche active
        active_tasks = len(in_progress)
        if active_tasks == 0:
            summary += "🎯 **AUCUNE TÂCHE ACTIVE** - Prendre nouveau ticket Trello !\n"
            summary += "➡️ Voir workflow 'Rappel Tickets' pour actions à faire\n\n"
        
        summary += "🎯 **Prochaines étapes:** [À compléter]\n"
        summary += "💬 **Points à signaler:** [À compléter]"
        
        return {"summary": summary, "needs_new_ticket": active_tasks == 0}

@router.get("/weekly-summary")
async def get_weekly_summary(user_id: int = Depends(get_current_user)):
    with get_db() as conn:
        # Stats de la semaine
        stats = conn.execute("""
            SELECT 
                COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_count,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
                COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked_count,
                COUNT(CASE WHEN status = 'standby' THEN 1 END) as standby_count,
                COUNT(*) as total_count
            FROM tasks 
            WHERE created_at >= datetime('now', '-7 days')
        """).fetchone()
        
        # Tâches terminées cette semaine
        completed_week = conn.execute("""
            SELECT title, completed_at, trello_id
            FROM tasks 
            WHERE status = 'done' 
            AND completed_at >= datetime('now', '-7 days')
            ORDER BY completed_at DESC
        """).fetchall()
        
        # Blocages persistants
        persistent_blocks = conn.execute("""
            SELECT title, blocked_reason, updated_at, trello_id
            FROM tasks 
            WHERE status = 'blocked' 
            AND updated_at <= datetime('now', '-2 days')
        """).fetchall()
        
        # Standby trop long
        long_standby = conn.execute("""
            SELECT title, standby_at, trello_id
            FROM tasks 
            WHERE status = 'standby' 
            AND standby_at <= datetime('now', '-3 days')
        """).fetchall()
        
        summary = "📊 **WEEKLY SUMMARY**\n\n"
        summary += f"📈 **Stats:** {stats['completed_count']} terminées, {stats['in_progress_count']} en cours, {stats['blocked_count']} bloquées, {stats['standby_count']} en standby\n\n"
        
        if completed_week:
            summary += "✅ **Accompli cette semaine:**\n"
            for task in completed_week[:5]:  # Top 5
                trello_info = f" (Trello: {task['trello_id']})" if task['trello_id'] else ""
                summary += f"- {task['title']}{trello_info}\n"
            summary += "\n"
        
        if persistent_blocks:
            summary += "⚠️ **Blocages persistants (>2j):**\n"
            for task in persistent_blocks:
                trello_info = f" (Trello: {task['trello_id']})" if task['trello_id'] else ""
                summary += f"- {task['title']}: {task['blocked_reason']}{trello_info}\n"
            summary += "\n"
        
        if long_standby:
            summary += "⏸️ **Standby trop long (>3j):**\n"
            for task in long_standby:
                trello_info = f" (Trello: {task['trello_id']})" if task['trello_id'] else ""
                summary += f"- {task['title']}{trello_info}\n"
            summary += "\n"
        
        summary += "🎯 **Focus semaine prochaine:** [À définir]\n"
        summary += "📞 **Points pour le responsable:** [À compléter]"
        
        return {"summary": summary}
