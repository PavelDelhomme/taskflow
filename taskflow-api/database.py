import sqlite3
import os
from contextlib import contextmanager

DATABASE = "/app/data/taskflow.db"

@contextmanager
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    os.makedirs("/app/data", exist_ok=True)
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'todo',
                priority TEXT DEFAULT 'medium',
                trello_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                blocked_reason TEXT,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                standby_at TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            
            CREATE TABLE IF NOT EXISTS task_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                details TEXT,
                FOREIGN KEY (task_id) REFERENCES tasks (id)
            );
            
            CREATE TABLE IF NOT EXISTS workflows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                steps TEXT NOT NULL,
                category TEXT DEFAULT 'dev',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
        """)
        
        # Créer utilisateur Paul avec mot de passe sécurisé
        try:
            password_hash = "sha256$aa+qb6XJ9lrOlR1zGCcqUqI6PkT9mhhkBhOTRSP039Q=$b2a06b2d19777fb4151ea69be5b9da909db126ad6eaa95069b3301b251bf59b7"
            
            cursor = conn.execute("""
                INSERT INTO users (username, email, password_hash, full_name) 
                VALUES (?, ?, ?, ?)
            """, ("paul", "paul@delhomme.ovh", password_hash, "Paul Delhomme"))
            
            user_id = cursor.lastrowid
            
            # Ajouter workflows par défaut
            workflows = [
                ("Pré développement", """1. Vérifie la tâche assignée sur Trello (MEP Tech/backlog/sprint)
2. Copie l'ID du ticket Trello dans TaskFlow
3. Crée une nouvelle branche propre depuis dev  
4. Installe les dépendances si besoin: composer install
5. Met à jour README si fonctionnalité majeure
6. Déplace la carte Trello en "En cours" """, "dev"),
                
                ("Pendant développement", """1. Avance le ticket Trello selon l'état
2. Met à jour TaskFlow avec même statut
3. Développe la feature/correctif
4. Lance les tests automatisés localement
5. Met à jour l'avancement pour le Daily 11h
6. Documente les blocages rencontrés""", "dev"),
                
                ("Pré Pull Request", """1. Synchronise avec dev (git merge/rebase origin/dev)
2. Vérifie le nom du commit (feat:, fix:, hotfix:)
3. Lance tous les tests (Playwright, PHPUnit, PHPStan, PHPCS)
4. Crée la PR (feat/branch → dev)
5. Ajoute le lien PR en pièce jointe Trello + TaskFlow
6. Déplace carte en "Merge Request"
7. Rédige description claire de la PR""", "git"),
                
                ("Post Merge", """1. Pull la branche dev localement
2. Vérifie le déploiement CI/CD
3. Relance tests end-to-end si nécessaire
4. Déplace carte Trello (Test/Done)
5. Met TaskFlow en Done aussi
6. Prévient l'équipe si impact sur leur périmètre
7. Nettoie la branche feature locale""", "git"),
                
                ("Checklist Quotidienne", """1. Vérifier les Logs de Brevo pour emails bloqués
2. Débloquer tous les mails non piter.at
3. Analyser si tout fonctionne bien
4. Vérifier les filtres Brevo
5. Contrôler les contrats et déblocages
6. Daily meeting 11h - Préparer avancement
7. Synchroniser TaskFlow ↔ Trello""", "daily"),
                
                ("Rappel Tickets", """🎯 AUCUNE TÂCHE ACTIVE - Actions à faire:

1. Aller sur Trello → Colonne "Tests-Auto"
2. Prendre un ticket de test automatisé
3. Copier l'ID Trello dans TaskFlow
4. OU Aller sur "MEP Tech" → Prendre nouvelle feature
5. OU Contacter collègue sur tâche partagée pour aider
6. OU Reprendre tâche en standby si déblocage possible

⚠️ Ne JAMAIS rester sans tâche active !""", "reminder")
            ]
            
            for name, steps, category in workflows:
                conn.execute(
                    "INSERT INTO workflows (user_id, name, steps, category) VALUES (?, ?, ?, ?)",
                    (user_id, name, steps, category)
                )
                
            conn.commit()
        except sqlite3.IntegrityError:
            pass
