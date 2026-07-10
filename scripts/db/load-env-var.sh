#!/usr/bin/env bash
# Charge des variables depuis .env sans interpréter le shell (espaces, *, etc.)
load_env_var() {
  local file="$1" key="$2"
  local line
  line=$(grep -E "^${key}=" "$file" 2>/dev/null | tail -1 || true)
  [[ -z "$line" ]] && return 1
  local val="${line#*=}"
  val="${val%\"}"; val="${val#\"}"
  val="${val%\'}"; val="${val#\'}"
  printf -v "$key" '%s' "$val"
  export "$key"
}
