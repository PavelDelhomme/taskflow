# 🔧 Résolution Problème Commandes Vocales dans Brave

## 🎯 Problème

Brave Browser bloque par défaut les connexions vers les serveurs Google, ce qui empêche la reconnaissance vocale de fonctionner.

## ✅ Solutions

### Solution 1 : Désactiver le blocage dans Brave (Recommandé)

1. Ouvrez `brave://settings/privacy`
2. Dans la section **"Bloquer les scripts et les trackers"**, ajoutez une exception pour `localhost:4000`
3. Ou désactivez temporairement le blocage pour ce site
4. Rechargez la page

### Solution 2 : Utiliser Chrome ou Edge

Les commandes vocales fonctionnent mieux dans Chrome ou Edge car ils ne bloquent pas les connexions Google.

### Solution 3 : Autoriser les connexions Google dans Brave

1. Ouvrez `brave://settings/shields`
2. Cliquez sur l'icône 🛡️ dans la barre d'adresse
3. Désactivez "Bloquer les scripts et les trackers" pour `localhost:4000`
4. Rechargez la page

## 🔍 Vérification

Après avoir appliqué une solution :
1. Rechargez la page (F5)
2. Cliquez sur le bouton 🎤 Voix
3. Vérifiez dans la console (F12) : vous devriez voir `[VOICE] ✅ onstart: Reconnaissance démarrée avec succès`
4. Si vous voyez toujours `[VOICE] ❌ onerror: network`, le blocage est toujours actif

## 📝 Note Technique

La Web Speech API utilise les serveurs Google pour la reconnaissance vocale. Brave bloque ces connexions par défaut pour protéger la vie privée, ce qui empêche la fonctionnalité de fonctionner.

---

*Dernière mise à jour : 2025-12-22*

