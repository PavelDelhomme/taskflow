"""
IA intelligente utilisant le mécanisme d'attention pour suggérer les meilleures tâches
"""
from fastapi import APIRouter, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from database import get_db
from routes.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI Suggestions"])

@router.get("/suggest-next-task")
async def suggest_next_task(current_user = Depends(get_current_user)):
    """
    Utilise le mécanisme d'attention pour suggérer intelligemment la prochaine tâche à faire
    """
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        now = datetime.now()
        current_hour = now.hour
        
        # 1. Récupérer le score d'attention actuel
        cursor.execute("""
            SELECT attention_score, focus_duration_seconds, distraction_events
            FROM attention_logs
            WHERE user_id = %s
            AND focus_start >= NOW() - INTERVAL '2 hours'
            ORDER BY focus_start DESC
            LIMIT 1
        """, (user_id,))
        recent_attention = cursor.fetchone()
        
        current_attention_score = 50  # Par défaut
        if recent_attention:
            current_attention_score = recent_attention['attention_score'] or 50
        
        # 2. Récupérer l'heure optimale de focus de l'utilisateur
        cursor.execute("""
            SELECT context_hour, AVG(attention_score) as avg_score
            FROM attention_logs
            WHERE user_id = %s
            AND focus_start >= NOW() - INTERVAL '30 days'
            GROUP BY context_hour
            ORDER BY avg_score DESC
            LIMIT 1
        """, (user_id,))
        best_hour_data = cursor.fetchone()
        best_hour = best_hour_data['context_hour'] if best_hour_data and best_hour_data.get('context_hour') is not None else current_hour
        
        # 3. Récupérer le niveau d'énergie actuel
        cursor.execute("""
            SELECT energy_level
            FROM energy_logs
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT 1
        """, (user_id,))
        energy_data = cursor.fetchone()
        current_energy = energy_data['energy_level'] if energy_data and energy_data.get('energy_level') is not None else 3
        
        # 4. Récupérer les tâches disponibles
        cursor.execute("""
            SELECT * FROM tasks
            WHERE user_id = %s
            AND status IN ('todo', 'standby', 'blocked')
            AND deleted_at IS NULL
            ORDER BY 
                CASE priority
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                END,
                created_at ASC
        """, (user_id,))
        available_tasks = cursor.fetchall()
        
        if not available_tasks:
            return {
                "suggestion": None,
                "reason": "Aucune tâche disponible",
                "attention_score": current_attention_score,
                "recommendation": "Créez de nouvelles tâches pour commencer !"
            }
        
        # 5. Analyser chaque tâche avec l'IA basée sur l'attention
        scored_tasks = []
        
        for task in available_tasks:
            score = 0
            reasons = []
            
            # Score basé sur la priorité
            priority_scores = {'urgent': 30, 'high': 20, 'medium': 10, 'low': 5}
            score += priority_scores.get(task['priority'], 10)
            
            # Score basé sur l'attention actuelle
            # Si attention élevée (>70) : suggérer tâches difficiles/complexes
            # Si attention moyenne (40-70) : suggérer tâches moyennes
            # Si attention faible (<40) : suggérer tâches simples
            estimated_time = task.get('estimated_time_minutes', 60)
            
            if current_attention_score >= 70:
                # Attention élevée : favoriser les tâches longues/complexes
                if estimated_time >= 60:
                    score += 25
                    reasons.append("Votre attention est optimale, idéal pour les tâches complexes")
                elif estimated_time >= 30:
                    score += 15
            elif current_attention_score >= 40:
                # Attention moyenne : tâches de durée moyenne
                if 30 <= estimated_time <= 90:
                    score += 20
                    reasons.append("Votre attention est moyenne, parfait pour cette tâche")
            else:
                # Attention faible : tâches courtes et simples
                if estimated_time <= 30:
                    score += 25
                    reasons.append("Votre attention est faible, cette tâche courte est idéale")
                elif estimated_time <= 60:
                    score += 10
            
            # Score basé sur le niveau d'énergie
            # Énergie élevée (4-5) : tâches difficiles
            # Énergie moyenne (3) : tâches normales
            # Énergie faible (1-2) : tâches simples
            if current_energy >= 4:
                if task['priority'] in ['urgent', 'high']:
                    score += 15
                    reasons.append("Votre énergie est élevée, profitez-en pour les tâches importantes")
            elif current_energy <= 2:
                if task['priority'] == 'low':
                    score += 15
                    reasons.append("Votre énergie est faible, cette tâche simple est adaptée")
            
            # Score basé sur l'heure optimale
            if abs(current_hour - best_hour) <= 2:
                score += 10
                reasons.append(f"C'est votre heure de productivité optimale ({best_hour}h)")
            
            # Pénalité pour les tâches bloquées
            if task['status'] == 'blocked':
                score -= 20
                reasons.append("Tâche bloquée - à débloquer d'abord")
            
            # Bonus pour les tâches en standby (déjà commencées)
            if task['status'] == 'standby':
                score += 10
                reasons.append("Tâche déjà commencée, plus facile à reprendre")
            
            # Vérifier les distractions récentes
            if recent_attention and recent_attention['distraction_events']:
                if recent_attention['distraction_events'] >= 3:
                    # Beaucoup de distractions : suggérer une pause ou une tâche très simple
                    if estimated_time <= 15:
                        score += 20
                        reasons.append("Vous avez eu plusieurs distractions, cette tâche courte vous aidera à vous recentrer")
                    else:
                        score -= 10
                        reasons.append("Beaucoup de distractions récentes, évitez les tâches longues")
            
            scored_tasks.append({
                "task": task,
                "score": score,
                "reasons": reasons,
                "attention_based": True
            })
        
        # Trier par score décroissant
        scored_tasks.sort(key=lambda x: x['score'], reverse=True)
        
        best_task = scored_tasks[0] if scored_tasks else None
        
        if not best_task:
            return {
                "suggestion": None,
                "reason": "Aucune tâche adaptée trouvée",
                "attention_score": current_attention_score
            }
        
        # Générer une recommandation intelligente
        recommendation = f"Basé sur votre score d'attention actuel ({current_attention_score}/100)"
        if best_task['reasons']:
            recommendation += f" : {best_task['reasons'][0]}"
        
        return {
            "suggestion": {
                "task_id": best_task['task']['id'],
                "title": best_task['task']['title'],
                "priority": best_task['task']['priority'],
                "estimated_time_minutes": best_task['task'].get('estimated_time_minutes'),
                "status": best_task['task']['status']
            },
            "score": best_task['score'],
            "reasons": best_task['reasons'],
            "attention_score": current_attention_score,
            "current_energy": current_energy,
            "best_focus_hour": best_hour,
            "recommendation": recommendation,
            "alternatives": [
                {
                    "task_id": t['task']['id'],
                    "title": t['task']['title'],
                    "score": t['score']
                }
                for t in scored_tasks[1:4]  # Top 3 alternatives
            ]
        }

@router.get("/suggest-break")
async def suggest_break(current_user = Depends(get_current_user)):
    """
    Utilise le mécanisme d'attention pour suggérer intelligemment une pause
    """
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        # Récupérer les sessions récentes
        cursor.execute("""
            SELECT 
                focus_duration_seconds,
                distraction_events,
                attention_score,
                focus_start
            FROM attention_logs
            WHERE user_id = %s
            AND focus_start >= NOW() - INTERVAL '1 hour'
            ORDER BY focus_start DESC
        """, (user_id,))
        recent_sessions = cursor.fetchall()
        
        if not recent_sessions:
            return {
                "suggest_break": False,
                "reason": "Pas assez de données récentes"
            }
        
        # Calculer le temps de focus total récent
        total_focus_time = sum(s['focus_duration_seconds'] or 0 for s in recent_sessions)
        total_distractions = sum(s['distraction_events'] or 0 for s in recent_sessions)
        avg_attention = sum(s['attention_score'] or 50 for s in recent_sessions) / len(recent_sessions)
        
        suggest_break = False
        break_type = "short"  # short, medium, long
        reason = ""
        
        # Si focus depuis plus de 45 minutes
        if total_focus_time >= 45 * 60:
            suggest_break = True
            break_type = "medium"
            reason = f"Vous êtes concentré depuis {int(total_focus_time / 60)} minutes, une pause de 10-15 minutes serait bénéfique"
        
        # Si beaucoup de distractions
        elif total_distractions >= 5:
            suggest_break = True
            break_type = "short"
            reason = f"Vous avez eu {total_distractions} changements de tâches récents, une pause courte vous aidera à vous recentrer"
        
        # Si attention en baisse
        elif avg_attention < 30:
            suggest_break = True
            break_type = "medium"
            reason = f"Votre attention est faible ({int(avg_attention)}/100), une pause vous aidera à récupérer"
        
        # Si focus depuis 25 minutes (Pomodoro)
        elif total_focus_time >= 25 * 60 and total_focus_time < 45 * 60:
            suggest_break = True
            break_type = "short"
            reason = "Vous avez terminé un cycle Pomodoro (25 min), prenez une pause de 5 minutes"
        
        return {
            "suggest_break": suggest_break,
            "break_type": break_type,
            "reason": reason,
            "total_focus_minutes": int(total_focus_time / 60),
            "distraction_count": total_distractions,
            "average_attention": int(avg_attention)
        }

@router.get("/suggest-task-timing")
async def suggest_task_timing(task_id: int, current_user = Depends(get_current_user)):
    """
    Suggère le meilleur moment pour faire une tâche spécifique basé sur les patterns d'attention
    """
    user_id = current_user["user_id"] if isinstance(current_user, dict) else current_user
    
    with get_db() as cursor:
        # Vérifier que la tâche existe
        cursor.execute("""
            SELECT * FROM tasks
            WHERE id = %s AND user_id = %s
        """, (task_id, user_id))
        task = cursor.fetchone()
        
        if not task:
            return {"error": "Tâche non trouvée"}
        
        # Analyser les patterns d'attention par heure
        cursor.execute("""
            SELECT 
                context_hour,
                AVG(attention_score) as avg_score,
                COUNT(*) as session_count
            FROM attention_logs
            WHERE user_id = %s
            AND focus_start >= NOW() - INTERVAL '30 days'
            GROUP BY context_hour
            ORDER BY avg_score DESC
        """, (user_id,))
        hourly_patterns = cursor.fetchall()
        
        # Trouver les meilleures heures
        best_hours = [p['context_hour'] for p in hourly_patterns[:3] if p['avg_score'] >= 60]
        
        # Analyser le type de tâche
        estimated_time = task.get('estimated_time_minutes', 60)
        priority = task.get('priority', 'medium')
        
        # Suggérer selon le type de tâche
        if priority in ['urgent', 'high'] and estimated_time >= 60:
            # Tâche importante et longue : meilleure heure
            recommended_hours = best_hours if best_hours else [9, 10, 14, 15]
            recommendation = f"Tâche importante et longue - Faites-la pendant vos heures de productivité optimale : {', '.join(map(str, recommended_hours))}h"
        elif estimated_time <= 30:
            # Tâche courte : peut être faite n'importe quand
            recommendation = "Tâche courte - Vous pouvez la faire à tout moment, même avec une attention moyenne"
        else:
            # Tâche moyenne
            recommended_hours = best_hours[:2] if best_hours else [10, 14]
            recommendation = f"Tâche de durée moyenne - Idéale pendant : {', '.join(map(str, recommended_hours))}h"
        
        return {
            "task_id": task_id,
            "task_title": task['title'],
            "recommended_hours": best_hours if best_hours else [9, 10, 14, 15],
            "recommendation": recommendation,
            "estimated_time_minutes": estimated_time,
            "priority": priority
        }

