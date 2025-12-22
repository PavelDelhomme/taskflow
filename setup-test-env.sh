#!/bin/bash

# 🧪 Script de configuration de l'environnement de test isolé

echo "🧪 Configuration de l'environnement de test isolé..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Démarrer l'environnement de test
echo -e "${BLUE}📦 Démarrage des conteneurs de test...${NC}"
docker-compose -f docker-compose.test.yml up -d

echo ""
echo -e "${YELLOW}⏳ Attente que les services soient prêts...${NC}"
sleep 10

# Vérifier que les conteneurs sont démarrés
if docker ps | grep -q "taskflow-api-test\|taskflow-db-test"; then
    echo -e "${GREEN}✅ Environnement de test démarré${NC}"
    echo ""
    echo -e "${BLUE}📊 Services de test:${NC}"
    echo -e "  - API Test: http://localhost:4003"
    echo -e "  - DB Test: localhost:4004"
    echo ""
    echo -e "${GREEN}✅ Environnement de test prêt !${NC}"
    echo -e "${YELLOW}💡 Utilisez TEST_API_URL=http://localhost:4003 pour les tests${NC}"
else
    echo -e "${RED}❌ Erreur lors du démarrage de l'environnement de test${NC}"
    exit 1
fi

