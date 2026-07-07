# Déploiement TaskFlow — Portainer, NPM, prod / préprod

Aligné sur le modèle **Cloudity** (`deploy/portainer/`) et **JobbingTrack**.

> **TaskFlow ≠ Cloudity** : Cloudity remplace Drive/Photos/Gmail en suite complète. TaskFlow est une app TDAH dédiée (organisation, optimisation des tâches — Google Tasks, tasks.delhomme.ovh, Cloudity Tasks, ou tâches natives).

## Stacks Portainer

| Stack | Branche | Compose path | Ports loopback |
|-------|---------|--------------|----------------|
| `taskflow-stack` | `main` | `deploy/portainer/docker-compose.stack.yml` | 4000/4001/4002 |
| `taskflow-stack-preprod` | `dev` | `deploy/portainer/docker-compose.stack-preprod.yml` | 4010/4011/4012 |
| `taskflow-stack-dev` | `dev` | `deploy/portainer/docker-compose.stack-dev.yml` | 4000/4001/4002 |

Guide pas à pas : [`deploy/portainer/PORTAINER-STACK.md`](../deploy/portainer/PORTAINER-STACK.md)

## Démarrage rapide

### Local (dev)

```bash
make init && make up
make status-watch
```

### Prod locale (test avant Portainer)

```bash
make secrets-print    # copier dans .env et adapter domaines
make deploy-prod
make smoke-prod
```

### Préprod locale (coexiste avec prod)

```bash
make deploy-preprod   # ports 4010/4011/4012
make smoke-preprod
```

## Portainer — checklist

1. Stack Git → `deploy/portainer/docker-compose.stack.yml` + branche `main`
2. Coller variables depuis `make secrets-print` (adapter URLs HTTPS)
3. GitOps polling 5 min
4. NPM : `taskflow.delhomme.ovh` → `127.0.0.1:4000`, `api.taskflow.delhomme.ovh` → `127.0.0.1:4001`
5. `make smoke-prod` ou curl `/health`

## CI/CD

| Workflow | Rôle |
|----------|------|
| `build-push-images.yml` | Images GHCR sur push `main`/`dev` |
| `deploy-prod.yml` | Webhook Portainer prod (`PROD_DEPLOY_URL`) |
| `deploy-preprod.yml` | Webhook Portainer préprod (`PREPROD_DEPLOY_URL`) |
| `mobile-build.yml` | APK sur tag `mobile-v*` |

## Mobile (hors Portainer)

[`taskflow-mobile/README.md`](../taskflow-mobile/README.md) — prêt pour Flutter quand le dossier sera initialisé.

## Commandes Make utiles

```bash
make secrets-print      # secrets Portainer
make deploy-web         # rebuild web seul
make deploy-api         # rebuild API seule
make upgrade-prod       # mise à jour prod
make status-watch       # surveillance conteneurs taskflow-*
```
