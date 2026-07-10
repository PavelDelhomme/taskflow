-- TaskFlow — comptes propriétaire + démo (idempotent)
-- Exécuter : make seed-users

-- Propriétaire (Paul Delhomme / Pactivisme)
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

-- Compte démo (présentations — mot de passe dans env.example DEMO_PASSWORD)
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

-- Ancien compte admin par défaut — désactivé
UPDATE users SET is_active = false WHERE username = 'admin';
