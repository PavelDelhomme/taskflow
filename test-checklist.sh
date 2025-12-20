#!/bin/bash

# 🧪 Script de vérification automatique de TaskFlow ADHD
# Ce script vérifie que tous les services sont démarrés et accessibles

echo "🧪 Vérification de TaskFlow ADHD..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour vérifier un service
check_service() {
    local name=$1
    local url=$2
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302\|307"; then
        echo -e "${GREEN}✅${NC} $name est accessible"
        return 0
    else
        echo -e "${RED}❌${NC} $name n'est pas accessible"
        return 1
    fi
}

# Vérifier les conteneurs Docker
echo "📦 Vérification des conteneurs Docker..."
if docker ps | grep -q "taskflow-web"; then
    echo -e "${GREEN}✅${NC} Conteneur taskflow-web est démarré"
else
    echo -e "${RED}❌${NC} Conteneur taskflow-web n'est pas démarré"
    echo "   Lancez: make start"
    exit 1
fi

if docker ps | grep -q "taskflow-api"; then
    echo -e "${GREEN}✅${NC} Conteneur taskflow-api est démarré"
else
    echo -e "${RED}❌${NC} Conteneur taskflow-api n'est pas démarré"
    echo "   Lancez: make start"
    exit 1
fi

if docker ps | grep -q "taskflow-db"; then
    echo -e "${GREEN}✅${NC} Conteneur taskflow-db est démarré"
else
    echo -e "${RED}❌${NC} Conteneur taskflow-db n'est pas démarré"
    echo "   Lancez: make start"
    exit 1
fi

echo ""

# Vérifier les services
echo "🌐 Vérification des services..."

check_service "Frontend (Web)" "http://localhost:4000"
check_service "API Backend" "http://localhost:4001/docs"
check_service "API Health" "http://localhost:4001/health"

echo ""

# Vérifier la base de données
echo "🗄️  Vérification de la base de données..."
if docker exec taskflow-db psql -U taskflow -d taskflow_adhd -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Base de données est accessible"
    
    # Vérifier les tables
    TABLES=$(docker exec taskflow-db psql -U taskflow -d taskflow_adhd -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'tasks', 'workflows');")
    if [ "$TABLES" -eq 3 ]; then
        echo -e "${GREEN}✅${NC} Toutes les tables existent"
    else
        echo -e "${YELLOW}⚠️${NC}  Certaines tables manquent"
    fi
    
    # Vérifier les colonnes importantes
    if docker exec taskflow-db psql -U taskflow -d taskflow_adhd -c "\d tasks" | grep -q "project"; then
        echo -e "${GREEN}✅${NC} Colonne 'project' existe dans tasks"
    else
        echo -e "${YELLOW}⚠️${NC}  Colonne 'project' manquante dans tasks - Lancez: make migrate"
    fi
    
    if docker exec taskflow-db psql -U taskflow -d taskflow_adhd -c "\d tasks" | grep -q "due_date"; then
        echo -e "${GREEN}✅${NC} Colonne 'due_date' existe dans tasks"
    else
        echo -e "${YELLOW}⚠️${NC}  Colonne 'due_date' manquante dans tasks - Lancez: make migrate"
    fi
    
    if docker exec taskflow-db psql -U taskflow -d taskflow_adhd -c "\d tasks" | grep -q "time_spent_seconds"; then
        echo -e "${GREEN}✅${NC} Colonnes de time tracking existent dans tasks"
    else
        echo -e "${YELLOW}⚠️${NC}  Colonnes de time tracking manquantes - Lancez: make migrate"
    fi
else
    echo -e "${RED}❌${NC} Base de données n'est pas accessible"
fi

echo ""

# Vérifier les fichiers importants
echo "📁 Vérification des fichiers..."
if [ -f "taskflow-api/migration_add_project_to_tasks.sql" ]; then
    echo -e "${GREEN}✅${NC} Migration project_to_tasks existe"
else
    echo -e "${YELLOW}⚠️${NC}  Migration project_to_tasks manquante"
fi

if [ -f "taskflow-api/generate-test-data-with-due-dates.sql" ]; then
    echo -e "${GREEN}✅${NC} Script de test avec échéances existe"
else
    echo -e "${YELLOW}⚠️${NC}  Script de test avec échéances manquant"
fi

echo ""

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Résumé:"
echo ""
echo "Pour tester l'application complètement:"
echo "1. Ouvrez http://localhost:4000 dans votre navigateur"
echo "2. Connectez-vous avec:"
echo "   Email: test@delhomme.ovh"
echo "   Mot de passe: 2H8'Z&sx@QW+X=v,dz[tnsv\$F"
echo "3. Suivez le guide TESTS.md pour les tests détaillés"
echo ""
echo "Commandes utiles:"
echo "  make start          - Démarrer tous les services"
echo "  make stop           - Arrêter tous les services"
echo "  make restart        - Redémarrer tous les services"
echo "  make migrate        - Appliquer les migrations"
echo "  make test-data-due-dates - Générer les données de test"
echo "  make logs           - Voir les logs"
echo "  make status         - Voir le statut des conteneurs"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

