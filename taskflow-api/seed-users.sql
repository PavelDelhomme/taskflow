-- DEPRECATED — utiliser : make seed-users (scripts/seed_users.py + variables .env)
-- Les mots de passe ne doivent plus être stockés en SQL dans Git.

UPDATE users SET is_active = false WHERE username = 'admin';
