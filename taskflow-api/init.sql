-- 🎯 TaskFlow ADHD - Initialisation Database PostgreSQL
-- Création des tables et données initiales pour Paul Delhomme

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Utilisateur par défaut Paul (mot de passe: paul123)
-- Hash bcrypt pour "paul123": $2b$12$LQv3c1yqBCFcXDHJCkNOSu5f5K5K5K5K5K5K5K5K5K5K5K5K5K5K.
INSERT INTO users (username, email, hashed_password, full_name, is_active, created_at) 
VALUES (
    'paul',
    'paul@taskflow.adhd',
    '$2b$12$LQv3c1yqBCFcXDHJCkNOSu5f5K5K5K5K5K5K5K5K5K5K5K5K5K5K.',
    'Paul Delhomme',
    true,
    NOW()
) ON CONFLICT (username) DO NOTHING;

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task_id ON focus_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_created_at ON focus_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_daily_reports_user_id ON daily_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);

-- Vues utiles pour statistiques
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'in-progress' THEN 1 END) as active_tasks,
    COUNT(CASE WHEN t.status = 'blocked' THEN 1 END) as blocked_tasks,
    COALESCE(AVG(t.actual_duration), 0) as avg_task_duration,
    COALESCE(SUM(f.duration), 0) as total_focus_time
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
LEFT JOIN focus_sessions f ON u.id = f.user_id
GROUP BY u.id, u.username;