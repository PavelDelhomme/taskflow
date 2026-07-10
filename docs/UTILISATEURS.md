# Utilisateurs TaskFlow

## Comptes

| Rôle | Username | Email | Mot de passe |
|------|----------|-------|--------------|
| **Propriétaire** | `Pactivisme` | `paveldelhomme@gmail.com` | `OWNER_PASSWORD` dans `.env` (jamais dans Git) |
| **Démo** | `demo` | `demo@taskflow.local` | `DEMO_PASSWORD` généré par `make secrets-print-accounts` |

## Sécurité

- **Inscription publique** : `ALLOW_REGISTRATION=false` (API 403 + bouton masqué)
- **Mots de passe** : hashés bcrypt en base, jamais dans le dépôt Git
- **Brute-force** : 8 tentatives max / 15 min par IP + email sur `/auth/login`
- **Compte démo** : mot de passe aléatoire 32 caractères — à partager uniquement en présentation

## Créer / mettre à jour les comptes

**Local :**

```bash
make secrets-print-accounts   # génère DEMO_PASSWORD si besoin
# Remplir OWNER_PASSWORD et DEMO_PASSWORD dans .env
make seed-users
```

**VPS (après Portainer) :** voir [deploy/portainer/GUIDE-PORTAINER-NPM.md](../deploy/portainer/GUIDE-PORTAINER-NPM.md) — Étape 3.

## Déploiement Portainer

Variables stack : `make secrets-print` (sans mots de passe utilisateurs).

Guide complet : [GUIDE-PORTAINER-NPM.md](../deploy/portainer/GUIDE-PORTAINER-NPM.md)
