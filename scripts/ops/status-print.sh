#!/usr/bin/env bash
# Affiche le statut détaillé des conteneurs TaskFlow uniquement (préfixe taskflow-).
# Variables : STATUS_LEGEND=1 pour afficher la légende des ports.

set -euo pipefail

print_service() {
  local service="$1"
  local container="${2:-taskflow-${service}}"

  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${container}$"; then
    local status health ports uptime port_ext port_int
    status=$(docker ps --filter "name=^${container}$" --format "{{.Status}}" 2>/dev/null)
    health=$(docker inspect "$container" --format='{{.State.Health.Status}}' 2>/dev/null || echo "no-healthcheck")
    ports=$(docker ps --filter "name=^${container}$" --format "{{.Ports}}" 2>/dev/null)
    uptime=$(echo "$status" | sed -n 's/.*Up \([^(]*\).*/\1/p' | sed 's/ (.*//' | xargs || echo "N/A")

    if [ -n "$ports" ]; then
      port_ext=$(echo "$ports" | sed -n 's/.*0\.0\.0\.0:\([0-9]*\)->.*/\1/p' | head -1)
      [ -z "$port_ext" ] && port_ext=$(echo "$ports" | sed -n 's/.*127\.0\.0\.1:\([0-9]*\)->.*/\1/p' | head -1)
      port_int=$(echo "$ports" | sed -n 's/.*->\([0-9]*\)\/tcp.*/\1/p' | head -1)

      if [ -n "$port_ext" ] && [ -n "$port_int" ]; then
        case "$health" in
          healthy)   printf "  \033[1;32m✅ UP\033[0m   %-22s \033[0;36m%s\033[0m → \033[0;33m%s\033[0m \033[0;32m[healthy]\033[0m (%s)\n" "$service" "$port_ext" "$port_int" "$uptime" ;;
          unhealthy) printf "  \033[1;33m⚠️  UP\033[0m   %-22s \033[0;36m%s\033[0m → \033[0;33m%s\033[0m \033[1;31m[unhealthy]\033[0m (%s)\n" "$service" "$port_ext" "$port_int" "$uptime" ;;
          starting)  printf "  \033[1;33m🔄 UP\033[0m   %-22s \033[0;36m%s\033[0m → \033[0;33m%s\033[0m \033[0;33m[starting]\033[0m (%s)\n" "$service" "$port_ext" "$port_int" "$uptime" ;;
          *)         printf "  \033[1;32m✅ UP\033[0m   %-22s \033[0;36m%s\033[0m → \033[0;33m%s\033[0m (%s)\n" "$service" "$port_ext" "$port_int" "$uptime" ;;
        esac
      elif [ -n "$port_ext" ]; then
        case "$health" in
          healthy)   printf "  \033[1;32m✅ UP\033[0m   %-22s \033[0;36m%s\033[0m \033[0;32m[healthy]\033[0m (%s)\n" "$service" "$port_ext" "$uptime" ;;
          unhealthy) printf "  \033[1;33m⚠️  UP\033[0m   %-22s \033[0;36m%s\033[0m \033[1;31m[unhealthy]\033[0m (%s)\n" "$service" "$port_ext" "$uptime" ;;
          *)         printf "  \033[1;32m✅ UP\033[0m   %-22s \033[0;36m%s\033[0m (%s)\n" "$service" "$port_ext" "$uptime" ;;
        esac
      else
        printf "  \033[1;32m✅ UP\033[0m   %-22s (pas de port exposé) (%s)\n" "$service" "$uptime"
      fi
    else
      printf "  \033[1;32m✅ UP\033[0m   %-22s (pas de port exposé) (%s)\n" "$service" "$uptime"
    fi
    return 0
  fi

  if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q "^${container}$"; then
    status=$(docker ps -a --filter "name=^${container}$" --format "{{.Status}}" 2>/dev/null)
    printf "  \033[1;31m❌ DOWN\033[0m %-22s \033[0;90m[%s]\033[0m\n" "$service" "$status"
  else
    printf "  \033[1;31m❌ DOWN\033[0m %-22s \033[0;90m[non créé]\033[0m\n" "$service"
  fi
  return 1
}

up=0
down=0

printf '%b\n' "\033[0;36m📊 Statut TaskFlow\033[0m (conteneurs \033[1;33mtaskflow-*\033[0m uniquement)"
echo "=================================================="
echo ""

if [ "${STATUS_LEGEND:-0}" = "1" ]; then
  printf '%b\n' "\033[0;90mPorts : \033[0;36mport machine (localhost)\033[0;90m  →  \033[0;33mport interne conteneur\033[0m"
  printf '%b\n' "\033[0;90mDev : Web \033[0;36m4000\033[0;90m · API \033[0;36m4001\033[0;90m · DB \033[0;36m4002\033[0m"
  echo ""
fi

echo "🗄️  Infrastructure :"
echo ""
if print_service "db"; then up=$((up + 1)); else down=$((down + 1)); fi
echo ""
echo "🔥 Backend :"
echo ""
if print_service "api"; then up=$((up + 1)); else down=$((down + 1)); fi
echo ""
echo "🌐 Frontend :"
echo ""
if print_service "web"; then up=$((up + 1)); else down=$((down + 1)); fi

# Préprod (stack taskflow-stack-preprod)
if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -q 'taskflow-.*-preprod'; then
  echo ""
  echo "🧪 Préprod (staging) :"
  echo ""
  if print_service "db-preprod" "taskflow-db-preprod"; then up=$((up + 1)); else down=$((down + 1)); fi
  if print_service "api-preprod" "taskflow-api-preprod"; then up=$((up + 1)); else down=$((down + 1)); fi
  if print_service "web-preprod" "taskflow-web-preprod"; then up=$((up + 1)); else down=$((down + 1)); fi
fi

# Conteneurs taskflow-* supplémentaires (test, etc.)
extra=$(docker ps -a --format '{{.Names}}' 2>/dev/null | grep '^taskflow-' | grep -Ev '^(taskflow-db|taskflow-api|taskflow-web|taskflow-db-preprod|taskflow-api-preprod|taskflow-web-preprod)$' || true)
if [ -n "$extra" ]; then
  echo ""
  echo "🧪 Autres conteneurs TaskFlow :"
  echo ""
  while IFS= read -r name; do
    [ -z "$name" ] && continue
    suffix="${name#taskflow-}"
    if print_service "$suffix"; then up=$((up + 1)); else down=$((down + 1)); fi
  done <<< "$extra"
fi

echo ""
echo "=================================================="
total=$((up + down))
if [ "$total" -eq 0 ]; then
  printf '%b\n' "\033[0;90mAucun conteneur TaskFlow trouvé. Lancez \033[0;36mmake up\033[0;90m ou \033[0;36mmake up-prod\033[0;90m.\033[0m"
else
  printf '%b\n' "\033[0;36mRésumé :\033[0m \033[1;32m${up} UP\033[0m / \033[1;31m${down} DOWN\033[0m (\033[0;90m${total} conteneurs taskflow-*\033[0m)"
fi
