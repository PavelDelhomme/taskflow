# Stack Portainer « taskflow-stack » — déploiement Git

**Dépôt** : `https://github.com/PavelDelhomme/taskflow.git`

---

## 1. Workflow Git (dev → prod)

| Branche | Rôle | Portainer |
|---------|------|-----------|
| `feat/*` | Travail quotidien | — (local `make up`) |
| `dev` | Intégration / staging | **`taskflow-stack-preprod`** ou **`taskflow-stack-dev`** |
| `main` | Production stable | **`taskflow-stack`** |

```text
feat/*  →  PR vers dev  →  tests OK  →  merge dev → main  →  Portainer redéploie
```

- **Jamais** de secrets dans Git.
- Secrets = **Portainer → Environment variables** uniquement.

---

## 2. Stacks Portainer

### Prod — `taskflow-stack`

| Champ | Valeur |
|-------|--------|
| **Name** | `taskflow-stack` |
| **Build method** | Git repository |
| **Repository URL** | `https://github.com/PavelDelhomme/taskflow.git` |
| **Repository reference** | `refs/heads/main` |
| **Compose path** | `deploy/portainer/docker-compose.stack.yml` |
| **GitOps** | Activé, polling 5 min |

### Préprod staging — `taskflow-stack-preprod`

| Champ | Valeur |
|-------|--------|
| **Name** | `taskflow-stack-preprod` |
| **Repository reference** | `refs/heads/dev` |
| **Compose path** | `deploy/portainer/docker-compose.stack-preprod.yml` |

Ports par défaut **4010/4011/4012** — peut coexister avec prod sur le même VPS.

### Dev intégration — `taskflow-stack-dev` (optionnel)

| Champ | Valeur |
|-------|--------|
| **Compose path** | `deploy/portainer/docker-compose.stack-dev.yml` |
| **Branche** | `refs/heads/dev` |

---

## 3. Variables d'environnement

Modèle : [stack.env.example](./stack.env.example)

```bash
make secrets-print
```

---

## 4. Nginx Proxy Manager

| FQDN | Conteneur prod | Port loopback |
|------|----------------|---------------|
| `taskflow.<domaine>` | `taskflow-web` | 4000 |
| `api.taskflow.<domaine>` | `taskflow-api` | 4001 |

Préprod : `staging.taskflow.*` → ports **4010/4011**.

---

## 5. Mobile (hors Portainer)

APK via `make mobile-release` ou tag `mobile-v*` — voir [taskflow-mobile/README.md](../../taskflow-mobile/README.md).
