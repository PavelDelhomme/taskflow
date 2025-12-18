-- 🧹 Script de nettoyage des données de test
-- Ce script supprime les workflows et tâches de test (mais PAS l'utilisateur)

-- Supprimer toutes les tâches de l'utilisateur id=1
DELETE FROM task_logs WHERE task_id IN (SELECT id FROM tasks WHERE user_id = 1);
DELETE FROM tasks WHERE user_id = 1;

-- Supprimer tous les workflows de l'utilisateur id=1
DELETE FROM workflows WHERE user_id = 1;

-- ✅ Données de test supprimées (l'utilisateur est conservé) !

