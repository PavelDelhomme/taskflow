#!/bin/bash

# 🎤 Script de Test des Commandes Vocales - TaskFlow ADHD
# Ce script teste l'interface et la disponibilité des commandes vocales

# Couleurs pour l'output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🎤 ==========================================${NC}"
echo -e "${CYAN}🎤 Tests des Commandes Vocales TaskFlow${NC}"
echo -e "${CYAN}🎤 ==========================================${NC}"
echo ""

# Variables
API_URL="${TEST_API_URL:-http://localhost:4001}"
WEB_URL="http://localhost:4000"
ERRORS=0
SUCCESS=0

# Fonction pour tester un endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local token=$4
    local expected_status=$5
    
    if [ -n "$token" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Authorization: Bearer $token" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "$expected_status" ]; then
        echo -e "  ${GREEN}✓${NC} $name (HTTP $http_code)"
        ((SUCCESS++))
        return 0
    else
        echo -e "  ${RED}✗${NC} $name (HTTP $http_code, expected $expected_status)"
        ((ERRORS++))
        return 1
    fi
}

# 1. Vérification Docker
echo -e "${BLUE}📦 1. Vérification Docker...${NC}"
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} Docker fonctionne"
        ((SUCCESS++))
    else
        echo -e "  ${RED}✗${NC} Docker ne fonctionne pas"
        ((ERRORS++))
    fi
else
    echo -e "  ${RED}✗${NC} Docker n'est pas installé"
    ((ERRORS++))
fi
echo ""

# 2. Vérification des conteneurs
echo -e "${BLUE}🐳 2. Vérification des conteneurs...${NC}"
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

# 3. Attente que les services soient prêts
echo -e "${BLUE}⏳ 3. Attente que les services soient prêts...${NC}"
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" | grep -q "200"; then
        echo -e "  ${GREEN}✓${NC} API est prête"
        ((SUCCESS++))
        break
    fi
    sleep 1
    ((attempt++))
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "  ${RED}✗${NC} API n'est pas prête après $max_attempts tentatives"
    ((ERRORS++))
fi
echo ""

# 4. Tests d'authentification
echo -e "${BLUE}🔐 4. Tests d'authentification...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"email":"admin@taskflow.local","password":"taskflow123"}' \
    "$API_URL/auth/login")

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)

if [ -n "$TOKEN" ] && [ "$TOKEN" != "None" ]; then
    echo -e "  ${GREEN}✓${NC} Authentification réussie"
    ((SUCCESS++))
else
    echo -e "  ${RED}✗${NC} Échec de l'authentification"
    ((ERRORS++))
    echo "  ${RED}Impossible de continuer sans token${NC}"
    exit 1
fi
echo ""

# 5. Tests de l'application web
echo -e "${BLUE}🌐 5. Tests de l'application web...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$WEB_URL" | grep -q "200"; then
    echo -e "  ${GREEN}✓${NC} Application web accessible (HTTP 200)"
    ((SUCCESS++))
else
    echo -e "  ${RED}✗${NC} Application web non accessible"
    ((ERRORS++))
fi
echo ""

# 6. Tests de disponibilité des fonctionnalités
echo -e "${BLUE}🧪 6. Tests de disponibilité des fonctionnalités...${NC}"

# Test que les endpoints nécessaires pour les commandes vocales existent
test_endpoint "GET /tasks" "GET" "$API_URL/tasks/" "$TOKEN" "200"
test_endpoint "GET /templates" "GET" "$API_URL/templates/" "$TOKEN" "200"
test_endpoint "GET /tags" "GET" "$API_URL/tags/" "$TOKEN" "200"
test_endpoint "GET /notes" "GET" "$API_URL/notes/" "$TOKEN" "200"
test_endpoint "GET /stats/dashboard" "GET" "$API_URL/stats/dashboard" "$TOKEN" "200"
test_endpoint "GET /breaks/today" "GET" "$API_URL/breaks/today" "$TOKEN" "200"
test_endpoint "GET /energy/current" "GET" "$API_URL/energy/current" "$TOKEN" "200"
test_endpoint "GET /reminders/pending" "GET" "$API_URL/reminders/pending" "$TOKEN" "200"
echo ""

# 7. Vérification du Service Worker (pour notifications)
echo -e "${BLUE}⚙️  7. Vérification du Service Worker...${NC}"
SW_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL/sw.js")
if [ "$SW_RESPONSE" == "200" ]; then
    echo -e "  ${GREEN}✓${NC} Service Worker accessible (HTTP 200)"
    ((SUCCESS++))
    
    # Vérifier que le SW contient les fonctions nécessaires
    SW_CONTENT=$(curl -s "$WEB_URL/sw.js")
    if echo "$SW_CONTENT" | grep -q "scheduleNotification"; then
        echo -e "  ${GREEN}✓${NC} Service Worker contient scheduleNotification"
        ((SUCCESS++))
    else
        echo -e "  ${YELLOW}⚠${NC}  scheduleNotification non trouvé dans le SW"
    fi
    
    if echo "$SW_CONTENT" | grep -q "syncRemindersFromAPI"; then
        echo -e "  ${GREEN}✓${NC} Service Worker contient syncRemindersFromAPI"
        ((SUCCESS++))
    else
        echo -e "  ${YELLOW}⚠${NC}  syncRemindersFromAPI non trouvé dans le SW"
    fi
else
    echo -e "  ${RED}✗${NC} Service Worker non accessible (HTTP $SW_RESPONSE)"
    ((ERRORS++))
fi
echo ""

# 8. Instructions pour les tests manuels
echo -e "${BLUE}📋 8. Instructions pour les tests manuels des commandes vocales :${NC}"
echo ""
echo -e "${CYAN}Pour tester les commandes vocales manuellement :${NC}"
echo ""
echo "  1. Ouvrez http://localhost:4000 dans votre navigateur"
echo "  2. Connectez-vous avec :"
echo "     Email: admin@taskflow.local"
echo "     Mot de passe: taskflow123"
echo ""
echo "  3. Testez les commandes vocales :"
echo ""
echo -e "     ${GREEN}Activation :${NC}"
echo "     - Cliquez sur le bouton 🎤 Voix dans la navbar"
echo "     - OU appuyez sur Ctrl+Shift+V"
echo ""
echo -e "     ${GREEN}Commandes de navigation :${NC}"
echo "     - Dites 'calendrier' pour ouvrir le calendrier"
echo "     - Dites 'statistiques' pour ouvrir les stats"
echo "     - Dites 'templates' pour ouvrir les templates"
echo "     - Dites 'tags' pour ouvrir les tags"
echo "     - Dites 'notes' pour ouvrir les notes"
echo "     - Dites 'pauses' pour ouvrir les pauses"
echo "     - Dites 'énergie' pour ouvrir le suivi d'énergie"
echo "     - Dites 'rappels' pour ouvrir les rappels"
echo "     - Dites 'timeline' pour ouvrir la timeline"
echo "     - Dites 'time awareness' pour ouvrir Time Awareness"
echo "     - Dites 'corbeille' pour ouvrir la corbeille"
echo ""
echo -e "     ${GREEN}Commandes de création :${NC}"
echo "     - Dites 'créer tâche' pour ouvrir le formulaire"
echo "     - Dites 'créer tâche Réunion équipe' pour créer avec titre"
echo ""
echo -e "     ${GREEN}Commandes d'action :${NC}"
echo "     - Dites 'fermer' pour fermer tous les modals"
echo "     - Dites 'aide' pour voir toutes les commandes"
echo ""
echo -e "     ${GREEN}Vérifications visuelles :${NC}"
echo "     - Le bouton 🎤 doit avoir une animation pulse quand l'écoute est active"
echo "     - La transcription doit apparaître sous le bouton en temps réel"
echo "     - Les notifications doivent confirmer les actions"
echo ""
echo -e "     ${GREEN}Tests de feedback :${NC}"
echo "     - Vérifiez que le son de confirmation joue (si activé)"
echo "     - Vérifiez que les modals s'ouvrent correctement"
echo "     - Vérifiez que les erreurs s'affichent si la commande n'est pas reconnue"
echo ""
echo -e "     ${GREEN}Modal d'aide :${NC}"
echo "     - Dites 'aide' pour ouvrir la modal"
echo "     - Vérifiez que toutes les commandes sont listées"
echo "     - Testez le paramètre feedback audio"
echo ""
echo ""

# 9. Résumé
echo -e "${BLUE}📊 ==========================================${NC}"
echo -e "${BLUE}📊 Résumé des tests${NC}"
echo -e "${BLUE}📊 ==========================================${NC}"
echo ""
echo -e "  ${GREEN}✓ Succès: $SUCCESS${NC}"
echo -e "  ${RED}✗ Erreurs: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Tous les tests automatiques sont passés !${NC}"
    echo -e "${YELLOW}⚠️  N'oubliez pas de tester manuellement les commandes vocales dans le navigateur${NC}"
    exit 0
else
    echo -e "${RED}❌ Certains tests ont échoué${NC}"
    exit 1
fi

