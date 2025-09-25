-- taskflow-minimal/init.sql
-- 🎯 Init SQL MINIMAL - PostgreSQL
-- Juste les tables essentielles

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 👤 TABLE USERS (ultra simple)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 📋 TABLE TASKS (minimal)
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 👤 USER PAUL - PASSWORD: 123456789 (bcrypt hash)
INSERT INTO users (username, email, password_hash, full_name) 
VALUES (
    'paul',
    'paul@delhomme.ovh',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGGA31lW',
    'Paul Delhomme'
) ON CONFLICT (username) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash;

-- 📋 TÂCHE EXEMPLE
INSERT INTO tasks (user_id, title, description, status, priority) VALUES
(1, 'Test API TaskFlow', 'Tester toutes les routes avec Postman', 'todo', 'high')
ON CONFLICT DO NOTHING;