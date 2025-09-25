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
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 🔄 TABLE WORKFLOWS
CREATE TABLE IF NOT EXISTS workflows (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    steps TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'dev',
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

-- 👤 UTILISATEUR PAUL - PASSWORD SIMPLE: 123456789
INSERT INTO users (username, email, password_hash, full_name) 
VALUES (
    'paul',
    'paul@delhomme.ovh',
    '$2b$12$LQv3c1yqBCFcXDHJCkNOSu.dVhTq7Z4Hk9TG3p8Lz9U2K5M6N7O8Q9',
    'Paul Delhomme'
) ON CONFLICT (username) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

-- 🗂️ WORKFLOWS PAR DÉFAUT
INSERT INTO workflows (user_id, name, steps, category) VALUES
(1, 'Dev Basic', '1. Analyser le ticket\n2. Créer branche\n3. Développer\n4. Tester\n5. Pull Request', 'dev'),
(1, 'Daily Workflow', '1. Check emails\n2. Daily 11h\n3. Update Trello\n4. TaskFlow sync', 'daily'),
(1, 'Bug Fix', '1. Reproduire le bug\n2. Analyser la cause\n3. Fixer\n4. Tester\n5. Déployer', 'bugfix')
ON CONFLICT DO NOTHING;

-- 📋 TÂCHES EXEMPLES
INSERT INTO tasks (user_id, title, description, status, priority) VALUES
(1, 'Setup API TaskFlow', 'Configuration complète API avec routes auth + tasks', 'in_progress', 'high'),
(1, 'Test Postman', 'Créer collection Postman pour toutes les routes API', 'todo', 'medium'),
(1, 'Doc API', 'Documenter toutes les routes avec Swagger/FastAPI', 'todo', 'low')
ON CONFLICT DO NOTHING;

-- 📊 INDEX PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);

-- ✅ BASE PRÊTE !
-- Login: paul@delhomme.ovh / 123456789