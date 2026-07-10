# Déploiement TaskFlow — checklist Portainer + NPM (delhomme.ovh)

> **À suivre dans l’ordre.** Temps estimé : 30–45 min (1er deploy).

---

## ÉTAPE 0 — Sur ton PC (avant Portainer)

Ouvre un terminal dans le projet :

```bash
cd ~/Documents/Dev/Perso/taskflow/taskflow
```

### 0.1 — Générer les secrets **stack** (Portainer)

```bash
make secrets-print
```

**Copie tout le bloc affiché** dans un fichier temporaire `portainer-secrets.txt` sur ton PC.  
Tu le colleras à l’**étape 2** dans Portainer.

Contenu typique (les valeurs seront **différentes** chez toi) :

```env
POSTGRES_DB=taskflow_adhd
POSTGRES_USER=taskflow
POSTGRES_PASSWORD=abc123...24car
SECRET_KEY=def456...32car
NODE_ENV=production
PYTHONUNBUFFERED=1
LOG_LEVEL=info
NEXT_PUBLIC_API_URL=https://api.taskflow.delhomme.ovh
CORS_ORIGINS=https://taskflow.delhomme.ovh,https://api.taskflow.delhomme.ovh
ALLOW_REGISTRATION=false
NEXT_PUBLIC_ALLOW_REGISTRATION=false
IMAGE_PULL_POLICY=build
```

> **Ne mets jamais** `OWNER_PASSWORD` ni `DEMO_PASSWORD` dans Portainer.

### 0.2 — Générer le mot de passe **démo** (aléatoire, fort)

```bash
make secrets-print-accounts
```

Note dans ton **gestionnaire de mots de passe** :
- `DEMO_PASSWORD` (généré aléatoirement)
- Ton `OWNER_PASSWORD` perso (celui que tu utilises déjà)

### 0.3 — Vérifier ton `.env` local

Ton fichier `.env` (gitignored) doit contenir :

```env
OWNER_USERNAME=Pactivisme
OWNER_FULL_NAME=Paul Delhomme
OWNER_EMAIL=paveldelhomme@gmail.com
OWNER_PASSWORD=ton_mot_de_passe_perso

DEMO_USERNAME=demo
DEMO_EMAIL=demo@taskflow.local
DEMO_PASSWORD=le_mot_de_passe_généré_à_létape_0.2
```

---

## ÉTAPE 1 — DNS (OVH)

Enregistrements **A** vers l’IP du VPS (`95.111.227.204`) :

| Nom | Type | Cible |
|-----|------|-------|
| `taskflow.delhomme.ovh` | A | IP VPS |
| `api.taskflow.delhomme.ovh` | A | IP VPS |

Attends 5–15 min la propagation DNS.

---

## ÉTAPE 2 — Portainer : Create stack

**Stacks → Add stack**

Remplis **exactement** :

| Champ | Valeur |
|-------|--------|
| **Name** | `taskflow-stack` |
| **Build method** | ☑ **Use a git repository** |
| **Repository URL** | `https://github.com/PavelDelhomme/taskflow.git` |
| **Repository reference** | `refs/heads/main` |
| **Compose path** | `deploy/portainer/docker-compose.stack.yml` |
| **Authentication** | Si repo privé : user GitHub + token PAT (`repo`) |
| **Skip TLS Verification** | ☐ décoché |

### GitOps (version gratuite Portainer)

| Champ | Valeur |
|-------|--------|
| **GitOps updates** | ☑ Activé |
| **Fetch interval** | `5m` |
| **Re-pull image** | ☐ Ignorer (Business — payant) |
| **Force redeployment** | ☐ Ignorer (Business — payant) |

> Sans Business : après un `git push`, clique manuellement **Update the stack** dans Portainer (étape 7).

### Environment variables

1. Clique **Switch to advanced mode**
2. **Colle le bloc entier** de l’étape 0.1 (`make secrets-print`)
3. Vérifie que tu as **11 variables** minimum (POSTGRES_*, SECRET_KEY, URLs, ALLOW_REGISTRATION…)

| name | Exemple de value |
|------|------------------|
| POSTGRES_DB | `taskflow_adhd` |
| POSTGRES_USER | `taskflow` |
| POSTGRES_PASSWORD | *(généré étape 0.1)* |
| SECRET_KEY | *(généré étape 0.1)* |
| NODE_ENV | `production` |
| PYTHONUNBUFFERED | `1` |
| LOG_LEVEL | `info` |
| NEXT_PUBLIC_API_URL | `https://api.taskflow.delhomme.ovh` |
| CORS_ORIGINS | `https://taskflow.delhomme.ovh,https://api.taskflow.delhomme.ovh` |
| ALLOW_REGISTRATION | `false` |
| NEXT_PUBLIC_ALLOW_REGISTRATION | `false` |
| IMAGE_PULL_POLICY | `build` |

### Access control

☑ **I want to restrict the management of this resource to administrators only**

Clique **Deploy the stack**.

⏳ Premier build : **5 à 20 minutes**. Attends que les 3 conteneurs soient **running** :
- `taskflow-db`
- `taskflow-api`
- `taskflow` (web)

---

## ÉTAPE 3 — Créer tes comptes en base (SSH sur le VPS)

Connecte-toi en SSH au VPS, puis :

```bash
# Cloner temporairement (ou utiliser un clone existant)
git clone https://github.com/PavelDelhomme/taskflow.git /tmp/taskflow
cd /tmp/taskflow

# Créer un .env minimal UNIQUEMENT pour le seed (ne pas committer)
cat > .env.seed << 'EOF'
OWNER_USERNAME=Pactivisme
OWNER_FULL_NAME=Paul Delhomme
OWNER_EMAIL=paveldelhomme@gmail.com
OWNER_PASSWORD=COLLE_TON_MOT_DE_PASSE_ICI
DEMO_USERNAME=demo
DEMO_EMAIL=demo@taskflow.local
DEMO_PASSWORD=COLLE_DEMO_PASSWORD_ETAPE_0.2
POSTGRES_USER=taskflow
POSTGRES_PASSWORD=COLLE_POSTGRES_PASSWORD_PORTAINER
POSTGRES_DB=taskflow_adhd
EOF

# Édite le fichier pour mettre les vraies valeurs :
nano .env.seed

# Lance le seed
ENV_FILE=.env.seed ./scripts/db/seed-users.sh

# Supprime le fichier temporaire (sécurité)
shred -u .env.seed 2>/dev/null || rm -f .env.seed
```

Tu dois voir : `✅ Comptes créés / mis à jour`.

---

## ÉTAPE 4 — Nginx Proxy Manager

Tu as déjà une entrée `http://taskflow:3003` — **à modifier**.

### 4.1 — Web : `taskflow.delhomme.ovh`

**Hosts → Proxy Hosts →** édite l’entrée taskflow **ou** crée-en une :

| Onglet | Champ | Valeur |
|--------|-------|--------|
| Details | Domain names | `taskflow.delhomme.ovh` |
| Details | Scheme | `http` |
| Details | Forward hostname | `taskflow` |
| Details | Forward port | **`3000`** ← pas 3003 |
| Details | Block common exploits | ☑ |
| Details | Websockets support | ☑ |
| SSL | SSL Certificate | Request a new SSL Certificate (Let's Encrypt) |
| SSL | Force SSL | ☑ |
| SSL | HTTP/2 | ☑ |

### 4.2 — API : `api.taskflow.delhomme.ovh` (nouveau)

| Onglet | Champ | Valeur |
|--------|-------|--------|
| Details | Domain names | `api.taskflow.delhomme.ovh` |
| Details | Forward hostname | `taskflow-api` |
| Details | Forward port | **`8000`** |
| Details | Websockets support | ☑ |
| SSL | Let's Encrypt + Force SSL | ☑ |

> NPM et TaskFlow doivent être sur le réseau **`shared-network-copy`** (comme nextcloud, n8n).

Vérification :

```bash
docker network inspect shared-network-copy --format '{{range .Containers}}{{.Name}} {{end}}'
```

Tu dois voir : `taskflow`, `taskflow-api`, et le conteneur NPM.

---

## ÉTAPE 5 — Tests

```bash
curl -s https://api.taskflow.delhomme.ovh/health
curl -sI https://taskflow.delhomme.ovh/ | head -5
```

Navigateur :
1. Ouvre **https://taskflow.delhomme.ovh**
2. Connecte-toi : `paveldelhomme@gmail.com` + ton mot de passe propriétaire
3. Le bouton **« Créer un compte »** ne doit **pas** apparaître

Compte démo (présentations uniquement) :
- Email : `demo@taskflow.local`
- Mot de passe : celui généré à l’étape 0.2

---

## ÉTAPE 6 — Sécurité (résumé)

| Mesure | Statut |
|--------|--------|
| Inscription publique fermée | `ALLOW_REGISTRATION=false` |
| Mots de passe hors Git | seed via `.env` / gestionnaire |
| PostgreSQL non exposé sur Internet | réseau `taskflow-internal` uniquement |
| API/Web via NPM + HTTPS | Let's Encrypt |
| Brute-force login limité | 8 essais / 15 min par IP+email |
| Compte démo mot de passe aléatoire 32 car. | généré `make secrets-print-accounts` |
| Compte admin = ton email perso | séparé du compte démo |

---

## ÉTAPE 7 — Mises à jour depuis ton PC (sans tout casser)

Workflow recommandé **sans Portainer Business** :

```bash
# Sur ton PC
cd ~/Documents/Dev/Perso/taskflow/taskflow
git add ... && git commit -m "..." && git push origin main
```

Puis sur Portainer :
1. **Stacks → taskflow-stack**
2. Clique **Pull and redeploy** ou **Update the stack**
3. Attends la fin du build
4. Vérifie : `curl https://api.taskflow.delhomme.ovh/health`

> Les **volumes** (`taskflow_postgres_data`) conservent ta base — les mises à jour ne effacent pas tes tâches.

> **Ne relance pas** le seed à chaque update sauf changement de mot de passe.

---

## Schéma réseau

```
Internet
   │
   ▼
NPM (shared-network-copy)
   ├── taskflow.delhomme.ovh     →  http://taskflow:3000
   └── api.taskflow.delhomme.ovh →  http://taskflow-api:8000
                                        │
                                   taskflow-internal
                                        └── taskflow-db (isolé)
```

---

## Dépannage

| Symptôme | Action |
|----------|--------|
| 502 Bad Gateway | Stack pas healthy — Portainer → logs `taskflow-api`, `taskflow` |
| Login impossible | Étape 3 non faite — relancer `seed-users.sh` |
| Network Error / CORS | Vérifier `CORS_ORIGINS` = URLs HTTPS exactes |
| Ancien port 3003 | NPM → port **3000** |
| Build échoue | Portainer → logs build ; vérifier accès GitHub |

---

## Fichiers liés

- Compose : `deploy/portainer/docker-compose.stack.yml`
- Template import : `deploy/portainer/portainer-template.json`
- Comptes : `docs/UTILISATEURS.md`
