-- 🧪 Script de génération de données de test
-- Ce script ajoute des workflows et tâches de test pour l'utilisateur avec id=1

-- 🗂️ WORKFLOWS DE TEST
INSERT INTO workflows (user_id, name, steps, category, project) VALUES
(1, 'Dev Basic', '1. Analyser le ticket
2. Créer branche
3. Développer
4. Tester
5. Pull Request', 'dev', 'TaskFlow')
ON CONFLICT DO NOTHING;

INSERT INTO workflows (user_id, name, steps, category, project) VALUES
(1, 'Daily Workflow', '1. Check emails
2. Daily 11h
3. Update Trello
4. TaskFlow sync', 'daily', 'Général')
ON CONFLICT DO NOTHING;

INSERT INTO workflows (user_id, name, steps, category, project) VALUES
(1, 'Bug Fix', '1. Reproduire le bug
2. Analyser la cause
3. Fixer
4. Tester
5. Déployer', 'bugfix', 'TaskFlow')
ON CONFLICT DO NOTHING;

INSERT INTO workflows (user_id, name, steps, category, project) VALUES
(1, 'Feature Development', '1. Analyser les besoins
2. Créer la branche feature/
3. Développer la feature
4. Tests unitaires
5. Code review
6. Merge en develop', 'dev', 'TaskFlow')
ON CONFLICT DO NOTHING;

INSERT INTO workflows (user_id, name, steps, category, project) VALUES
(1, 'Hotfix', '1. Identifier le problème critique
2. Créer branche hotfix/
3. Corriger rapidement
4. Tests de régression
5. Déployer en prod
6. Merge en main et develop', 'bugfix', 'Production')
ON CONFLICT DO NOTHING;

INSERT INTO workflows (user_id, name, steps, category, project) VALUES
(1, 'Code Review', '1. Lire le code attentivement
2. Vérifier la logique
3. Tester localement si besoin
4. Donner feedback constructif
5. Approuver ou demander modifications', 'dev', 'Général')
ON CONFLICT DO NOTHING;

INSERT INTO workflows (user_id, name, steps, category, project) VALUES
(1, 'Deployment', '1. Vérifier les tests
2. Mettre à jour la version
3. Créer le tag git
4. Build de production
5. Déployer sur staging
6. Tests de validation
7. Déployer en production
8. Monitoring post-déploiement', 'dev', 'Production')
ON CONFLICT DO NOTHING;

INSERT INTO workflows (user_id, name, steps, category, project) VALUES
(1, 'Refactoring', '1. Identifier le code à refactorer
2. Créer branche refactor/
3. Écrire les tests
4. Refactorer progressivement
5. Vérifier que les tests passent
6. Code review
7. Merge', 'dev', 'TaskFlow')
ON CONFLICT DO NOTHING;

-- 📋 TÂCHES DE TEST - TOUS LES STATUTS

-- Tâches EN COURS (in_progress)
INSERT INTO tasks (user_id, title, description, status, priority, trello_id, started_at) VALUES
(1, 'Setup API TaskFlow', 'Configuration complète API avec routes auth + tasks', 'in_progress', 'high', 'TASK-001', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, started_at) VALUES
(1, 'Améliorer design frontend', 'Moderniser l''interface utilisateur avec un design plus récent', 'in_progress', 'high', 'TASK-003', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, started_at) VALUES
(1, 'Intégrer notifications push', 'Système de notifications en temps réel', 'in_progress', 'high', NULL, NOW() - INTERVAL '3 hours')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, started_at) VALUES
(1, 'Implémenter système de tags', 'Ajouter un système de tags pour organiser les tâches', 'in_progress', 'medium', 'TASK-011', NOW() - INTERVAL '5 hours')
ON CONFLICT DO NOTHING;

-- Tâches À FAIRE (todo)
INSERT INTO tasks (user_id, title, description, status, priority, trello_id) VALUES
(1, 'Test Postman', 'Créer collection Postman pour toutes les routes API', 'todo', 'medium', 'TASK-002')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id) VALUES
(1, 'Doc API', 'Documenter toutes les routes avec Swagger/FastAPI', 'todo', 'low', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id) VALUES
(1, 'Ajouter tests unitaires', 'Créer des tests pour les routes API principales', 'todo', 'medium', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id) VALUES
(1, 'Configurer CI/CD', 'Mettre en place le pipeline de déploiement automatique', 'todo', 'high', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id) VALUES
(1, 'Ajouter authentification OAuth', 'Implémenter OAuth2 pour connexion Google/GitHub', 'todo', 'high', 'TASK-008')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id) VALUES
(1, 'Migration base de données', 'Migrer vers PostgreSQL 16 avec nouvelles fonctionnalités', 'todo', 'low', 'TASK-010')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id) VALUES
(1, 'Créer page de statistiques', 'Page avec graphiques et métriques des tâches', 'todo', 'medium', 'TASK-012')
ON CONFLICT DO NOTHING;

-- Tâches EN STANDBY (standby)
INSERT INTO tasks (user_id, title, description, status, priority, trello_id, standby_at) VALUES
(1, 'Optimiser requêtes DB', 'Améliorer les performances des requêtes SQL', 'standby', 'low', 'TASK-006', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, standby_at) VALUES
(1, 'Refactoring composants React', 'Réorganiser les composants pour meilleure structure', 'standby', 'medium', 'TASK-013', NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, standby_at) VALUES
(1, 'Ajouter thème personnalisé', 'Permettre aux utilisateurs de personnaliser les couleurs', 'standby', 'low', NULL, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, standby_at) VALUES
(1, 'Implémenter export PDF', 'Fonctionnalité pour exporter les rapports en PDF', 'standby', 'medium', 'TASK-014', NOW() - INTERVAL '1 week')
ON CONFLICT DO NOTHING;

-- Tâches BLOQUÉES (blocked)
INSERT INTO tasks (user_id, title, description, status, priority, trello_id, blocked_reason) VALUES
(1, 'Refactoring code', 'Nettoyer et réorganiser le code pour meilleure maintenabilité', 'blocked', 'medium', 'TASK-007', 'En attente de validation de l''architecture')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, blocked_reason) VALUES
(1, 'Intégration API externe', 'Intégrer avec l''API Trello pour synchronisation', 'blocked', 'high', 'TASK-015', 'En attente des credentials API')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, blocked_reason) VALUES
(1, 'Déploiement production', 'Mettre en production l''application complète', 'blocked', 'urgent', 'TASK-016', 'En attente de validation sécurité')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, blocked_reason) VALUES
(1, 'Migration données', 'Migrer les données existantes vers nouvelle structure', 'blocked', 'high', NULL, 'Dépendance avec la tâche de refactoring')
ON CONFLICT DO NOTHING;

-- Tâches EN REVIEW (review)
INSERT INTO tasks (user_id, title, description, status, priority, trello_id) VALUES
(1, 'Créer dashboard analytics', 'Dashboard avec statistiques et graphiques des tâches', 'review', 'medium', 'TASK-009')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id) VALUES
(1, 'Implémenter recherche avancée', 'Système de recherche avec filtres multiples', 'review', 'high', 'TASK-017')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id) VALUES
(1, 'Ajouter système de commentaires', 'Permettre d''ajouter des commentaires aux tâches', 'review', 'medium', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id) VALUES
(1, 'Optimiser performances frontend', 'Réduire le temps de chargement des pages', 'review', 'medium', 'TASK-018')
ON CONFLICT DO NOTHING;

-- Tâches TERMINÉES (done)
INSERT INTO tasks (user_id, title, description, status, priority, trello_id, completed_at) VALUES
(1, 'Implémenter workflows', 'Ajouter la gestion complète des workflows avec projets', 'done', 'medium', 'TASK-004', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, completed_at) VALUES
(1, 'Corriger bugs CORS', 'Résoudre les problèmes de CORS entre frontend et backend', 'done', 'urgent', 'TASK-005', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, completed_at) VALUES
(1, 'Créer système d''authentification', 'Implémenter login/register avec JWT', 'done', 'high', 'TASK-019', NOW() - INTERVAL '1 week')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, completed_at) VALUES
(1, 'Configurer Docker Compose', 'Mettre en place l''environnement Docker complet', 'done', 'high', NULL, NOW() - INTERVAL '2 weeks')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, completed_at) VALUES
(1, 'Créer page d''accueil', 'Design et développement de la page d''accueil', 'done', 'medium', 'TASK-020', NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, completed_at) VALUES
(1, 'Implémenter mode sombre', 'Ajouter le thème sombre à l''application', 'done', 'low', NULL, NOW() - INTERVAL '4 days')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, completed_at) VALUES
(1, 'Ajouter notifications toast', 'Système de notifications toast pour feedback utilisateur', 'done', 'medium', 'TASK-021', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Tâches supplémentaires pour avoir plus de variété
INSERT INTO tasks (user_id, title, description, status, priority, trello_id, created_at) VALUES
(1, 'Créer composant Button réutilisable', 'Composant Button avec variants et sizes', 'todo', 'medium', 'TASK-022', NOW() - INTERVAL '10 days'),
(1, 'Implémenter pagination', 'Système de pagination pour les listes de tâches', 'todo', 'low', NULL, NOW() - INTERVAL '8 days'),
(1, 'Ajouter filtres avancés', 'Filtres par date, priorité, statut combinés', 'todo', 'high', 'TASK-023', NOW() - INTERVAL '6 days'),
(1, 'Créer système de tags', 'Permettre d''ajouter des tags aux tâches', 'todo', 'medium', NULL, NOW() - INTERVAL '4 days'),
(1, 'Optimiser images', 'Compresser et optimiser les images du projet', 'todo', 'low', 'TASK-024', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, started_at, created_at) VALUES
(1, 'Refactoriser composants modaux', 'Unifier tous les modaux en un composant réutilisable', 'in_progress', 'high', 'TASK-025', NOW() - INTERVAL '1 day', NOW() - INTERVAL '5 days'),
(1, 'Ajouter animations transitions', 'Animations fluides pour les transitions de pages', 'in_progress', 'medium', NULL, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 days'),
(1, 'Implémenter drag and drop', 'Permettre de réorganiser les tâches par drag and drop', 'in_progress', 'high', 'TASK-026', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 day'),
(1, 'Créer système de templates', 'Templates de tâches réutilisables', 'in_progress', 'medium', NULL, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, standby_at, created_at) VALUES
(1, 'Intégrer API externe météo', 'Afficher la météo dans le dashboard', 'standby', 'low', 'TASK-027', NOW() - INTERVAL '4 days', NOW() - INTERVAL '12 days'),
(1, 'Créer système de backup automatique', 'Backup quotidien des données', 'standby', 'medium', NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '15 days'),
(1, 'Ajouter mode hors ligne', 'Fonctionnalité offline avec sync', 'standby', 'high', 'TASK-028', NOW() - INTERVAL '2 days', NOW() - INTERVAL '9 days'),
(1, 'Implémenter cache Redis', 'Mise en cache pour améliorer les performances', 'standby', 'medium', NULL, NOW() - INTERVAL '8 days', NOW() - INTERVAL '20 days'),
(1, 'Créer système de notifications email', 'Envoyer des emails pour les rappels', 'standby', 'low', 'TASK-029', NOW() - INTERVAL '3 days', NOW() - INTERVAL '11 days')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, blocked_reason, created_at) VALUES
(1, 'Migration vers nouvelle architecture', 'Refonte complète de l''architecture backend', 'blocked', 'urgent', 'TASK-030', 'En attente de validation de l''équipe technique', NOW() - INTERVAL '5 days'),
(1, 'Intégration avec service tiers', 'Intégration avec un service externe', 'blocked', 'high', NULL, 'En attente des credentials API', NOW() - INTERVAL '3 days'),
(1, 'Déploiement sur serveur de prod', 'Mise en production de l''application', 'blocked', 'urgent', 'TASK-031', 'En attente de validation sécurité', NOW() - INTERVAL '7 days'),
(1, 'Migration données utilisateurs', 'Migrer les données vers nouvelle structure', 'blocked', 'high', NULL, 'Dépendance avec la tâche de migration', NOW() - INTERVAL '4 days'),
(1, 'Mise à jour dépendances critiques', 'Mise à jour des dépendances avec breaking changes', 'blocked', 'medium', 'TASK-032', 'En attente de tests de régression', NOW() - INTERVAL '6 days')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, created_at) VALUES
(1, 'Code review PR #123', 'Review de la pull request pour nouvelle feature', 'review', 'high', 'TASK-033', NOW() - INTERVAL '1 day'),
(1, 'Validation design système', 'Valider le nouveau design system', 'review', 'medium', NULL, NOW() - INTERVAL '2 days'),
(1, 'Tests d''intégration API', 'Tests end-to-end de l''API complète', 'review', 'high', 'TASK-034', NOW() - INTERVAL '3 days'),
(1, 'Audit sécurité application', 'Audit complet de sécurité', 'review', 'urgent', NULL, NOW() - INTERVAL '4 days'),
(1, 'Review documentation technique', 'Vérifier et valider la documentation', 'review', 'low', 'TASK-035', NOW() - INTERVAL '5 days'),
(1, 'Validation UX/UI', 'Valider les nouvelles interfaces utilisateur', 'review', 'medium', NULL, NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, priority, trello_id, completed_at, created_at) VALUES
(1, 'Setup environnement dev', 'Configuration complète de l''environnement de développement', 'done', 'high', NULL, NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '1 month'),
(1, 'Créer structure projet', 'Initialisation de la structure du projet', 'done', 'high', 'TASK-036', NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '1 month'),
(1, 'Configurer Git hooks', 'Mise en place des hooks Git pour qualité code', 'done', 'medium', NULL, NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '3 weeks'),
(1, 'Créer README complet', 'Documentation complète du projet', 'done', 'low', 'TASK-037', NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '3 weeks'),
(1, 'Setup CI/CD basique', 'Configuration initiale du pipeline CI/CD', 'done', 'high', NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 weeks'),
(1, 'Créer logo application', 'Design et création du logo TaskFlow', 'done', 'low', 'TASK-038', NOW() - INTERVAL '8 days', NOW() - INTERVAL '12 days'),
(1, 'Implémenter système de logs', 'Système de logging structuré', 'done', 'medium', NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '10 days'),
(1, 'Créer page 404 personnalisée', 'Page d''erreur 404 avec design cohérent', 'done', 'low', 'TASK-039', NOW() - INTERVAL '4 days', NOW() - INTERVAL '8 days'),
(1, 'Ajouter favicon', 'Création et intégration du favicon', 'done', 'low', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '6 days')
ON CONFLICT DO NOTHING;

-- ✅ Données de test générées !

