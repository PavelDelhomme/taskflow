-- 🎯 TaskFlow ADHD - Initialisation Database PostgreSQL
-- Création des tables et données initiales pour Paul Delhomme

-- Extension pour UUID (optionnel)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table tasks
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
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Table task_logs
CREATE TABLE IF NOT EXISTS task_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks (id)
);

-- Table workflows
CREATE TABLE IF NOT EXISTS workflows (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    steps TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'dev',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Utilisateur Paul par défaut (mot de passe: 2H8'Z&sx@QW+X=v,dz[tnsv$F)
INSERT INTO users (username, email, password_hash, full_name) 
VALUES (
    'paul',
    'paul@delhomme.ovh',
    '$2b$12$1LP40ZcJF3l5fVZr6GP03.EVY5cWT.tmkhY3OEan7ru9gNiKQrJqu',
    --'sha256$21r/ZKinWsqomWTp+YCEF9R3HRbiMy0cJWJqW+vMD5g=$cce99d6df4b9bd7dcf9cda39532ca1f6f405dd355631c5f7b886e286eab6b87f',
    'Paul Delhomme'
) ON CONFLICT (username) DO NOTHING;

-- Workflows par défaut pour Paul
INSERT INTO workflows (user_id, name, steps, category) 
SELECT 1, 'Pré développement', 
'1. Vérifie la tâche assignée sur Trello (MEP Tech/backlog/sprint)
2. Copie l''ID du ticket Trello dans TaskFlow
3. Crée une nouvelle branche propre depuis dev  
4. Installe les dépendances si besoin: composer install
5. Met à jour README si fonctionnalité majeure
6. Déplace la carte Trello en "En cours"', 'dev'
WHERE NOT EXISTS (SELECT 1 FROM workflows WHERE name = 'Pré développement' AND user_id = 1);

INSERT INTO workflows (user_id, name, steps, category) 
SELECT 1, 'Pendant développement', 
'1. Avance le ticket Trello selon l''état
2. Met à jour TaskFlow avec même statut
3. Développe la feature/correctif
4. Lance les tests automatisés localement
5. Met à jour l''avancement pour le Daily 11h
6. Documente les blocages rencontrés', 'dev'
WHERE NOT EXISTS (SELECT 1 FROM workflows WHERE name = 'Pendant développement' AND user_id = 1);

INSERT INTO workflows (user_id, name, steps, category) 
SELECT 1, 'Pré Pull Request', 
'1. Synchronise avec dev (git merge/rebase origin/dev)
2. Vérifie le nom du commit (feat:, fix:, hotfix:)
3. Lance tous les tests (Playwright, PHPUnit, PHPStan, PHPCS)
4. Crée la PR (feat/branch → dev)
5. Ajoute le lien PR en pièce jointe Trello + TaskFlow
6. Déplace carte en "Merge Request"
7. Rédige description claire de la PR', 'git'
WHERE NOT EXISTS (SELECT 1 FROM workflows WHERE name = 'Pré Pull Request' AND user_id = 1);

INSERT INTO workflows (user_id, name, steps, category) 
SELECT 1, 'Post Merge', 
'1. Pull la branche dev localement
2. Vérifie le déploiement CI/CD
3. Relance tests end-to-end si nécessaire
4. Déplace carte Trello (Test/Done)
5. Met TaskFlow en Done aussi
6. Prévient l''équipe si impact sur leur périmètre
7. Nettoie la branche feature locale', 'git'
WHERE NOT EXISTS (SELECT 1 FROM workflows WHERE name = 'Post Merge' AND user_id = 1);

INSERT INTO workflows (user_id, name, steps, category) 
SELECT 1, 'Checklist Quotidienne', 
'1. Vérifier les Logs de Brevo pour emails bloqués
2. Débloquer tous les mails non piter.at
3. Analyser si tout fonctionne bien
4. Vérifier les filtres Brevo
5. Contrôler les contrats et déblocages
6. Daily meeting 11h - Préparer avancement
7. Synchroniser TaskFlow ↔ Trello', 'daily'
WHERE NOT EXISTS (SELECT 1 FROM workflows WHERE name = 'Checklist Quotidienne' AND user_id = 1);

INSERT INTO workflows (user_id, name, steps, category) 
SELECT 1, 'Rappel Tickets', 
'🎯 AUCUNE TÂCHE ACTIVE - Actions à faire:

1. Aller sur Trello → Colonne "Tests-Auto"
2. Prendre un ticket de test automatisé
3. Copier l''ID Trello dans TaskFlow
4. OU Aller sur "MEP Tech" → Prendre nouvelle feature
5. OU Contacter collègue sur tâche partagée pour aider
6. OU Reprendre tâche en standby si déblocage possible

⚠️ Ne JAMAIS rester sans tâche active !', 'reminder'
WHERE NOT EXISTS (SELECT 1 FROM workflows WHERE name = 'Rappel Tickets' AND user_id = 1);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);