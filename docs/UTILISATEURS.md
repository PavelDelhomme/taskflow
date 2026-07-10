# Utilisateurs TaskFlow

## Comptes

| Rôle | Username | Email | Mot de passe |
|------|----------|-------|--------------|
| **Propriétaire** | `Pactivisme` | `paveldelhomme@gmail.com` | Voir `OWNER_PASSWORD` dans `.env` |
| **Démo** | `demo` | `demo@taskflow.local` | `DemoTaskFlow2025!` (voir `DEMO_PASSWORD`) |

Les mots de passe réels du propriétaire sont **uniquement** dans `.env` (gitignored) ou Portainer — jamais dans Git.

## Inscription publique

Désactivée par défaut :

```env
ALLOW_REGISTRATION=false
NEXT_PUBLIC_ALLOW_REGISTRATION=false
```

- L’API renvoie **403** sur `/auth/register` si désactivé.
- Le bouton « Créer un compte » disparaît de l’interface web.

Pour rouvrir temporairement (dev uniquement) : `ALLOW_REGISTRATION=true` + redémarrer l’API.

## Créer / mettre à jour les comptes en base

```bash
make seed-users
```

Exécute `taskflow-api/seed-users.sql` (idempotent — safe à relancer).

Sur **nouvelle install** Docker, `init.sql` crée déjà les comptes.

## Déploiement Portainer

Dans les variables stack (`deploy/portainer/stack.env.example`) :

```env
ALLOW_REGISTRATION=false
# OWNER_* et DEMO_* documentés pour référence — les hash sont en seed-users.sql
```

Après premier déploiement :

```bash
docker exec -i taskflow-db psql -U taskflow -d taskflow_adhd < taskflow-api/seed-users.sql
```

Ou depuis le VPS : `make seed-users` si le repo est cloné.

## Connexion locale

1. `make up`
2. http://localhost:4000
3. Email : `paveldelhomme@gmail.com` + mot de passe propriétaire

Compte démo pour présenter l’app sans exposer le compte perso.
