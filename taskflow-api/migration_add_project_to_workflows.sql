-- Migration: Ajouter la colonne project à la table workflows
-- Pour permettre d'associer les workflows à des projets spécifiques

ALTER TABLE workflows ADD COLUMN IF NOT EXISTS project VARCHAR(255);

-- ✅ Migration terminée !

