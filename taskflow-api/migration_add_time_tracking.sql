-- Migration pour ajouter le time tracking aux tâches
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_in_progress_seconds INTEGER DEFAULT 0;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tasks_time_spent ON tasks(time_spent_seconds);
CREATE INDEX IF NOT EXISTS idx_tasks_time_in_progress ON tasks(time_in_progress_seconds);

-- Fonction pour calculer automatiquement le temps passé en cours
-- Cette fonction sera appelée lors des changements de statut
COMMENT ON COLUMN tasks.time_spent_seconds IS 'Temps total passé sur la tâche en secondes';
COMMENT ON COLUMN tasks.time_in_progress_seconds IS 'Temps passé en statut "in_progress" en secondes';

