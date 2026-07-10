# Stacks Portainer TaskFlow

Guide maître : [docs/DEPLOIEMENT.md](../../docs/DEPLOIEMENT.md)

| Guide | Fichier |
|-------|---------|
| Guide détaillé NPM + formulaire Portainer | [GUIDE-PORTAINER-NPM.md](./GUIDE-PORTAINER-NPM.md) |
| Template Portainer (import) | [portainer-template.json](./portainer-template.json) |
| Variables modèle | [stack.env.example](./stack.env.example) |
| Compose prod (`main`) | [docker-compose.stack.yml](./docker-compose.stack.yml) |
| Compose dev (`dev`) | [docker-compose.stack-dev.yml](./docker-compose.stack-dev.yml) |
| Compose préprod staging | [docker-compose.stack-preprod.yml](./docker-compose.stack-preprod.yml) |

**Formulaire prod** :

| Champ | Valeur |
|-------|--------|
| Repository URL | `https://github.com/PavelDelhomme/taskflow.git` |
| Repository reference | `refs/heads/main` |
| Compose path | `deploy/portainer/docker-compose.stack.yml` |
| Secrets | Portainer Environment variables (`make secrets-print`) |

**TaskFlow ≠ Cloudity** : projets séparés. Cloudity remplace Drive/Photos/Gmail ; TaskFlow est dédié TDAH (organisation, optimisation des tâches).
