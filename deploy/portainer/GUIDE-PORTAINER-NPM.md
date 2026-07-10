# =============================================================================
# GUIDE PORTAINER + NPM — TaskFlow (prod VPS delhomme.ovh)
# =============================================================================

## 1. DNS (chez OVH / ton registrar)

Crée ou vérifie ces enregistrements **A** vers l’IP du VPS (`95.111.227.204` ou ton IP actuelle) :

| Sous-domaine | Type | Valeur |
|--------------|------|--------|
| `taskflow.delhomme.ovh` | A | IP du VPS |
| `api.taskflow.delhomme.ovh` | A | IP du VPS |

---

## 2. Portainer — Create stack (Git repository)

**Stacks → Add stack**

| Champ | Valeur |
|-------|--------|
| **Name** | `taskflow-stack` |
| **Build method** | **Use a git repository** |
| **Repository URL** | `https://github.com/PavelDelhomme/taskflow.git` |
| **Repository reference** | `refs/heads/main` |
| **Compose path** | `deploy/portainer/docker-compose.stack.yml` |
| **Authentication** | Si repo privé : ton user GitHub + PAT (`repo`) |
| **Skip TLS Verification** | Non |
| **GitOps updates** | Activé, polling **5 min**, ref `refs/heads/main` |

### Environment variables (Advanced mode — copier-coller)

Génère d’abord les secrets sur ton PC :

```bash
cd ~/Documents/Dev/Perso/taskflow/taskflow
make secrets-print
```

Puis adapte ce bloc dans Portainer (remplace `REMPLACER_*` par tes vraies valeurs) :

```env
POSTGRES_DB=taskflow_adhd
POSTGRES_USER=taskflow
POSTGRES_PASSWORD=REMPLACER_openssl_rand_hex_24
SECRET_KEY=REMPLACER_openssl_rand_hex_32
NODE_ENV=production
PYTHONUNBUFFERED=1
NEXT_PUBLIC_API_URL=https://api.taskflow.delhomme.ovh
CORS_ORIGINS=https://taskflow.delhomme.ovh,https://api.taskflow.delhomme.ovh
ALLOW_REGISTRATION=false
NEXT_PUBLIC_ALLOW_REGISTRATION=false
IMAGE_PULL_POLICY=build
```

> **Ne mets jamais** ton mot de passe perso (`OWNER_PASSWORD`) ici — seulement les secrets stack ci-dessus.

Clique **Deploy the stack**. Le premier build peut prendre **5–15 min**.

---

## 3. Après le déploiement — créer ton compte en base

Sur le VPS (SSH) ou via Portainer **Console** sur `taskflow-db` :

```bash
docker exec -i taskflow-db psql -U taskflow -d taskflow_adhd < /path/to/seed-users.sql
```

Ou si le repo est cloné sur le serveur :

```bash
git clone https://github.com/PavelDelhomme/taskflow.git /tmp/taskflow
docker exec -i taskflow-db psql -U taskflow -d taskflow_adhd < /tmp/taskflow/taskflow-api/seed-users.sql
```

Cela crée **Pactivisme** + le compte **demo**.

---

## 4. Nginx Proxy Manager — Proxy Hosts

Tu as déjà une entrée `taskflow:3003` — **à mettre à jour** :

### Web — `taskflow.delhomme.ovh`

| Champ | Valeur |
|-------|--------|
| Domain names | `taskflow.delhomme.ovh` |
| Scheme | `http` |
| Forward hostname / IP | `taskflow` |
| Forward port | **3000** (pas 3003 — Next.js écoute sur 3000) |
| Block common exploits | Oui |
| Websockets support | Oui |
| SSL | Request new SSL → Let's Encrypt |
| Force SSL | Oui |
| HTTP/2 | Oui |

**Advanced** (optionnel, onglet Custom locations ou Advanced) :

```
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header Host $host;
```

### API — `api.taskflow.delhomme.ovh` (nouveau proxy host)

| Champ | Valeur |
|-------|--------|
| Domain names | `api.taskflow.delhomme.ovh` |
| Forward hostname / IP | `taskflow-api` |
| Forward port | **8000** |
| Websockets | Oui |
| SSL + Force SSL | Oui |

---

## 5. Réseau Docker `shared-network-copy`

La stack TaskFlow rejoint le même réseau que Nextcloud et n8n. NPM (conteneur `nginx-proxy-manager` ou similaire) doit être sur **`shared-network-copy`** pour résoudre `taskflow` et `taskflow-api` par nom.

Vérification sur le VPS :

```bash
docker network inspect shared-network-copy | grep -E 'taskflow|nginx'
```

Tu dois voir `taskflow`, `taskflow-api` et le conteneur NPM.

---

## 6. Tests

```bash
curl -s https://api.taskflow.delhomme.ovh/health
curl -sI https://taskflow.delhomme.ovh/
```

Connexion web : `paveldelhomme@gmail.com` + mot de passe (celui de ton `.env` local — hashé en base via seed-users).

---

## 7. Mises à jour

| Méthode | Action |
|---------|--------|
| **GitOps** | Push sur `main` → Portainer rebuild sous 5 min |
| **Manuel** | Portainer → stack → Pull and redeploy |
| **Comptes** | Re-lancer seed-users.sql si besoin |

---

## 8. Dépannage

| Problème | Solution |
|----------|----------|
| 502 Bad Gateway NPM | Stack pas healthy — logs `taskflow-api`, `taskflow` |
| Network Error / CORS | `CORS_ORIGINS` doit inclure les URLs HTTPS exactes |
| Login impossible | `seed-users.sql` pas exécuté |
| Ancien port 3003 | NPM → forward port **3000** |
| Build Portainer long | Normal au 1er deploy ; ensuite GitOps incrémental |

---

## Schéma

```
Internet
   │
   ▼
NPM (shared-network-copy)
   ├── taskflow.delhomme.ovh  ──►  taskflow:3000      (web)
   └── api.taskflow.delhomme.ovh ──► taskflow-api:8000 (API)
                                        │
                                        ▼
                                   taskflow-db (réseau interne uniquement)
```
