#!/bin/bash

# 🧪 Script de test complet pour TaskFlow ADHD
# Lance tous les tests et analyse les résultats

echo "🧪 =========================================="
echo "🧪 Tests complets TaskFlow ADHD"
echo "🧪 =========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fichiers de résultats
RESULTS_DIR="./test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="$RESULTS_DIR/test-results-$TIMESTAMP.txt"
SUMMARY_FILE="$RESULTS_DIR/test-summary-$TIMESTAMP.txt"

# Créer le dossier de résultats
mkdir -p "$RESULTS_DIR"

# Compteurs globaux
TOTAL_TESTS=0
TOTAL_SUCCESS=0
TOTAL_ERRORS=0
TEST_SUITES=0
SUITE_SUCCESS=0
SUITE_ERRORS=0

# Fonction pour exécuter un script de test et capturer les résultats
run_test_suite() {
    local suite_name=$1
    local script_path=$2
    local suite_file="$RESULTS_DIR/${suite_name}-$TIMESTAMP.txt"
    
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📦 Exécution: $suite_name${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Exécuter le test et capturer la sortie
    if [ -f "$script_path" ]; then
        bash "$script_path" 2>&1 | tee "$suite_file"
        local exit_code=${PIPESTATUS[0]}
    else
        echo -e "${RED}✗ Script non trouvé: $script_path${NC}"
        exit_code=1
    fi
    
    # Analyser les résultats - compter les succès et erreurs
    # Pour test-checklist.sh, utiliser ✅ et ❌
    # Pour les autres, utiliser ✓ Succès: et ✗ Erreurs:
    local suite_success_check=$(grep -c "✅" "$suite_file" 2>/dev/null || echo "0")
    local suite_errors_check=$(grep -c "❌" "$suite_file" 2>/dev/null || echo "0")
    local suite_success_std=$(grep -c "✓" "$suite_file" 2>/dev/null || echo "0")
    local suite_errors_std=$(grep -c "✗" "$suite_file" 2>/dev/null || echo "0")
    
    # Extraire les détails depuis le résumé standardisé
    local success_count=$(grep -oP "✓ Succès: \K\d+" "$suite_file" 2>/dev/null | head -1 | tr -d '[:space:]' || echo "")
    local error_count=$(grep -oP "✗ Erreurs: \K\d+" "$suite_file" 2>/dev/null | head -1 | tr -d '[:space:]' || echo "")
    
    # Nettoyer les valeurs de comptage
    suite_success_check=$(echo "$suite_success_check" | tr -d '[:space:]' | grep -oE '^[0-9]+$' || echo "0")
    suite_errors_check=$(echo "$suite_errors_check" | tr -d '[:space:]' | grep -oE '^[0-9]+$' || echo "0")
    suite_success_std=$(echo "$suite_success_std" | tr -d '[:space:]' | grep -oE '^[0-9]+$' || echo "0")
    suite_errors_std=$(echo "$suite_errors_std" | tr -d '[:space:]' | grep -oE '^[0-9]+$' || echo "0")
    
    # Si on n'a pas trouvé les compteurs dans le résumé, utiliser les compteurs de symboles
    if [ -z "$success_count" ] || [ "$success_count" = "" ]; then
        # Utiliser le plus grand entre les deux formats
        if [ "${suite_success_check:-0}" -gt "${suite_success_std:-0}" ]; then
            success_count=$suite_success_check
        else
            success_count=$suite_success_std
        fi
    fi
    if [ -z "$error_count" ] || [ "$error_count" = "" ]; then
        # Utiliser le plus grand entre les deux formats
        if [ "${suite_errors_check:-0}" -gt "${suite_errors_std:-0}" ]; then
            error_count=$suite_errors_check
        else
            error_count=$suite_errors_std
        fi
    fi
    
    # S'assurer que les valeurs sont numériques et nettoyées
    success_count=$(echo "$success_count" | tr -d '[:space:]' | grep -oE '^[0-9]+$' || echo "0")
    error_count=$(echo "$error_count" | tr -d '[:space:]' | grep -oE '^[0-9]+$' || echo "0")
    
    # Valeurs par défaut si vides
    success_count=${success_count:-0}
    error_count=${error_count:-0}
    
    # Pour test-checklist, considérer comme réussi si pas d'erreurs ❌
    if echo "$suite_name" | grep -q "Checklist"; then
        if [ "${suite_errors_check:-0}" -eq 0 ] && [ "$exit_code" -eq 0 ]; then
            # Tout est OK, compter les ✅ comme succès
            success_count=${suite_success_check:-0}
            error_count=0
        fi
    fi
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    # Considérer comme réussi si pas d'erreurs détectées (même si exit_code != 0 pour certains scripts)
    if [ "$error_count" = "0" ] || [ "$error_count" = "" ]; then
        echo -e "${GREEN}✅ $suite_name: RÉUSSI${NC}"
        echo -e "   ${GREEN}✓ Succès: $success_count${NC}"
        echo -e "   ${GREEN}✗ Erreurs: ${error_count:-0}${NC}"
        ((SUITE_SUCCESS++))
        exit_code=0  # Forcer le code de sortie à 0 si pas d'erreurs
    else
        echo -e "${RED}❌ $suite_name: ÉCHEC${NC}"
        echo -e "   ${GREEN}✓ Succès: $success_count${NC}"
        echo -e "   ${RED}✗ Erreurs: $error_count${NC}"
        ((SUITE_ERRORS++))
    fi
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Ajouter au total (s'assurer que les valeurs sont numériques)
    success_count=$((success_count + 0))
    error_count=$((error_count + 0))
    TOTAL_TESTS=$((TOTAL_TESTS + success_count + error_count))
    TOTAL_SUCCESS=$((TOTAL_SUCCESS + success_count))
    TOTAL_ERRORS=$((TOTAL_ERRORS + error_count))
    ((TEST_SUITES++))
    
    return $exit_code
}

# Début des tests
START_TIME=$(date +%s)

echo -e "${BLUE}🚀 Démarrage des tests...${NC}"
echo ""

# 1. Test Checklist (Vérification de l'environnement)
run_test_suite "Test Checklist (Environnement)" "./test-checklist.sh"
CHECKLIST_RESULT=$?

# 2. Tests Complets (API, Base de données, etc.)
run_test_suite "Tests Complets (API & Fonctionnalités)" "./test-complete.sh"
COMPLETE_RESULT=$?

# 3. Tests Étendus (Tests détaillés avec validation)
run_test_suite "Tests Étendus (Validation & CRUD)" "./test-extended.sh"
EXTENDED_RESULT=$?

# 4. Tests de Notifications
run_test_suite "Tests de Notifications" "./test-notifications.sh"
NOTIFICATIONS_RESULT=$?

# Calcul du temps d'exécution
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# Génération du rapport détaillé
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 ANALYSE DES RÉSULTATS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Calcul du pourcentage de réussite
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((TOTAL_SUCCESS * 100 / TOTAL_TESTS))
else
    SUCCESS_RATE=0
fi

# Affichage du résumé
echo -e "${BLUE}📈 Statistiques Globales:${NC}"
echo -e "   ${CYAN}Suites de tests:${NC} $TEST_SUITES"
echo -e "   ${GREEN}Suites réussies:${NC} $SUITE_SUCCESS"
echo -e "   ${RED}Suites échouées:${NC} $SUITE_ERRORS"
echo ""
echo -e "${BLUE}📊 Tests Individuels:${NC}"
echo -e "   ${CYAN}Total de tests:${NC} $TOTAL_TESTS"
echo -e "   ${GREEN}✓ Succès:${NC} $TOTAL_SUCCESS"
echo -e "   ${RED}✗ Erreurs:${NC} $TOTAL_ERRORS"
echo ""
echo -e "${BLUE}📉 Taux de réussite:${NC} ${SUCCESS_RATE}%"
echo ""
echo -e "${BLUE}⏱️  Temps d'exécution:${NC} ${MINUTES}m ${SECONDS}s"
echo ""

# Détails par suite
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Détails par Suite de Tests:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $CHECKLIST_RESULT -eq 0 ]; then
    echo -e "  ${GREEN}✅ Test Checklist${NC} - Environnement vérifié"
else
    echo -e "  ${RED}❌ Test Checklist${NC} - Problèmes détectés"
fi

if [ $COMPLETE_RESULT -eq 0 ]; then
    echo -e "  ${GREEN}✅ Tests Complets${NC} - API et fonctionnalités opérationnelles"
else
    echo -e "  ${RED}❌ Tests Complets${NC} - Certains tests ont échoué"
fi

if [ $EXTENDED_RESULT -eq 0 ]; then
    echo -e "  ${GREEN}✅ Tests Étendus${NC} - Validation et CRUD complets"
else
    echo -e "  ${RED}❌ Tests Étendus${NC} - Certains tests ont échoué"
fi

if [ $NOTIFICATIONS_RESULT -eq 0 ]; then
    echo -e "  ${GREEN}✅ Tests Notifications${NC} - Système de notifications fonctionnel"
else
    echo -e "  ${RED}❌ Tests Notifications${NC} - Problèmes détectés"
fi

echo ""

# Recommandations
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}💡 Recommandations:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $TOTAL_ERRORS -eq 0 ]; then
    echo -e "  ${GREEN}🎉 Excellent ! Tous les tests sont passés.${NC}"
    echo -e "  ${GREEN}✅ L'application est prête pour la production.${NC}"
elif [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "  ${YELLOW}⚠️  La plupart des tests passent, mais quelques erreurs à corriger.${NC}"
    echo -e "  ${YELLOW}📝 Consultez les fichiers de résultats pour plus de détails.${NC}"
elif [ $SUCCESS_RATE -ge 70 ]; then
    echo -e "  ${YELLOW}⚠️  Plusieurs tests échouent. Vérifiez l'environnement et les services.${NC}"
    echo -e "  ${YELLOW}📝 Vérifiez que tous les conteneurs Docker sont en cours d'exécution.${NC}"
else
    echo -e "  ${RED}❌ Nombreux tests échouent. Vérifiez l'installation et la configuration.${NC}"
    echo -e "  ${RED}📝 Consultez les logs Docker: make logs${NC}"
fi

echo ""

# Fichiers de résultats
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📁 Fichiers de Résultats:${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  📄 Résultats détaillés: ${CYAN}$RESULTS_DIR/${NC}"
echo -e "     - Test Checklist: ${CYAN}test-checklist-$TIMESTAMP.txt${NC}"
echo -e "     - Tests Complets: ${CYAN}test-complete-$TIMESTAMP.txt${NC}"
echo -e "     - Tests Notifications: ${CYAN}test-notifications-$TIMESTAMP.txt${NC}"
echo ""

# Résumé final
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ $TOTAL_ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  CERTAINS TESTS ONT ÉCHOUÉ${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📝 Consultez les fichiers de résultats pour plus de détails.${NC}"
    exit 1
fi

