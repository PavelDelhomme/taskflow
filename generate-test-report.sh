#!/bin/bash

# 📊 Générateur de rapport de tests détaillé pour TaskFlow ADHD
# Analyse les résultats des tests et génère un rapport complet en JSON et HTML

RESULTS_DIR="./test-results"
REPORT_DIR="./test-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
JSON_REPORT="$REPORT_DIR/test-report-$TIMESTAMP.json"
HTML_REPORT="$REPORT_DIR/test-report-$TIMESTAMP.html"

# Créer les dossiers
mkdir -p "$REPORT_DIR"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}📊 Génération du rapport de tests détaillé...${NC}"
echo ""

# Trouver le dernier rapport de test
LATEST_TEST=$(ls -t "$RESULTS_DIR"/*.txt 2>/dev/null | head -1)

if [ -z "$LATEST_TEST" ]; then
    echo -e "${RED}❌ Aucun fichier de résultats trouvé dans $RESULTS_DIR${NC}"
    exit 1
fi

echo -e "${CYAN}Analyse des fichiers de résultats...${NC}"

# Structure JSON pour le rapport
cat > "$JSON_REPORT" << 'EOF'
{
  "metadata": {
    "generated_at": "TIMESTAMP_PLACEHOLDER",
    "project": "TaskFlow ADHD",
    "version": "1.0.0"
  },
  "test_suites": []
}
EOF

# Remplacer le timestamp
sed -i "s/TIMESTAMP_PLACEHOLDER/$(date -Iseconds)/" "$JSON_REPORT"

# Analyser chaque suite de tests
for suite_file in "$RESULTS_DIR"/Test*.txt "$RESULTS_DIR"/Tests*.txt; do
    if [ ! -f "$suite_file" ]; then
        continue
    fi
    
    suite_name=$(basename "$suite_file" | sed 's/-[0-9]\{8\}_[0-9]\{6\}\.txt$//')
    
    echo -e "  ${CYAN}Analyse: $suite_name${NC}"
    
    # Extraire les statistiques
    success_count=$(grep -oP "✓ Succès: \K\d+" "$suite_file" 2>/dev/null | head -1 || echo "0")
    error_count=$(grep -oP "✗ Erreurs: \K\d+" "$suite_file" 2>/dev/null | head -1 || echo "0")
    
    # Compter les tests individuels
    total_tests=$(grep -c "Testing\|✓\|✗" "$suite_file" 2>/dev/null || echo "0")
    
    # Extraire les détails des tests
    tests_passed=$(grep -c "✓ OK\|✓ " "$suite_file" 2>/dev/null || echo "0")
    tests_failed=$(grep -c "✗ FAIL\|✗ " "$suite_file" 2>/dev/null || echo "0")
    
    # Calculer le taux de réussite
    if [ "$total_tests" -gt 0 ]; then
        success_rate=$((tests_passed * 100 / total_tests))
    else
        success_rate=0
    fi
    
    # Extraire les erreurs détaillées
    errors=$(grep "✗\|FAIL\|ERROR\|Error" "$suite_file" 2>/dev/null | head -10 || echo "")
    
    # Ajouter au JSON (utilisation de jq si disponible, sinon manipulation manuelle)
    if command -v jq &> /dev/null; then
        jq --arg name "$suite_name" \
           --argjson success "$success_count" \
           --argjson errors "$error_count" \
           --argjson total "$total_tests" \
           --argjson passed "$tests_passed" \
           --argjson failed "$tests_failed" \
           --argjson rate "$success_rate" \
           --arg file "$suite_file" \
           '.test_suites += [{
             "name": $name,
             "success_count": $success,
             "error_count": $errors,
             "total_tests": $total,
             "tests_passed": $passed,
             "tests_failed": $failed,
             "success_rate": $rate,
             "result_file": $file,
             "status": (if $errors == 0 then "passed" else "failed" end)
           }]' "$JSON_REPORT" > "$JSON_REPORT.tmp" && mv "$JSON_REPORT.tmp" "$JSON_REPORT"
    else
        # Fallback sans jq - création manuelle
        echo "Note: jq non disponible, rapport JSON simplifié"
    fi
done

# Générer le rapport HTML
cat > "$HTML_REPORT" << 'HTML_EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Tests - TaskFlow ADHD</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 30px;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: #ecf0f1;
            border-radius: 5px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-card.success { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        .stat-card.error { background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); }
        .stat-card.warning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
        .suite {
            margin-bottom: 30px;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
        }
        .suite-header {
            background: #34495e;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .suite-header.passed { background: #27ae60; }
        .suite-header.failed { background: #e74c3c; }
        .suite-content {
            padding: 20px;
        }
        .test-item {
            padding: 10px;
            margin: 5px 0;
            border-left: 4px solid #ddd;
            background: #f9f9f9;
        }
        .test-item.passed { border-left-color: #27ae60; }
        .test-item.failed { border-left-color: #e74c3c; }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 0.85em;
            font-weight: bold;
        }
        .badge.success { background: #27ae60; color: white; }
        .badge.error { background: #e74c3c; color: white; }
        .progress-bar {
            width: 100%;
            height: 25px;
            background: #ecf0f1;
            border-radius: 12px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #11998e 0%, #38ef7d 100%);
            transition: width 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        .timestamp {
            color: #7f8c8d;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Rapport de Tests - TaskFlow ADHD</h1>
        <div class="header">
            <div>
                <h2>Résumé des Tests</h2>
                <p class="timestamp">Généré le: TIMESTAMP_PLACEHOLDER</p>
            </div>
        </div>
        <div class="stats">
            <div class="stat-card success">
                <div class="stat-label">Tests Réussis</div>
                <div class="stat-value" id="total-success">0</div>
            </div>
            <div class="stat-card error">
                <div class="stat-label">Tests Échoués</div>
                <div class="stat-value" id="total-errors">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Tests</div>
                <div class="stat-value" id="total-tests">0</div>
            </div>
            <div class="stat-card warning">
                <div class="stat-label">Taux de Réussite</div>
                <div class="stat-value" id="success-rate">0%</div>
            </div>
        </div>
        <div id="suites-container">
            <!-- Les suites de tests seront injectées ici -->
        </div>
    </div>
    <script>
        // Les données seront injectées ici par le script
        const testData = TEST_DATA_PLACEHOLDER;
        
        // Remplir les statistiques
        let totalSuccess = 0, totalErrors = 0, totalTests = 0;
        testData.test_suites.forEach(suite => {
            totalSuccess += suite.success_count || 0;
            totalErrors += suite.error_count || 0;
            totalTests += suite.total_tests || 0;
        });
        
        document.getElementById('total-success').textContent = totalSuccess;
        document.getElementById('total-errors').textContent = totalErrors;
        document.getElementById('total-tests').textContent = totalTests;
        const rate = totalTests > 0 ? Math.round((totalSuccess / totalTests) * 100) : 0;
        document.getElementById('success-rate').textContent = rate + '%';
        
        // Générer les suites
        const container = document.getElementById('suites-container');
        testData.test_suites.forEach(suite => {
            const suiteDiv = document.createElement('div');
            suiteDiv.className = 'suite';
            const status = suite.status === 'passed' ? 'passed' : 'failed';
            suiteDiv.innerHTML = `
                <div class="suite-header ${status}">
                    <h3>${suite.name}</h3>
                    <span class="badge ${status}">${suite.status === 'passed' ? '✓ Réussi' : '✗ Échoué'}</span>
                </div>
                <div class="suite-content">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${suite.success_rate}%">
                            ${suite.success_rate}%
                        </div>
                    </div>
                    <p><strong>Tests réussis:</strong> ${suite.success_count || 0}</p>
                    <p><strong>Tests échoués:</strong> ${suite.error_count || 0}</p>
                    <p><strong>Total:</strong> ${suite.total_tests || 0} tests</p>
                </div>
            `;
            container.appendChild(suiteDiv);
        });
    </script>
</body>
</html>
HTML_EOF

# Remplacer les placeholders
sed -i "s/TIMESTAMP_PLACEHOLDER/$(date -Iseconds)/" "$HTML_REPORT"

echo -e "${GREEN}✅ Rapport JSON généré: $JSON_REPORT${NC}"
echo -e "${GREEN}✅ Rapport HTML généré: $HTML_REPORT${NC}"
echo ""
echo -e "${CYAN}📊 Résumé:${NC}"
echo -e "  - Fichiers analysés: $(ls -1 "$RESULTS_DIR"/*.txt 2>/dev/null | wc -l)"
echo -e "  - Rapport JSON: $JSON_REPORT"
echo -e "  - Rapport HTML: $HTML_REPORT"
echo ""
echo -e "${BLUE}💡 Ouvrez le rapport HTML dans votre navigateur pour une vue détaillée${NC}"

