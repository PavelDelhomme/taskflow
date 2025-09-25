-- taskflow-minimal/init.sql COMPLET
-- 🎯 Support TOUTES les fonctionnalités

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 👤 TABLE USERS 
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📋 TABLE TASKS (COMPLÈTE avec toutes les colonnes)
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo', -- todo, in_progress, done, blocked, standby
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    trello_id VARCHAR(100), -- ✅ AJOUTÉ
    estimated_duration INTEGER, -- en minutes ✅ AJOUTÉ
    actual_duration INTEGER, -- temps réel en minutes ✅ AJOUTÉ
    blocked_reason TEXT, -- ✅ AJOUTÉ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP, -- ✅ AJOUTÉ
    completed_at TIMESTAMP, -- ✅ AJOUTÉ
    standby_at TIMESTAMP, -- ✅ AJOUTÉ
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 📊 TABLE TASK_LOGS (pour l'historique) ✅ AJOUTÉ
CREATE TABLE IF NOT EXISTS task_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL, -- created, updated, deleted, status_changed
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
);

-- 🔄 TABLE WORKFLOWS (pour plus tard)
CREATE TABLE IF NOT EXISTS workflows (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 👤 USER PAUL - PASSWORD: 123456789 (hash bcrypt compatible)
INSERT INTO users (username, email, password_hash, full_name) 
VALUES (
    'paul',
    'paul@delhomme.ovh',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGGA31lW',
    'Paul Delhomme'
) ON CONFLICT (username) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash;

-- 📋 TÂCHES EXEMPLES
INSERT INTO tasks (user_id, title, description, status, priority, estimated_duration) VALUES
(1, 'Test API TaskFlow', 'Tester toutes les routes avec Postman', 'todo', 'high', 30),
(1, 'Intégrer Auth JWT', 'Finaliser le système d authentification', 'in_progress', 'urgent', 60),
(1, 'Documentation API', 'Rédiger la doc pour les utilisateurs', 'todo', 'medium', 45)
ON CONFLICT DO NOTHING;