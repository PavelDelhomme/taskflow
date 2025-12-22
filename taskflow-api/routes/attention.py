from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from database import get_db
from routes.auth import get_current_user

router = APIRouter(prefix="/attention", tags=["Attention"])

# Models
class AttentionSessionCreate(BaseModel):
    task_id: Optional[int] = None
    focus_start: datetime
    focus_end: Optional[datetime] = None
    distraction_events: int = 0
    context_energy_level: Optional[int] = None

class AttentionSessionResponse(BaseModel):
    id: int
    user_id: int
    task_id: Optional[int]
    focus_start: datetime
    focus_end: Optional[datetime]
    focus_duration_seconds: Optional[int]
    attention_score: int
    distraction_events: int
    context_hour: Optional[int]
    context_energy_level: Optional[int]
    context_day_of_week: Optional[int]
    created_at: datetime

class AttentionStatsResponse(BaseModel):
    current_score: int  # Score actuel (0-100)
    average_score_today: float
    average_score_week: float
    total_focus_time_today: int  # En secondes
    total_focus_time_week: int
    distraction_count_today: int
    best_focus_hour: Optional[int]  # Heure où l'attention est optimale
    average_focus_duration: float  # Durée moyenne de focus en secondes
    attention_trend: str  # "improving", "stable", "declining"

class AttentionRecommendationResponse(BaseModel):
    message: str
    type: str  # "pause", "pomodoro", "focus", "task_suggestion"
    priority: str  # "low", "medium", "high"

# Fonction pour calculer le score d'attention
def calculate_attention_score(focus_duration: int, distraction_events: int, base_score: int = 50) -> int:
    """
    Calcule un score d'attention de 0 à 100 basé sur :
    - Durée de focus (plus long = meilleur)
    - Nombre de distractions (plus élevé = pire)
    """
    # Score basé sur la durée (max 40 points)
    duration_score = min(40, (focus_duration / 3600) * 40)  # 1h = 40 points
    
    # Pénalité pour les distractions (max -30 points)
    distraction_penalty = min(30, distraction_events * 5)
    
    # Score final
    score = base_score + duration_score - distraction_penalty
    return max(0, min(100, int(score)))

@router.post("/session", response_model=AttentionSessionResponse)
async def create_attention_session(
    session_data: AttentionSessionCreate,
    current_user = Depends(get_current_user)
):
    """Enregistrer une session de focus/attention"""
    
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    # Calculer la durée si focus_end est fourni
    focus_duration = None
    if session_data.focus_end:
        delta = session_data.focus_end - session_data.focus_start
        focus_duration = int(delta.total_seconds())
    
    # Calculer le score d'attention
    attention_score = calculate_attention_score(
        focus_duration or 0,
        session_data.distraction_events
    )
    
    # Extraire le contexte
    context_hour = session_data.focus_start.hour
    context_day_of_week = session_data.focus_start.weekday()
    
    with get_db() as cursor:
        cursor.execute("""
            INSERT INTO attention_logs 
            (user_id, task_id, focus_start, focus_end, focus_duration_seconds, 
             attention_score, distraction_events, context_hour, context_energy_level, context_day_of_week)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (
            user_id,
            session_data.task_id,
            session_data.focus_start,
            session_data.focus_end,
            focus_duration,
            attention_score,
            session_data.distraction_events,
            context_hour,
            session_data.context_energy_level,
            context_day_of_week
        ))
        
        session = cursor.fetchone()
        return session

@router.get("/stats", response_model=AttentionStatsResponse)
async def get_attention_stats(
    current_user = Depends(get_current_user)
):
    """Récupérer les statistiques d'attention de l'utilisateur"""
    
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        
        # Stats d'aujourd'hui
        cursor.execute("""
            SELECT 
                AVG(attention_score) as avg_score,
                SUM(focus_duration_seconds) as total_duration,
                SUM(distraction_events) as total_distractions,
                COUNT(*) as session_count
            FROM attention_logs
            WHERE user_id = %s AND focus_start >= %s
        """, (user_id, today_start))
        today_stats = cursor.fetchone()
        
        # Stats de la semaine
        cursor.execute("""
            SELECT 
                AVG(attention_score) as avg_score,
                SUM(focus_duration_seconds) as total_duration
            FROM attention_logs
            WHERE user_id = %s AND focus_start >= %s
        """, (user_id, week_start))
        week_stats = cursor.fetchone()
        
        # Meilleure heure de focus
        cursor.execute("""
            SELECT context_hour, AVG(attention_score) as avg_score
            FROM attention_logs
            WHERE user_id = %s AND focus_start >= %s
            GROUP BY context_hour
            ORDER BY avg_score DESC
            LIMIT 1
        """, (user_id, week_start))
        best_hour = cursor.fetchone()
        
        # Durée moyenne de focus
        cursor.execute("""
            SELECT AVG(focus_duration_seconds) as avg_duration
            FROM attention_logs
            WHERE user_id = %s AND focus_start >= %s
            AND focus_duration_seconds IS NOT NULL
        """, (user_id, week_start))
        avg_duration = cursor.fetchone()
        
        # Tendance (comparaison aujourd'hui vs hier)
        yesterday_start = today_start - timedelta(days=1)
        cursor.execute("""
            SELECT AVG(attention_score) as avg_score
            FROM attention_logs
            WHERE user_id = %s AND focus_start >= %s AND focus_start < %s
        """, (user_id, yesterday_start, today_start))
        yesterday_stats = cursor.fetchone()
        
        # Calculer la tendance
        today_avg = today_stats['avg_score'] or 0
        yesterday_avg = yesterday_stats['avg_score'] or 0
        if today_avg > yesterday_avg + 5:
            trend = "improving"
        elif today_avg < yesterday_avg - 5:
            trend = "declining"
        else:
            trend = "stable"
        
        # Score actuel (basé sur la dernière session)
        cursor.execute("""
            SELECT attention_score
            FROM attention_logs
            WHERE user_id = %s
            ORDER BY focus_start DESC
            LIMIT 1
        """, (user_id,))
        last_session = cursor.fetchone()
        current_score = last_session['attention_score'] if last_session else 50
        
        return {
            "current_score": current_score,
            "average_score_today": float(today_stats['avg_score'] or 50),
            "average_score_week": float(week_stats['avg_score'] or 50),
            "total_focus_time_today": int(today_stats['total_duration'] or 0),
            "total_focus_time_week": int(week_stats['total_duration'] or 0),
            "distraction_count_today": int(today_stats['total_distractions'] or 0),
            "best_focus_hour": best_hour['context_hour'] if best_hour else None,
            "average_focus_duration": float(avg_duration['avg_duration'] or 0),
            "attention_trend": trend
        }

@router.get("/recommendations", response_model=List[AttentionRecommendationResponse])
async def get_attention_recommendations(
    current_user = Depends(get_current_user)
):
    """Obtenir des recommandations basées sur les patterns d'attention"""
    
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    recommendations = []
    
    with get_db() as cursor:
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Vérifier les changements de tâches fréquents aujourd'hui
        cursor.execute("""
            SELECT COUNT(*) as task_changes
            FROM attention_logs
            WHERE user_id = %s 
            AND focus_start >= %s
            AND focus_start >= NOW() - INTERVAL '1 hour'
        """, (user_id, today_start))
        recent_changes = cursor.fetchone()
        
        if recent_changes['task_changes'] and recent_changes['task_changes'] >= 5:
            recommendations.append({
                "message": f"Vous avez changé de tâche {recent_changes['task_changes']} fois en 1 heure. Voulez-vous faire une pause ?",
                "type": "pause",
                "priority": "high"
            })
        
        # Vérifier le temps de focus continu
        cursor.execute("""
            SELECT focus_duration_seconds
            FROM attention_logs
            WHERE user_id = %s
            AND focus_start >= %s
            ORDER BY focus_start DESC
            LIMIT 1
        """, (user_id, today_start))
        last_session = cursor.fetchone()
        
        if last_session and last_session['focus_duration_seconds']:
            duration_minutes = last_session['focus_duration_seconds'] / 60
            if duration_minutes >= 45:
                recommendations.append({
                    "message": f"Vous êtes concentré depuis {int(duration_minutes)} minutes, excellente session ! 🎉",
                    "type": "focus",
                    "priority": "low"
                })
            elif duration_minutes >= 25:
                recommendations.append({
                    "message": "Vous avez terminé un cycle Pomodoro ! Prenez une pause de 5 minutes.",
                    "type": "pomodoro",
                    "priority": "medium"
                })
        
        # Vérifier le score d'attention actuel
        cursor.execute("""
            SELECT AVG(attention_score) as avg_score
            FROM attention_logs
            WHERE user_id = %s
            AND focus_start >= %s
            AND focus_start >= NOW() - INTERVAL '2 hours'
        """, (user_id, today_start))
        recent_score = cursor.fetchone()
        
        if recent_score['avg_score'] and recent_score['avg_score'] < 30:
            recommendations.append({
                "message": "Votre attention est faible en ce moment. Essayez une tâche plus simple ou faites une pause.",
                "type": "task_suggestion",
                "priority": "high"
            })
        elif recent_score['avg_score'] and recent_score['avg_score'] > 70:
            recommendations.append({
                "message": "Votre attention est optimale ! C'est le moment idéal pour les tâches difficiles.",
                "type": "task_suggestion",
                "priority": "low"
            })
        
        # Vérifier l'heure optimale
        cursor.execute("""
            SELECT context_hour, AVG(attention_score) as avg_score
            FROM attention_logs
            WHERE user_id = %s
            AND focus_start >= NOW() - INTERVAL '7 days'
            GROUP BY context_hour
            ORDER BY avg_score DESC
            LIMIT 1
        """, (user_id,))
        best_hour_data = cursor.fetchone()
        
        if best_hour_data and best_hour_data['context_hour'] == now.hour:
            recommendations.append({
                "message": "C'est votre heure de productivité optimale ! Profitez-en pour les tâches importantes.",
                "type": "task_suggestion",
                "priority": "medium"
            })
    
    return recommendations

@router.get("/history", response_model=List[AttentionSessionResponse])
async def get_attention_history(
    days: int = 7,
    current_user = Depends(get_current_user)
):
    """Récupérer l'historique des sessions d'attention"""
    
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        start_date = datetime.now() - timedelta(days=days)
        cursor.execute("""
            SELECT *
            FROM attention_logs
            WHERE user_id = %s AND focus_start >= %s
            ORDER BY focus_start DESC
        """, (user_id, start_date))
        
        sessions = cursor.fetchall()
        return sessions

@router.get("/patterns")
async def get_attention_patterns(
    current_user = Depends(get_current_user)
):
    """Analyser les patterns d'attention de l'utilisateur"""
    
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        # Pattern par heure de la journée
        cursor.execute("""
            SELECT 
                context_hour,
                AVG(attention_score) as avg_score,
                AVG(focus_duration_seconds) as avg_duration,
                COUNT(*) as session_count
            FROM attention_logs
            WHERE user_id = %s AND focus_start >= NOW() - INTERVAL '30 days'
            GROUP BY context_hour
            ORDER BY context_hour
        """, (user_id,))
        hourly_patterns = cursor.fetchall()
        
        # Pattern par jour de la semaine
        cursor.execute("""
            SELECT 
                context_day_of_week,
                AVG(attention_score) as avg_score,
                AVG(focus_duration_seconds) as avg_duration,
                COUNT(*) as session_count
            FROM attention_logs
            WHERE user_id = %s AND focus_start >= NOW() - INTERVAL '30 days'
            GROUP BY context_day_of_week
            ORDER BY context_day_of_week
        """, (user_id,))
        daily_patterns = cursor.fetchall()
        
        # Pattern par niveau d'énergie
        cursor.execute("""
            SELECT 
                context_energy_level,
                AVG(attention_score) as avg_score,
                AVG(focus_duration_seconds) as avg_duration,
                COUNT(*) as session_count
            FROM attention_logs
            WHERE user_id = %s 
            AND focus_start >= NOW() - INTERVAL '30 days'
            AND context_energy_level IS NOT NULL
            GROUP BY context_energy_level
            ORDER BY context_energy_level
        """, (user_id,))
        energy_patterns = cursor.fetchall()
        
        return {
            "hourly_patterns": hourly_patterns,
            "daily_patterns": daily_patterns,
            "energy_patterns": energy_patterns
        }

