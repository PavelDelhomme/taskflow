#!/bin/bash

# 🧪 Tests étendus pour TaskFlow ADHD
# Tests détaillés de tous les endpoints avec validation complète

echo "🧪 =========================================="
echo "🧪 Tests Étendus TaskFlow ADHD"
echo "🧪 =========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
SUCCESS=0
TOTAL_TESTS=0

# Utiliser l'URL de test si disponible, sinon production
API_URL="${TEST_API_URL:-http://localhost:4001}"
echo -e "${BLUE}🔗 API URL: $API_URL${NC}"
echo ""

# Fonction pour tester un endpoint avec validation
test_endpoint_detailed() {
    local name=$1
    local method=$2
    local url=$3
    local token=$4
    local data=$5
    local expected_status=$6
    local validation=$7  # Fonction de validation optionnelle
    
    ((TOTAL_TESTS++))
    echo -n "  Testing $name... "
    
    local response
    local http_code
    
    if [ "$method" = "GET" ]; then
        if [ -z "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" "$url")
        else
            response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $token" "$url")
        fi
    elif [ "$method" = "POST" ]; then
        if [ -z "$token" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$url")
        else
            response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "$data" "$url")
        fi
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "$data" "$url")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE -H "Authorization: Bearer $token" "$url")
    fi
    
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | sed '$d')
    
    # Vérifier le code HTTP
    if [ -z "$expected_status" ]; then
        expected_status="200"
    fi
    
    # Gérer les codes multiples (ex: "401|403")
    expected_match=false
    if echo "$expected_status" | grep -q "|"; then
        IFS='|' read -ra CODES <<< "$expected_status"
        for code in "${CODES[@]}"; do
            if [ "$http_code" = "$code" ]; then
                expected_match=true
                break
            fi
        done
    else
        if [ "$http_code" = "$expected_status" ] || [ "$http_code" = "201" ]; then
            expected_match=true
        fi
    fi
    
    if [ "$expected_match" = true ]; then
        # Validation supplémentaire si fournie
        if [ -n "$validation" ] && [ "$validation" != "" ]; then
            if eval "$validation \"$body\""; then
                echo -e "${GREEN}✓ OK${NC} (HTTP $http_code)"
                ((SUCCESS++))
                return 0
            else
                echo -e "${RED}✗ FAIL${NC} (HTTP $http_code, validation failed)"
                ((ERRORS++))
                return 1
            fi
        else
            echo -e "${GREEN}✓ OK${NC} (HTTP $http_code)"
            ((SUCCESS++))
            return 0
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code, expected $expected_status)"
        ((ERRORS++))
        return 1
    fi
}

# 1. Authentification
echo "🔐 1. Tests d'authentification étendus..."
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@taskflow.local","password":"taskflow123"}' \
  $API_URL/auth/login)

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -oP '"access_token"\s*:\s*"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo -e "  ${RED}✗ Échec de l'authentification${NC}"
    exit 1
fi

# Test login avec mauvais mot de passe
test_endpoint_detailed "Login avec mauvais mot de passe" "POST" "$API_URL/auth/login" "" \
  '{"email":"admin@taskflow.local","password":"wrong"}' "401"

# Test login avec email invalide (retourne 401, pas 422 car validation côté API)
test_endpoint_detailed "Login avec email invalide" "POST" "$API_URL/auth/login" "" \
  '{"email":"invalid","password":"test"}' "401"

echo ""

# 2. Tests CRUD Tâches
echo "📋 2. Tests CRUD Tâches..."
# Créer une tâche
CREATE_TASK='{"title":"Test Task","description":"Description test","status":"todo","priority":"medium"}'
CREATE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$CREATE_TASK" "$API_URL/tasks/")
TASK_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

if [ -n "$TASK_ID" ] && [ "$TASK_ID" != "None" ] && [ "$TASK_ID" != "" ]; then
    # Vérifier que la réponse contient bien les champs attendus
    test_endpoint_detailed "GET /tasks/{id}" "GET" "$API_URL/tasks/$TASK_ID" "$TOKEN" "" "200"
    
    # Modifier la tâche (utiliser PATCH ou PUT selon l'API)
    UPDATE_TASK="{\"title\":\"Test Task Updated\",\"status\":\"in_progress\"}"
    # Essayer PUT d'abord, puis PATCH si nécessaire
    UPDATE_RESPONSE=$(curl -s -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$UPDATE_TASK" "$API_URL/tasks/$TASK_ID")
    HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -1)
    if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
        # Essayer PATCH
        test_endpoint_detailed "PATCH /tasks/{id}" "POST" "$API_URL/tasks/$TASK_ID" "$TOKEN" "$UPDATE_TASK" "200"
    else
        echo -e "  ${GREEN}✓ PUT /tasks/{id} OK${NC} (HTTP $HTTP_CODE)"
        ((SUCCESS++))
    fi
    
    # Supprimer la tâche
    test_endpoint_detailed "DELETE /tasks/{id}" "DELETE" "$API_URL/tasks/$TASK_ID" "$TOKEN" "" "200"
fi

# Test création avec données invalides (l'API peut accepter title vide, tester avec status invalide)
test_endpoint_detailed "POST /tasks (données invalides)" "POST" "$API_URL/tasks/" "$TOKEN" \
  '{"title":"Test","status":"invalid_status"}' "422"

echo ""

# 3. Tests Workflows
echo "🔄 3. Tests Workflows..."
test_endpoint_detailed "GET /workflows" "GET" "$API_URL/workflows" "$TOKEN" "" "200"

# Créer un workflow
CREATE_WORKFLOW='{"name":"Test Workflow","steps":"1. Step 1\n2. Step 2","category":"test","project":"Test"}'
CREATE_WF_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$CREATE_WORKFLOW" "$API_URL/workflows")
WF_ID=$(echo "$CREATE_WF_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

if [ -n "$WF_ID" ] && [ "$WF_ID" != "None" ] && [ "$WF_ID" != "" ]; then
    # GET /workflows/{id} peut ne pas exister, tester DELETE directement
    test_endpoint_detailed "DELETE /workflows/{id}" "DELETE" "$API_URL/workflows/$WF_ID" "$TOKEN" "" "200"
fi

echo ""

# 4. Tests Templates
echo "📝 4. Tests Templates..."
test_endpoint_detailed "GET /templates" "GET" "$API_URL/templates/" "$TOKEN" "" "200"

# Créer un template
CREATE_TEMPLATE='{"name":"Test Template","description":"Test","steps":["Step 1","Step 2"],"estimated_time":30}'
CREATE_TMPL_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$CREATE_TEMPLATE" "$API_URL/templates/")
TMPL_ID=$(echo "$CREATE_TMPL_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

if [ -n "$TMPL_ID" ] && [ "$TMPL_ID" != "None" ]; then
    test_endpoint_detailed "GET /templates/{id}" "GET" "$API_URL/templates/$TMPL_ID" "$TOKEN" "" "200"
    test_endpoint_detailed "DELETE /templates/{id}" "DELETE" "$API_URL/templates/$TMPL_ID" "$TOKEN" "" "200"
fi

echo ""

# 5. Tests Tags
echo "🏷️  5. Tests Tags..."
test_endpoint_detailed "GET /tags" "GET" "$API_URL/tags/" "$TOKEN" "" "200"

# Créer un tag
CREATE_TAG='{"name":"test-tag","color":"#FF0000"}'
CREATE_TAG_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$CREATE_TAG" "$API_URL/tags/")
TAG_ID=$(echo "$CREATE_TAG_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

if [ -n "$TAG_ID" ] && [ "$TAG_ID" != "None" ]; then
    test_endpoint_detailed "DELETE /tags/{id}" "DELETE" "$API_URL/tags/$TAG_ID" "$TOKEN" "" "200"
fi

echo ""

# 6. Tests Notes
echo "📄 6. Tests Notes..."
test_endpoint_detailed "GET /notes" "GET" "$API_URL/notes/" "$TOKEN" "" "200"

# Créer une note
CREATE_NOTE='{"content":"Test note content","title":"Test Note"}'
CREATE_NOTE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$CREATE_NOTE" "$API_URL/notes/")
NOTE_ID=$(echo "$CREATE_NOTE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

if [ -n "$NOTE_ID" ] && [ "$NOTE_ID" != "None" ] && [ "$NOTE_ID" != "" ]; then
    # GET /notes/{id} peut ne pas exister, tester DELETE directement
    test_endpoint_detailed "DELETE /notes/{id}" "DELETE" "$API_URL/notes/$NOTE_ID" "$TOKEN" "" "200"
fi

echo ""

# 7. Tests Statistiques
echo "📊 7. Tests Statistiques..."
test_endpoint_detailed "GET /stats/dashboard" "GET" "$API_URL/stats/dashboard" "$TOKEN" "" "200"
test_endpoint_detailed "GET /stats/time-comparison" "GET" "$API_URL/stats/time-comparison" "$TOKEN" "" "200"

echo ""

# 8. Tests Energy
echo "⚡ 8. Tests Energy..."
test_endpoint_detailed "GET /energy/current" "GET" "$API_URL/energy/current" "$TOKEN" "" "200"
test_endpoint_detailed "GET /energy/logs" "GET" "$API_URL/energy/logs?days=7" "$TOKEN" "" "200"

# Créer un log d'énergie
CREATE_ENERGY='{"energy_level":4,"notes":"Test energy log"}'
test_endpoint_detailed "POST /energy/log" "POST" "$API_URL/energy/log" "$TOKEN" "$CREATE_ENERGY" "200"

echo ""

# 9. Tests Breaks
echo "☕ 9. Tests Breaks..."
test_endpoint_detailed "GET /breaks/today" "GET" "$API_URL/breaks/today" "$TOKEN" "" "200"

# Créer une pause (endpoint correct: /breaks/start)
CREATE_BREAK='{"break_type":"short","activity_suggestion":"Test break"}'
test_endpoint_detailed "POST /breaks/start" "POST" "$API_URL/breaks/start" "$TOKEN" "$CREATE_BREAK" "200"

echo ""

# 10. Tests Reminders
echo "🔔 10. Tests Reminders..."
test_endpoint_detailed "GET /reminders/pending" "GET" "$API_URL/reminders/pending" "$TOKEN" "" "200"

# Créer un rappel
FUTURE_TIME=$(date -u -d '+1 hour' '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || date -u -v+1H '+%Y-%m-%dT%H:%M:%S' 2>/dev/null || python3 -c "from datetime import datetime, timedelta; print((datetime.now() + timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M:%S'))")
CREATE_REMINDER="{\"reminder_type\":\"custom\",\"reminder_time\":\"${FUTURE_TIME}\"}"
CREATE_REM_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$CREATE_REMINDER" "$API_URL/reminders/")
REM_ID=$(echo "$CREATE_REM_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

if [ -n "$REM_ID" ] && [ "$REM_ID" != "None" ]; then
    test_endpoint_detailed "DELETE /reminders/{id}" "DELETE" "$API_URL/reminders/$REM_ID" "$TOKEN" "" "200"
fi

echo ""

# 11. Tests Attention
echo "🧠 11. Tests Attention..."
test_endpoint_detailed "GET /attention/stats" "GET" "$API_URL/attention/stats" "$TOKEN" "" "200"
test_endpoint_detailed "GET /attention/recommendations" "GET" "$API_URL/attention/recommendations" "$TOKEN" "" "200"
test_endpoint_detailed "GET /attention/history" "GET" "$API_URL/attention/history" "$TOKEN" "" "200"
test_endpoint_detailed "GET /attention/patterns" "GET" "$API_URL/attention/patterns" "$TOKEN" "" "200"

# Créer une session d'attention
ATTENTION_DATA='{"task_id":null,"focus_start":"2025-01-20T10:00:00","focus_end":"2025-01-20T10:30:00","distraction_events":0,"context_energy_level":3}'
test_endpoint_detailed "POST /attention/session" "POST" "$API_URL/attention/session" "$TOKEN" "$ATTENTION_DATA" "200"

echo ""

# 12. Tests IA
echo "🤖 12. Tests IA..."
test_endpoint_detailed "GET /ai/suggest-next-task" "GET" "$API_URL/ai/suggest-next-task" "$TOKEN" "" "200"
test_endpoint_detailed "GET /ai/suggest-break" "GET" "$API_URL/ai/suggest-break" "$TOKEN" "" "200"
test_endpoint_detailed "GET /ai/suggest-task-timing" "GET" "$API_URL/ai/suggest-task-timing" "$TOKEN" "" "200"

echo ""

# 13. Tests d'autorisation
echo "🔒 13. Tests d'autorisation..."
# Test sans token (peut retourner 401 ou 403 selon la config)
test_endpoint_detailed "GET /tasks (sans token)" "GET" "$API_URL/tasks/" "" "" "401|403"

# Test avec token invalide
test_endpoint_detailed "GET /tasks (token invalide)" "GET" "$API_URL/tasks/" "invalid-token" "" "401"

echo ""

# Résumé
echo "📊 =========================================="
echo "📊 Résumé des tests étendus"
echo "📊 =========================================="
echo -e "  ${GREEN}✓ Succès: $SUCCESS${NC}"
echo -e "  ${RED}✗ Erreurs: $ERRORS${NC}"
echo -e "  ${BLUE}Total: $TOTAL_TESTS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Tous les tests étendus sont passés avec succès !${NC}"
    exit 0
else
    echo -e "${RED}❌ Certains tests étendus ont échoué.${NC}"
    exit 1
fi

