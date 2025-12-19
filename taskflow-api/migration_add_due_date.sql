-- Migration pour ajouter la colonne due_date à la table tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;

-- Index pour améliorer les performances des requêtes de tri
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- ✅ Migration terminée !

