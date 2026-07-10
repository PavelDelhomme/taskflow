#!/usr/bin/env bash
# Génère les secrets TaskFlow (Portainer + comptes)
# Usage :
#   make secrets-print          → bloc Portainer (Advanced mode)
#   make secrets-print-accounts → mots de passe comptes (à garder dans un gestionnaire)
set -euo pipefail

rand_hex() { openssl rand -hex "${1:-24}" 2>/dev/null || head -c "$1" /dev/urandom | xxd -p -c "$1"; }
rand_base64() { openssl rand -base64 "${1:-24}" 2>/dev/null | tr -d '/+=' | head -c "${2:-32}"; }

stack_block() {
  local pg="$1" jwt="$2"
  cat <<EOF
POSTGRES_DB=taskflow_adhd
POSTGRES_USER=taskflow
POSTGRES_PASSWORD=${pg}
SECRET_KEY=${jwt}
NODE_ENV=production
PYTHONUNBUFFERED=1
LOG_LEVEL=info
NEXT_PUBLIC_API_URL=https://api.taskflow.delhomme.ovh
CORS_ORIGINS=https://taskflow.delhomme.ovh,https://api.taskflow.delhomme.ovh
ALLOW_REGISTRATION=false
NEXT_PUBLIC_ALLOW_REGISTRATION=false
IMAGE_PULL_POLICY=build
EOF
}

accounts_block() {
  local demo="$1"
  cat <<EOF
# --- Comptes (NE PAS coller dans Portainer — seed après deploy) ---
OWNER_USERNAME=Pactivisme
OWNER_FULL_NAME=Paul Delhomme
OWNER_EMAIL=paveldelhomme@gmail.com
OWNER_PASSWORD=REMPLACER_votre_mot_de_passe_perso

DEMO_USERNAME=demo
DEMO_FULL_NAME=Compte Démo TaskFlow
DEMO_EMAIL=demo@taskflow.local
DEMO_PASSWORD=${demo}
EOF
}

case "${1:-}" in
  --accounts)
    DEMO_PASSWORD="$(rand_base64 24 32)"
    accounts_block "$DEMO_PASSWORD"
    echo ""
    echo "# Enregistre DEMO_PASSWORD dans ton gestionnaire de mots de passe."
    echo "# Puis : make seed-users (local) ou scripts/db/seed-users.sh sur le VPS"
    ;;
  --print|"")
    POSTGRES_PASSWORD="$(rand_hex 24)"
    SECRET_KEY="$(rand_hex 32)"
    stack_block "$POSTGRES_PASSWORD" "$SECRET_KEY"
    echo ""
    echo "# Coller UNIQUEMENT le bloc ci-dessus dans Portainer → Environment variables (Advanced mode)"
    echo "# Puis : make secrets-print-accounts pour générer DEMO_PASSWORD"
    ;;
  *)
    echo "Usage: $0 [--print|--accounts]" >&2
    exit 1
    ;;
esac
