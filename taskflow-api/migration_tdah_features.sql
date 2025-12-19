-- 🧠 Migration pour les fonctionnalités TDAH
-- Ce fichier ajoute toutes les tables nécessaires pour les nouvelles fonctionnalités

-- 1. SOUS-TÂCHES (Breakdown automatique)
CREATE TABLE IF NOT EXISTS subtasks (
    id SERIAL PRIMARY KEY,
    parent_task_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    order_index INTEGER DEFAULT 0,
    FOREIGN KEY (parent_task_id) REFERENCES tasks (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subtasks_parent_task ON subtasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_status ON subtasks(status);

-- 2. TEMPLATES DE TÂCHES
CREATE TABLE IF NOT EXISTS task_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    estimated_time_minutes INTEGER,
    workflow_id INTEGER,
    tags TEXT[], -- Array de tags
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT false,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (workflow_id) REFERENCES workflows (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_task_templates_user ON task_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_public ON task_templates(is_public);

-- 3. TAGS
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280', -- Couleur hex
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_tags (
    task_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (task_id, tag_id),
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_tags_task ON task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag ON task_tags(tag_id);

-- 4. NOTES ET BRAIN DUMP
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    task_id INTEGER, -- Optionnel : note liée à une tâche
    is_brain_dump BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_task ON notes(task_id);
CREATE INDEX IF NOT EXISTS idx_notes_brain_dump ON notes(is_brain_dump);

-- 5. ENERGY LEVEL TRACKING
CREATE TABLE IF NOT EXISTS energy_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 5),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_energy_logs_user ON energy_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_logs_timestamp ON energy_logs(timestamp);

-- 6. USER ACHIEVEMENTS (Gamification)
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    achievement_type VARCHAR(100) NOT NULL, -- 'task_completed', 'streak_days', 'time_tracked', etc.
    achievement_value INTEGER DEFAULT 0,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB, -- Données supplémentaires
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);

-- 7. VUES SAUVEGARDÉES (Saved Views)
CREATE TABLE IF NOT EXISTS saved_views (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    filters JSONB NOT NULL, -- {status: ['todo'], tags: ['urgent'], project: 'TaskFlow'}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saved_views_user ON saved_views(user_id);

-- 8. PAUSES STRUCTURÉES
CREATE TABLE IF NOT EXISTS breaks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    break_type VARCHAR(50) DEFAULT 'short', -- 'short', 'long', 'lunch'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    activity_suggestion VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_breaks_user ON breaks(user_id);
CREATE INDEX IF NOT EXISTS idx_breaks_started ON breaks(started_at);

-- 9. RAPPELS CONTEXTUELS
CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    task_id INTEGER,
    reminder_type VARCHAR(50) NOT NULL, -- 'due_date', 'blocked_days', 'custom'
    reminder_time TIMESTAMP NOT NULL,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP,
    snooze_count INTEGER DEFAULT 0,
    snooze_until TIMESTAMP,
    context_data JSONB, -- Données contextuelles (localisation, heure, etc.)
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_task ON reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_reminders_sent ON reminders(is_sent);

-- 10. Ajouter colonnes manquantes à la table tasks
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS parent_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_estimated_time ON tasks(estimated_time_minutes);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);

COMMENT ON COLUMN tasks.estimated_time_minutes IS 'Temps estimé en minutes pour compléter la tâche';
COMMENT ON COLUMN tasks.parent_task_id IS 'ID de la tâche parente si cette tâche est une sous-tâche';

-- ✅ Migration terminée !

