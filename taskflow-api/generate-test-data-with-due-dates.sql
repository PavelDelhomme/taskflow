-- 🧪 Script de génération de données de test avec échéances variées
-- Ce script nettoie et recrée des tâches de test avec différentes échéances

-- 🧹 Nettoyage
DELETE FROM task_logs WHERE task_id IN (SELECT id FROM tasks WHERE user_id = 1);
DELETE FROM tasks WHERE user_id = 1;

-- 📋 TÂCHES DE TEST AVEC ÉCHÉANCES VARIÉES
-- Tâches avec date et heure complètes
INSERT INTO tasks (user_id, title, description, status, priority, trello_id, due_date, created_at) VALUES
(1, 'Réunion équipe - Sprint Planning', 'Préparer l''agenda et les points à discuter', 'todo', 'high', 'TRELLO-101', NOW() + INTERVAL '2 days' + INTERVAL '14 hours', NOW() - INTERVAL '1 day'),
(1, 'Code Review - Feature Auth', 'Revoir le code de la feature d''authentification', 'in_progress', 'medium', 'TRELLO-102', NOW() + INTERVAL '1 day' + INTERVAL '10 hours', NOW() - INTERVAL '2 days'),
(1, 'Déploiement Production', 'Déployer la version 2.0 en production', 'todo', 'urgent', 'TRELLO-103', NOW() + INTERVAL '3 days' + INTERVAL '9 hours', NOW() - INTERVAL '5 hours'),
(1, 'Documentation API', 'Rédiger la documentation de l''API REST', 'standby', 'low', 'TRELLO-104', NOW() + INTERVAL '5 days' + INTERVAL '16 hours', NOW() - INTERVAL '3 days'),
(1, 'Tests E2E - Checkout', 'Créer les tests end-to-end pour le processus de checkout', 'todo', 'medium', 'TRELLO-105', NOW() + INTERVAL '1 day' + INTERVAL '15 hours', NOW() - INTERVAL '1 day');

-- Tâches avec seulement la date (sans heure spécifique - pour la journée)
INSERT INTO tasks (user_id, title, description, status, priority, trello_id, due_date, created_at) VALUES
(1, 'Mise à jour dépendances', 'Mettre à jour les packages npm et Python', 'todo', 'medium', 'TRELLO-106', DATE(NOW() + INTERVAL '2 days'), NOW() - INTERVAL '2 days'),
(1, 'Refactoring code legacy', 'Refactoriser le code legacy du module auth', 'in_progress', 'high', 'TRELLO-107', DATE(NOW() + INTERVAL '4 days'), NOW() - INTERVAL '1 week'),
(1, 'Formation équipe - React', 'Organiser une session de formation React pour l''équipe', 'todo', 'low', 'TRELLO-108', DATE(NOW() + INTERVAL '7 days'), NOW() - INTERVAL '3 days'),
(1, 'Audit sécurité', 'Effectuer un audit de sécurité complet', 'blocked', 'urgent', 'TRELLO-109', DATE(NOW() + INTERVAL '10 days'), NOW() - INTERVAL '2 weeks'),
(1, 'Optimisation base de données', 'Optimiser les requêtes SQL et les index', 'review', 'high', 'TRELLO-110', DATE(NOW() + INTERVAL '3 days'), NOW() - INTERVAL '5 days');

-- Tâches sans échéance
INSERT INTO tasks (user_id, title, description, status, priority, trello_id, created_at) VALUES
(1, 'Améliorer UI/UX', 'Améliorer l''interface utilisateur et l''expérience', 'todo', 'medium', 'TRELLO-111', NOW() - INTERVAL '1 day'),
(1, 'Ajouter logs système', 'Implémenter un système de logging complet', 'in_progress', 'low', 'TRELLO-112', NOW() - INTERVAL '3 days'),
(1, 'Créer composants réutilisables', 'Créer une bibliothèque de composants React réutilisables', 'standby', 'medium', 'TRELLO-113', NOW() - INTERVAL '1 week'),
(1, 'Mettre en place CI/CD', 'Configurer le pipeline CI/CD avec GitHub Actions', 'todo', 'high', 'TRELLO-114', NOW() - INTERVAL '2 days'),
(1, 'Tests unitaires - Backend', 'Augmenter la couverture de tests unitaires du backend', 'review', 'medium', 'TRELLO-115', NOW() - INTERVAL '4 days');

-- Tâches terminées avec dates
INSERT INTO tasks (user_id, title, description, status, priority, trello_id, due_date, completed_at, created_at, started_at) VALUES
(1, 'Setup environnement dev', 'Configurer l''environnement de développement', 'done', 'high', 'TRELLO-116', DATE(NOW() - INTERVAL '2 days'), NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 week', NOW() - INTERVAL '5 days'),
(1, 'Créer base de données', 'Créer le schéma de base de données initial', 'done', 'urgent', 'TRELLO-117', DATE(NOW() - INTERVAL '1 day'), NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 week', NOW() - INTERVAL '3 days'),
(1, 'Implémenter authentification', 'Développer le système d''authentification JWT', 'done', 'high', 'TRELLO-118', DATE(NOW() - INTERVAL '3 days'), NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '10 days');

-- Tâches en cours avec échéances proches
INSERT INTO tasks (user_id, title, description, status, priority, trello_id, due_date, started_at, created_at) VALUES
(1, 'Fix bug critique - Login', 'Corriger le bug de connexion qui bloque les utilisateurs', 'in_progress', 'urgent', 'TRELLO-119', NOW() + INTERVAL '6 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 day'),
(1, 'Préparer présentation client', 'Préparer la présentation pour la réunion client de demain', 'in_progress', 'high', 'TRELLO-120', NOW() + INTERVAL '18 hours', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '2 days'),
(1, 'Review pull requests', 'Revoir les 5 pull requests en attente', 'in_progress', 'medium', 'TRELLO-121', NOW() + INTERVAL '1 day' + INTERVAL '8 hours', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '1 day');

-- ✅ Données de test générées avec échéances variées !

