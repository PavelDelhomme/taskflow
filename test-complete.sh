#!/bin/bash

# 🧪 Script de test complet pour TaskFlow ADHD
# Vérifie que tous les éléments fonctionnent correctement

echo "🧪 =========================================="
echo "🧪 Tests complets TaskFlow ADHD"
echo "🧪 =========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

# 4. Test de santé de l'API
echo "🏥 4. Tests de santé de l'API..."
test_endpoint "Health Check" "GET" "http://localhost:4001/health" ""
test_endpoint "Root API" "GET" "http://localhost:4001/" ""
echo ""

# 5. Test d'authentification
echo "🔐 5. Tests d'authentification..."
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@taskflow.local","password":"taskflow123"}' \
  http://localhost:4001/auth/login)

# Extraire le token avec plusieurs méthodes
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    # Méthode alternative
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -oP '"access_token"\s*:\s*"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo -e "  ${RED}✗ Échec de l'authentification${NC}"
    echo "  Réponse: $LOGIN_RESPONSE"
    ((ERRORS++))
    echo "  ${YELLOW}⚠ Les tests suivants nécessitent une authentification${NC}"
else
    echo -e "  ${GREEN}✓ Authentification réussie${NC}"
    ((SUCCESS++))
fi
echo ""

# 6. Tests des endpoints de base
echo "📋 6. Tests des endpoints de base..."
test_endpoint "GET /tasks" "GET" "http://localhost:4001/tasks/" "$TOKEN"
test_endpoint "GET /workflows" "GET" "http://localhost:4001/workflows" "$TOKEN"
test_endpoint "GET /stats/dashboard" "GET" "http://localhost:4001/stats/dashboard" "$TOKEN"
test_endpoint "GET /templates" "GET" "http://localhost:4001/templates/" "$TOKEN"
test_endpoint "GET /tags" "GET" "http://localhost:4001/tags/" "$TOKEN"
test_endpoint "GET /notes" "GET" "http://localhost:4001/notes/" "$TOKEN"
echo ""

# 7. Tests du mécanisme d'attention
echo "🧠 7. Tests du mécanisme d'attention..."
test_endpoint "GET /attention/stats" "GET" "http://localhost:4001/attention/stats" "$TOKEN"
test_endpoint "GET /attention/recommendations" "GET" "http://localhost:4001/attention/recommendations" "$TOKEN"
test_endpoint "GET /attention/history" "GET" "http://localhost:4001/attention/history" "$TOKEN"
test_endpoint "GET /attention/patterns" "GET" "http://localhost:4001/attention/patterns" "$TOKEN"

# Test création d'une session d'attention
ATTENTION_DATA='{"task_id":null,"focus_start":"2025-01-20T10:00:00","focus_end":"2025-01-20T10:30:00","distraction_events":0,"context_energy_level":3}'
test_endpoint "POST /attention/session" "POST" "http://localhost:4001/attention/session" "$TOKEN" "$ATTENTION_DATA"
echo ""

# 8. Tests de l'IA
echo "🤖 8. Tests de l'IA (suggestions basées sur l'attention)..."
test_endpoint "GET /ai/suggest-next-task" "GET" "http://localhost:4001/ai/suggest-next-task" "$TOKEN"
test_endpoint "GET /ai/suggest-break" "GET" "http://localhost:4001/ai/suggest-break" "$TOKEN"
echo ""

# 9. Tests des autres fonctionnalités
echo "⚡ 9. Tests des autres fonctionnalités..."
test_endpoint "GET /energy/current" "GET" "http://localhost:4001/energy/current" "$TOKEN"
test_endpoint "GET /energy/logs" "GET" "http://localhost:4001/energy/logs?days=7" "$TOKEN"
test_endpoint "GET /breaks/today" "GET" "http://localhost:4001/breaks/today" "$TOKEN"
test_endpoint "GET /reminders/pending" "GET" "http://localhost:4001/reminders/pending" "$TOKEN"
test_endpoint "GET /stats/time-comparison" "GET" "http://localhost:4001/stats/time-comparison" "$TOKEN"
echo ""

# 10. Test de l'application web
echo "🌐 10. Test de l'application web..."
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000)
if [ "$WEB_RESPONSE" = "200" ]; then
    echo -e "  ${GREEN}✓ Application web accessible${NC} (HTTP $WEB_RESPONSE)"
    ((SUCCESS++))
else
    echo -e "  ${RED}✗ Application web inaccessible${NC} (HTTP $WEB_RESPONSE)"
    ((ERRORS++))
fi
echo ""

# 11. Vérification de la base de données
echo "🗄️  11. Vérification de la base de données..."
DB_CHECK=$(docker exec taskflow-db psql -U taskflow -d taskflow_adhd -c "SELECT COUNT(*) FROM users;" 2>&1)
if echo "$DB_CHECK" | grep -q "ERROR"; then
    echo -e "  ${RED}✗ Erreur de connexion à la base de données${NC}"
    echo "  $DB_CHECK"
    ((ERRORS++))
else
    echo -e "  ${GREEN}✓ Base de données accessible${NC}"
    ((SUCCESS++))
    
    # Vérifier que la table attention_logs existe
    TABLE_CHECK=$(docker exec taskflow-db psql -U taskflow -d taskflow_adhd -c "\d attention_logs" 2>&1)
    if echo "$TABLE_CHECK" | grep -q "attention_logs"; then
        echo -e "  ${GREEN}✓ Table attention_logs existe${NC}"
        ((SUCCESS++))
    else
        echo -e "  ${RED}✗ Table attention_logs n'existe pas${NC}"
        ((ERRORS++))
    fi
fi
echo ""

# 12. Résumé
echo "📊 =========================================="
echo "📊 Résumé des tests"
echo "📊 =========================================="
echo -e "  ${GREEN}✓ Succès: $SUCCESS${NC}"
echo -e "  ${RED}✗ Erreurs: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Tous les tests sont passés avec succès !${NC}"
    exit 0
else
    echo -e "${RED}❌ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.${NC}"
    exit 1
fi

