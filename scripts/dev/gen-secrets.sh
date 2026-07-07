#!/usr/bin/env bash
# Génère des secrets TaskFlow pour Portainer (.env local ou --print)
set -euo pipefail

rand_hex() { openssl rand -hex "${1:-24}" 2>/dev/null || head -c "$1" /dev/urandom | xxd -p -c "$1"; }

POSTGRES_PASSWORD="$(rand_hex 24)"
SECRET_KEY="$(rand_hex 32)"

block() {
  cat <<EOF
POSTGRES_DB=taskflow_adhd
POSTGRES_USER=taskflow
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
SECRET_KEY=${SECRET_KEY}
NEXT_PUBLIC_API_URL=https://api.taskflow.delhomme.ovh
CORS_ORIGINS=https://taskflow.delhomme.ovh,https://api.taskflow.delhomme.ovh
WEB_PUBLISH_PORT=4000
API_PUBLISH_PORT=4001
DB_PUBLISH_PORT=4002
NODE_ENV=production
IMAGE_REGISTRY=ghcr.io/paveldelhomme
IMAGE_TAG=latest
IMAGE_PULL_POLICY=build
EOF
}

if [[ "${1:-}" == "--print" ]]; then
  block
  exit 0
fi

OUT="${OUTPUT:-.env}"
if [[ -f "$OUT" ]]; then
  echo "❌ $OUT existe déjà. Supprimez-le ou utilisez --print." >&2
  exit 1
fi
block > "$OUT"
echo "✅ Secrets écrits dans $OUT — adaptez NEXT_PUBLIC_API_URL et CORS_ORIGINS."
