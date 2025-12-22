#!/bin/bash

# 🧪 Script de test pour les notifications push en arrière-plan

echo "🧪 =========================================="
echo "🧪 Tests des notifications push TaskFlow"
echo "🧪 =========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
SUCCESS=0

# Fonction pour tester un endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local token=$4
    local data=$5
    
    echo -n "  Testing $name... "
    
    if [ "$method" = "GET" ]; then
        if [ -z "$token" ]; then
            response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
        else
            response=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $token" "$url")
        fi
    elif [ "$method" = "POST" ]; then
        if [ -z "$token" ]; then
            response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$url")
        else
            response=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "$data" "$url")
        fi
    fi
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $response)"
        ((SUCCESS++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $response)"
        ((ERRORS++))
        return 1
    fi
}

# 1. Vérifier que Docker est en cours d'exécution
echo "📦 1. Vérification Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker n'est pas en cours d'exécution${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker fonctionne${NC}"
echo ""

# 2. Vérifier les conteneurs
echo "🐳 2. Vérification des conteneurs..."
containers=("taskflow-api" "taskflow-web" "taskflow-db")
for container in "${containers[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "  ${GREEN}✓${NC} $container est en cours d'exécution"
        ((SUCCESS++))
    else
        echo -e "  ${RED}✗${NC} $container n'est pas en cours d'exécution"
        ((ERRORS++))
    fi
done
echo ""

# 3. Attendre que les services soient prêts
echo "⏳ 3. Attente que les services soient prêts..."
sleep 5

# 4. Test d'authentification
echo "🔐 4. Tests d'authentification..."
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@taskflow.local","password":"taskflow123"}' \
  http://localhost:4001/auth/login)

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -oP '"access_token"\s*:\s*"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo -e "  ${RED}✗ Échec de l'authentification${NC}"
    ((ERRORS++))
    exit 1
else
    echo -e "  ${GREEN}✓ Authentification réussie${NC}"
    ((SUCCESS++))
fi
echo ""

# 5. Tests des rappels
echo "🔔 5. Tests des rappels..."
test_endpoint "GET /reminders/pending" "GET" "http://localhost:4001/reminders/pending" "$TOKEN"

# Créer un rappel de test (dans 2 minutes)
FUTURE_TIME=$(date -u -d '+2 minutes' '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || date -u -v+2M '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || python3 -c "from datetime import datetime, timedelta; print((datetime.now() + timedelta(minutes=2)).strftime('%Y-%m-%dT%H:%M:%S'))")
REMINDER_DATA="{\"reminder_type\":\"custom\",\"reminder_time\":\"${FUTURE_TIME}\",\"context_data\":{\"test\":true}}"
test_endpoint "POST /reminders (création)" "POST" "http://localhost:4001/reminders/" "$TOKEN" "$REMINDER_DATA"

# Créer automatiquement les rappels
test_endpoint "POST /reminders/auto-create" "POST" "http://localhost:4001/reminders/auto-create" "$TOKEN" "{}"
echo ""

# 6. Test de l'application web
echo "🌐 6. Test de l'application web..."
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000)
if [ "$WEB_RESPONSE" = "200" ]; then
    echo -e "  ${GREEN}✓ Application web accessible${NC} (HTTP $WEB_RESPONSE)"
    ((SUCCESS++))
else
    echo -e "  ${RED}✗ Application web inaccessible${NC} (HTTP $WEB_RESPONSE)"
    ((ERRORS++))
fi
echo ""

# 7. Vérification du Service Worker
echo "⚙️  7. Vérification du Service Worker..."
SW_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/sw.js)
if [ "$SW_RESPONSE" = "200" ]; then
    echo -e "  ${GREEN}✓ Service Worker accessible${NC} (HTTP $SW_RESPONSE)"
    ((SUCCESS++))
    
    # Vérifier le contenu du Service Worker
    SW_CONTENT=$(curl -s http://localhost:4000/sw.js)
    if echo "$SW_CONTENT" | grep -q "scheduleNotification"; then
        echo -e "  ${GREEN}✓ Service Worker contient la fonction scheduleNotification${NC}"
        ((SUCCESS++))
    else
        echo -e "  ${RED}✗ Service Worker ne contient pas scheduleNotification${NC}"
        ((ERRORS++))
    fi
    
    if echo "$SW_CONTENT" | grep -q "syncRemindersFromAPI"; then
        echo -e "  ${GREEN}✓ Service Worker contient la fonction syncRemindersFromAPI${NC}"
        ((SUCCESS++))
    else
        echo -e "  ${RED}✗ Service Worker ne contient pas syncRemindersFromAPI${NC}"
        ((ERRORS++))
    fi
else
    echo -e "  ${RED}✗ Service Worker inaccessible${NC} (HTTP $SW_RESPONSE)"
    ((ERRORS++))
fi
echo ""

# 8. Instructions pour tester manuellement
echo "📋 8. Instructions pour tester manuellement les notifications :"
echo ""
echo -e "${BLUE}Pour tester les notifications en arrière-plan :${NC}"
echo "  1. Ouvrez http://localhost:4000 dans votre navigateur"
echo "  2. Connectez-vous avec admin@taskflow.local / taskflow123"
echo "  3. Autorisez les notifications quand le navigateur le demande"
echo "  4. Vérifiez dans les DevTools (Application > Service Workers) que le SW est actif"
echo "  5. Créez un rappel avec une date/heure dans quelques minutes"
echo "  6. Fermez l'onglet du navigateur"
echo "  7. Attendez l'heure du rappel"
echo "  8. Une notification devrait apparaître même si l'app est fermée"
echo ""

# 9. Résumé
echo "📊 =========================================="
echo "📊 Résumé des tests"
echo "📊 =========================================="
echo -e "  ${GREEN}✓ Succès: $SUCCESS${NC}"
echo -e "  ${RED}✗ Erreurs: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Tous les tests sont passés avec succès !${NC}"
    echo -e "${YELLOW}⚠️  N'oubliez pas de tester manuellement les notifications en arrière-plan${NC}"
    exit 0
else
    echo -e "${RED}❌ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.${NC}"
    exit 1
fi

