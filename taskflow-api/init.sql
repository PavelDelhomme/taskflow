-- 🎯 TaskFlow ADHD - INIT.SQL ULTRA SIMPLE
-- Base propre avec mot de passe 123456789

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 👥 TABLE USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📋 TABLE TASKS
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(20) DEFAULT 'medium',
    trello_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blocked_reason TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    standby_at TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 🔄 TABLE WORKFLOWS
CREATE TABLE IF NOT EXISTS workflows (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    steps TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'dev',
    project VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 📊 TABLE TASK_LOGS
CREATE TABLE IF NOT EXISTS task_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
);

-- 🧠 TABLE ATTENTION_LOGS - Mécanisme d'attention intelligent
CREATE TABLE IF NOT EXISTS attention_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    task_id INTEGER,
    focus_start TIMESTAMP NOT NULL,
    focus_end TIMESTAMP,
    focus_duration_seconds INTEGER,
    attention_score INTEGER DEFAULT 0,  -- Score 0-100
    distraction_events INTEGER DEFAULT 0,  -- Nombre de distractions/changements
    context_hour INTEGER,  -- Heure de la journée (0-23)
    context_energy_level INTEGER,  -- Niveau d'énergie si disponible (1-5)
    context_day_of_week INTEGER,  -- Jour de la semaine (0-6)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE SET NULL
);

-- 👤 Comptes initiaux — voir seed-users.sql / make seed-users / docs/UTILISATEURS.md
-- Propriétaire : Pactivisme / paveldelhomme@gmail.com
INSERT INTO users (username, email, password_hash, full_name, is_active)
VALUES (
    'Pactivisme',
    'paveldelhomme@gmail.com',
    '$2b$12$L8VzTpo9TkYXGkPuaOjVUetJsjkavui0dQ1Vh29nJPP6ClgkheJCa',
    'Paul Delhomme',
    true
) ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    is_active = true;

-- Compte démo (présentations)
INSERT INTO users (username, email, password_hash, full_name, is_active)
VALUES (
    'demo',
    'demo@taskflow.local',
    '$2b$12$CyqWWxyqmYr47fLjS.UZVe.a5VXfoxuTsuY5hAVUG6Gn1OV/FyGYG',
    'Compte Démo TaskFlow',
    true
) ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    is_active = true;

-- 🗂️ WORKFLOWS PAR DÉFAUT (utiliser make test-data pour générer plus de données)
-- Les données de test complètes sont dans generate-test-data.sql

-- 📊 INDEX PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_project ON workflows(project);
CREATE INDEX IF NOT EXISTS idx_attention_logs_user_id ON attention_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attention_logs_task_id ON attention_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_attention_logs_focus_start ON attention_logs(focus_start);

-- ✅ BASE PRÊTE !
-- Propriétaire : paveldelhomme@gmail.com (mot de passe dans .env OWNER_PASSWORD)
-- Démo : demo@taskflow.local / voir DEMO_PASSWORD dans env.example