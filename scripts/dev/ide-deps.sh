#!/usr/bin/env bash
# Dépendances npm locales pour Cursor/VS Code (autocomplétion TypeScript).
# Le dev Docker utilise un volume anonyme /app/node_modules — sans ce script, node_modules/ reste vide sur l'hôte.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WEB="$ROOT/taskflow-web"

if [[ ! -f "$WEB/package-lock.json" ]]; then
  echo "❌ $WEB/package-lock.json introuvable" >&2
  exit 1
fi

mkdir -p "$WEB/node_modules"

# Docker crée parfois node_modules/ en root
if [[ -d "$WEB/node_modules" ]] && [[ ! -w "$WEB/node_modules" ]]; then
  echo "⚠️  node_modules/ appartient à root (volume Docker) — correction des droits…"
  if command -v sudo >/dev/null 2>&1; then
    sudo chown -R "$(id -u):$(id -g)" "$WEB/node_modules"
  else
    echo "❌ Relance avec les droits d'écriture sur $WEB/node_modules" >&2
    exit 1
  fi
fi

cd "$WEB"
npm ci

echo ""
echo "✅ Dépendances IDE installées dans taskflow-web/node_modules"
echo "   Recharge la fenêtre Cursor : Ctrl+Shift+P → « Developer: Reload Window »"
