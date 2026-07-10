#!/usr/bin/env bash
# Seed comptes TaskFlow depuis .env (local ou VPS) — mots de passe jamais commités
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck source=scripts/db/load-env-var.sh
  source "$ROOT_DIR/scripts/db/load-env-var.sh"
  for var in OWNER_USERNAME OWNER_FULL_NAME OWNER_EMAIL OWNER_PASSWORD \
             DEMO_USERNAME DEMO_FULL_NAME DEMO_EMAIL DEMO_PASSWORD \
             POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB DATABASE_URL; do
    load_env_var "$ENV_FILE" "$var" 2>/dev/null || true
  done
fi

for var in OWNER_EMAIL OWNER_PASSWORD DEMO_PASSWORD; do
  if [[ -z "${!var:-}" ]]; then
    echo "❌ $var manquant dans $ENV_FILE" >&2
    echo "   Remplis OWNER_* et DEMO_PASSWORD (make secrets-print --accounts)" >&2
    exit 1
  fi
done

DB_URL="${DATABASE_URL:-postgresql://${POSTGRES_USER:-taskflow}:${POSTGRES_PASSWORD:-taskflow123}@localhost:4002/${POSTGRES_DB:-taskflow_adhd}}"

if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^taskflow-api$'; then
  docker exec \
    -e DATABASE_URL="postgresql://${POSTGRES_USER:-taskflow}:${POSTGRES_PASSWORD:-taskflow123}@taskflow-db:5432/${POSTGRES_DB:-taskflow_adhd}" \
    -e OWNER_USERNAME="${OWNER_USERNAME:-Pactivisme}" \
    -e OWNER_EMAIL="$OWNER_EMAIL" \
    -e OWNER_FULL_NAME="${OWNER_FULL_NAME:-Paul Delhomme}" \
    -e OWNER_PASSWORD="$OWNER_PASSWORD" \
    -e DEMO_USERNAME="${DEMO_USERNAME:-demo}" \
    -e DEMO_EMAIL="${DEMO_EMAIL:-demo@taskflow.local}" \
    -e DEMO_FULL_NAME="${DEMO_FULL_NAME:-Compte Démo TaskFlow}" \
    -e DEMO_PASSWORD="$DEMO_PASSWORD" \
    taskflow-api python scripts/seed_users.py
else
  DATABASE_URL="$DB_URL" \
    OWNER_USERNAME="${OWNER_USERNAME:-Pactivisme}" \
    OWNER_EMAIL="$OWNER_EMAIL" \
    OWNER_FULL_NAME="${OWNER_FULL_NAME:-Paul Delhomme}" \
    OWNER_PASSWORD="$OWNER_PASSWORD" \
    DEMO_USERNAME="${DEMO_USERNAME:-demo}" \
    DEMO_EMAIL="${DEMO_EMAIL:-demo@taskflow.local}" \
    DEMO_FULL_NAME="${DEMO_FULL_NAME:-Compte Démo TaskFlow}" \
    DEMO_PASSWORD="$DEMO_PASSWORD" \
    python3 "$ROOT_DIR/taskflow-api/scripts/seed_users.py"
fi
