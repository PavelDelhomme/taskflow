-- Migration pour ajouter la colonne project à la table tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS project VARCHAR(255);

-- Créer un index pour améliorer les performances de filtrage par projet
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project);

COMMENT ON COLUMN tasks.project IS 'Projet associé à la tâche';

