# 🧪 Guide de Test des Commandes Vocales

## Tests Automatiques

Exécutez les tests automatiques avec :

```bash
make test-voice
```

ou directement :

```bash
./test-voice-commands.sh
```

### Ce qui est testé automatiquement :

✅ **Infrastructure**
- Docker fonctionne
- Conteneurs en cours d'exécution
- Services prêts

✅ **API**
- Authentification
- Endpoints nécessaires pour les commandes vocales
  - `/tasks`
  - `/templates`
  - `/tags`
  - `/notes`
  - `/stats/dashboard`
  - `/breaks/today`
  - `/energy/current`
  - `/reminders/pending`

✅ **Service Worker**
- Accessible
- Contient les fonctions nécessaires

✅ **Application Web**
- Accessible

---

## Tests Manuels Requis

Les tests automatiques vérifient que tout est en place, mais **vous devez tester manuellement** les commandes vocales dans le navigateur car elles nécessitent :
- Un microphone
- La reconnaissance vocale du navigateur
- L'interaction utilisateur

### Checklist de Test Manuel

#### 1. Activation ✅
- [ ] Cliquer sur le bouton 🎤 Voix active l'écoute
- [ ] Le raccourci `Ctrl+Shift+V` active l'écoute
- [ ] Le bouton montre une animation pulse quand l'écoute est active
- [ ] Le label change en "Écoute..." quand actif

#### 2. Transcription en Temps Réel ✅
- [ ] La transcription apparaît sous le bouton pendant que vous parlez
- [ ] La transcription est mise à jour en temps réel
- [ ] La transcription disparaît après 2 secondes

#### 3. Commandes de Navigation ✅
- [ ] "calendrier" → Ouvre le calendrier
- [ ] "statistiques" → Ouvre les stats
- [ ] "templates" → Ouvre les templates
- [ ] "tags" → Ouvre les tags
- [ ] "notes" → Ouvre les notes
- [ ] "pauses" → Ouvre les pauses
- [ ] "énergie" → Ouvre le suivi d'énergie
- [ ] "rappels" → Ouvre les rappels
- [ ] "timeline" → Ouvre la timeline
- [ ] "time awareness" → Ouvre Time Awareness
- [ ] "corbeille" → Ouvre la corbeille

#### 4. Commandes de Création ✅
- [ ] "créer tâche" → Ouvre le formulaire
- [ ] "créer tâche [titre]" → Ouvre avec titre pré-rempli

#### 5. Commandes d'Action ✅
- [ ] "fermer" → Ferme tous les modals
- [ ] "aide" → Ouvre la modal d'aide

#### 6. Feedback ✅
- [ ] Notification de confirmation apparaît
- [ ] Son de confirmation joue (si activé)
- [ ] Message d'erreur si commande non reconnue

#### 7. Modal d'Aide ✅
- [ ] Toutes les commandes sont listées
- [ ] Les catégories sont organisées
- [ ] Le paramètre feedback audio fonctionne
- [ ] Les raccourcis clavier sont documentés

#### 8. Gestion d'Erreurs ✅
- [ ] Message si microphone non disponible
- [ ] Message si permission refusée
- [ ] Message si commande non reconnue
- [ ] Les erreurs disparaissent après 3 secondes

---

## Résultats Attendus

### ✅ Succès
- Tous les tests automatiques passent (18/18)
- Les commandes vocales fonctionnent dans le navigateur
- Le feedback visuel et audio fonctionne
- La modal d'aide est complète

### ⚠️ Problèmes Connus

1. **Reconnaissance vocale limitée par navigateur**
   - Chrome/Edge : Meilleure reconnaissance
   - Firefox : Non supporté
   - Safari : Support partiel

2. **Permissions microphone**
   - Doit être autorisé par l'utilisateur
   - Peut nécessiter HTTPS en production

3. **Environnement bruyant**
   - Peut affecter la précision de la reconnaissance
   - Utilisez un environnement calme pour de meilleurs résultats

---

## Rapport de Test

Après avoir exécuté les tests, vous devriez voir :

```
✓ Succès: 18
✗ Erreurs: 0

🎉 Tous les tests automatiques sont passés !
⚠️  N'oubliez pas de tester manuellement les commandes vocales dans le navigateur
```

---

## Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs : `docker-compose logs -f taskflow-web`
2. Vérifiez la console du navigateur (F12)
3. Consultez `VOICE_COMMANDS.md` pour la documentation complète
4. Testez dans Chrome (meilleure compatibilité)

---

*Dernière mise à jour : 2025-12-22*

