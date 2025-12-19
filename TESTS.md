# 🧪 Guide de Tests - TaskFlow ADHD

Ce document décrit tous les tests à effectuer pour vérifier que l'application fonctionne correctement.

## 📋 Prérequis

1. Démarrer l'application : `make start` ou `make up`
2. Appliquer les migrations : `make migrate`
3. Générer les données de test : `make test-data-due-dates`
4. Accéder à l'application : http://localhost:4000

## 🔐 Tests d'Authentification

### Test 1 : Connexion
- [ ] Ouvrir http://localhost:4000
- [ ] Vérifier que la page de connexion s'affiche
- [ ] Se connecter avec le compte de test :
  - Email : `test@delhomme.ovh`
  - Mot de passe : `2H8'Z&sx@QW+X=v,dz[tnsv$F`
- [ ] Vérifier que la connexion fonctionne et redirige vers le tableau de bord

### Test 2 : Inscription
- [ ] Cliquer sur "S'inscrire"
- [ ] Remplir le formulaire d'inscription
- [ ] Vérifier que l'inscription fonctionne
- [ ] Se connecter avec le nouveau compte

### Test 3 : Déconnexion
- [ ] Cliquer sur le bouton de déconnexion (menu utilisateur)
- [ ] Vérifier que la déconnexion fonctionne et redirige vers la page de connexion

## 📝 Tests de Gestion des Tâches

### Test 4 : Création de Tâche
- [ ] Cliquer sur le FAB (Floating Action Button) ➕
- [ ] Sélectionner "Nouvelle tâche"
- [ ] Remplir le formulaire :
  - Titre : "Test tâche"
  - Description : "Description de test"
  - Priorité : "Haute"
  - Projet : "TaskFlow"
  - Date à faire : Date et heure future
- [ ] Cliquer sur "Créer"
- [ ] Vérifier que la tâche apparaît dans la colonne "À faire"

### Test 5 : Affichage des Dates par Statut
- [ ] Vérifier que les tâches "À faire" affichent la date "À faire" ou "Créée"
- [ ] Passer une tâche en "En cours"
- [ ] Vérifier qu'elle affiche "Démarrée" avec la date de démarrage
- [ ] Mettre une tâche en "Standby"
- [ ] Vérifier qu'elle affiche "En standby" avec la date
- [ ] Bloquer une tâche
- [ ] Vérifier qu'elle affiche "Créée" avec la date
- [ ] Mettre une tâche en "Review"
- [ ] Vérifier qu'elle affiche "Créée" avec la date
- [ ] Terminer une tâche
- [ ] Vérifier qu'elle affiche "Terminée" avec la date de complétion

### Test 6 : Modification de Tâche
- [ ] Cliquer sur une tâche pour ouvrir la modal de détails
- [ ] Cliquer sur "Modifier"
- [ ] Modifier le titre, la description, la priorité, le projet, la date à faire
- [ ] Cliquer sur "Sauvegarder"
- [ ] Vérifier que les modifications sont appliquées

### Test 7 : Actions sur les Tâches
- [ ] Tester "Reprendre" sur une tâche en standby/bloquée
- [ ] Tester "Terminer" sur une tâche en cours
- [ ] Tester "Bloquer" et vérifier que la modal de raison s'affiche
- [ ] Tester "Standby" sur une tâche en cours
- [ ] Tester "En Review" sur une tâche en cours
- [ ] Tester "Supprimer" et vérifier la confirmation

### Test 8 : Filtrage et Affichage
- [ ] Vérifier que les colonnes peuvent être réduites/étendues (clic sur le header)
- [ ] Vérifier que le "Voir moins" fonctionne dans la colonne "Terminé"
- [ ] Vérifier que "... et X autres" fonctionne pour afficher toutes les tâches

## 📋 Tests de Workflows

### Test 9 : Création de Workflow
- [ ] Cliquer sur "Workflows" dans le FAB ou la navbar
- [ ] Cliquer sur "Créer un workflow"
- [ ] Remplir le formulaire :
  - Nom : "Test Workflow"
  - Projet : "TaskFlow"
  - Catégorie : "Dev"
  - Étapes : Ajouter plusieurs étapes en appuyant sur Entrée
- [ ] Vérifier que les boutons "×" permettent de supprimer des étapes
- [ ] Cliquer sur "Créer"
- [ ] Vérifier que le workflow apparaît dans la liste

### Test 10 : Modification de Workflow
- [ ] Cliquer sur le bouton ✏️ d'un workflow
- [ ] Modifier le nom, le projet, la catégorie, les étapes
- [ ] Cliquer sur "Modifier"
- [ ] Vérifier que les modifications sont appliquées

### Test 11 : Suppression de Workflow
- [ ] Cliquer sur le bouton 🗑️ d'un workflow
- [ ] Confirmer la suppression
- [ ] Vérifier que le workflow est supprimé

## 📅 Tests du Calendrier

### Test 12 : Affichage du Calendrier
- [ ] Cliquer sur "Calendrier" dans le FAB ou la navbar
- [ ] Vérifier que le calendrier s'affiche
- [ ] Tester les vues "Mois", "4 Jours", "Jour"
- [ ] Cliquer sur "Aujourd'hui" et vérifier que la date actuelle est sélectionnée

### Test 13 : Interaction avec le Calendrier
- [ ] Cliquer sur une journée dans la vue "Mois"
- [ ] Vérifier que les tâches de cette journée s'affichent
- [ ] Cliquer sur une tâche dans la vue "4 Jours"
- [ ] Vérifier que la modal de détails s'affiche au-dessus du calendrier (z-index correct)
- [ ] Cliquer sur une tâche dans la vue "Jour"
- [ ] Vérifier que la modal de détails s'affiche

### Test 14 : Navigation dans le Calendrier
- [ ] Utiliser les flèches ‹ et › pour naviguer
- [ ] Vérifier que la navigation fonctionne dans toutes les vues
- [ ] Vérifier que les échéances sont bien affichées

## 📁 Tests de Vue par Projet

### Test 15 : Vue par Projet
- [ ] Cliquer sur "Projets" dans la navbar
- [ ] Vérifier que la modal s'affiche
- [ ] Sélectionner un projet dans le filtre
- [ ] Vérifier que seules les tâches de ce projet s'affichent
- [ ] Sélectionner "Tous les projets"
- [ ] Vérifier que toutes les tâches s'affichent

## ⚡ Tests de Rapport Actuel

### Test 16 : Rapport Actuel
- [ ] Cliquer sur "Actuel" dans la navbar
- [ ] Vérifier que la modal s'affiche avec :
  - Les tâches en cours avec temps
  - Les tâches terminées aujourd'hui
  - La vue par projet
- [ ] Vérifier que les temps sont affichés correctement

## ⏱️ Tests de Time Tracking

### Test 17 : Time Tracking Continu
- [ ] Démarrer une tâche (passer en "En cours")
- [ ] Attendre 1-2 minutes
- [ ] Vérifier que le temps s'incrémente automatiquement
- [ ] Vérifier dans la modal de détails que le temps est mis à jour
- [ ] Mettre la tâche en "Standby"
- [ ] Vérifier que le temps est enregistré
- [ ] Terminer la tâche
- [ ] Vérifier que le temps total est affiché

## 📊 Tests de Rapports

### Test 18 : Daily Summary
- [ ] Cliquer sur "Daily Summary" dans le FAB
- [ ] Vérifier que le résumé quotidien s'affiche
- [ ] Cliquer sur "Copier"
- [ ] Vérifier que le texte est copié dans le presse-papiers

### Test 19 : Weekly Summary
- [ ] Cliquer sur "Weekly Summary" dans le FAB
- [ ] Vérifier que le résumé hebdomadaire s'affiche
- [ ] Cliquer sur "Copier"
- [ ] Vérifier que le texte est copié dans le presse-papiers

## 🗑️ Tests de Corbeille

### Test 20 : Corbeille
- [ ] Supprimer une tâche
- [ ] Cliquer sur "Corbeille" dans la navbar
- [ ] Vérifier que la tâche supprimée apparaît
- [ ] Tester "Restaurer" sur une tâche
- [ ] Vérifier que la tâche réapparaît dans les colonnes
- [ ] Tester "Supprimer définitivement"
- [ ] Vérifier que la tâche est supprimée définitivement

## 🎨 Tests d'Interface

### Test 21 : Mode Sombre/Clair
- [ ] Cliquer sur le bouton de mode sombre/clair
- [ ] Vérifier que le thème change
- [ ] Vérifier que toutes les pages s'adaptent au thème
- [ ] Vérifier que le calendrier s'adapte au thème

### Test 22 : Responsive Design
- [ ] Réduire la fenêtre du navigateur
- [ ] Vérifier que le menu dropdown s'affiche pour les actions navbar
- [ ] Vérifier que le FAB est visible et fonctionnel
- [ ] Vérifier que les colonnes s'adaptent à la taille de l'écran
- [ ] Vérifier que le calendrier passe en vue "4 Jours" par défaut sur petit écran

### Test 23 : Notifications
- [ ] Autoriser les notifications dans le navigateur
- [ ] Vérifier que les notifications s'affichent pour :
  - Création de tâche
  - Terminaison de tâche
  - Blocage de tâche
  - Standby de tâche
  - Rappel de nouveau ticket

## 🔍 Tests de Validation

### Test 24 : Validation des Formulaires
- [ ] Essayer de créer une tâche sans titre → Vérifier que le bouton est désactivé
- [ ] Essayer de créer un workflow sans nom → Vérifier que le bouton est désactivé
- [ ] Essayer de créer un workflow sans étapes → Vérifier que le bouton est désactivé

### Test 25 : Gestion des Erreurs
- [ ] Déconnecter l'API (arrêter le conteneur)
- [ ] Essayer de créer une tâche → Vérifier qu'une erreur s'affiche
- [ ] Vérifier que les erreurs 401 déconnectent automatiquement l'utilisateur

## ✅ Checklist Complète

- [ ] Tous les tests d'authentification passent
- [ ] Toutes les fonctionnalités de gestion des tâches fonctionnent
- [ ] Les dates s'affichent correctement selon le statut
- [ ] Les workflows peuvent être créés, modifiés et supprimés
- [ ] Le calendrier fonctionne dans toutes les vues
- [ ] La vue par projet fonctionne
- [ ] Le rapport actuel affiche les bonnes informations
- [ ] Le time tracking fonctionne en continu
- [ ] Les rapports daily/weekly fonctionnent
- [ ] La corbeille fonctionne
- [ ] L'interface s'adapte au thème et à la taille de l'écran
- [ ] Les notifications fonctionnent
- [ ] Les validations de formulaires fonctionnent
- [ ] La gestion des erreurs fonctionne

## 🐛 Problèmes Connus

Si vous rencontrez des problèmes, vérifiez :
1. Que tous les conteneurs Docker sont démarrés : `docker ps`
2. Que les migrations sont appliquées : `make migrate`
3. Que les données de test sont générées : `make test-data-due-dates`
4. Les logs des conteneurs : `make logs`

## 📝 Notes

- Les tests doivent être effectués dans l'ordre pour une meilleure compréhension
- Certains tests nécessitent d'attendre quelques minutes (time tracking)
- Les notifications nécessitent l'autorisation du navigateur

