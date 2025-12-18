-- Migration: Ajouter la colonne deleted_at à la table tasks
-- Pour permettre le soft delete des tâches

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- ✅ Migration terminée !

