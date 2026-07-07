#!/usr/bin/env bash
# Smoke test post-déploiement TaskFlow
set -euo pipefail

API_URL="${SMOKE_API_URL:-http://127.0.0.1:4001}"
WEB_URL="${SMOKE_WEB_URL:-http://127.0.0.1:4000}"

fail=0
check() {
  local name="$1" url="$2"
  if curl -fsSL --max-time 10 "$url" >/dev/null; then
    printf '  \033[1;32m✅\033[0m %s — %s\n' "$name" "$url"
  else
    printf '  \033[1;31m❌\033[0m %s — %s\n' "$name" "$url"
    fail=1
  fi
}

echo "🔥 Smoke TaskFlow"
echo "================="
check "API /health" "${API_URL%/}/health"
check "Web" "${WEB_URL%/}/"

if [[ "$fail" -eq 0 ]]; then
  echo "✅ Smoke OK"
else
  echo "❌ Smoke échoué — make status / make logs-prod"
  exit 1
fi
