#!/bin/bash

# ============================================
# Suite de Tests Automatisés - MagFlow Story 1.1
# Créé par: BMad Orchestrator
# ============================================

set -e

echo "🧪 Suite de Tests Automatisés - MagFlow Story 1.1"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

# Fonction de test
run_test() {
  TOTAL=$((TOTAL + 1))
  local name=$1
  local command=$2
  local expected=$3
  
  echo -n "Test $TOTAL: $name... "
  
  if eval "$command" | grep -q "$expected"; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# Test 1: Backend Health
run_test "Backend Health Check" \
  "curl -s http://localhost:3001/health" \
  "ok"

# Test 2: Supabase Credentials
echo -n "Test $((TOTAL + 1)): Supabase Credentials... "
TOTAL=$((TOTAL + 1))
if [ -f ".env.local" ] && grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAILED=$((FAILED + 1))
fi

# Test 3: Claude API via Backend
echo -n "Test $((TOTAL + 1)): Claude API Analysis... "
TOTAL=$((TOTAL + 1))
response=$(curl -s -X POST http://localhost:3001/api/content/analyze \
  -H "Content-Type: application/json" \
  -d '{"content":"Test Article\n\nCeci est un test."}' 2>/dev/null)

if echo "$response" | grep -q "titre_principal"; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASSED=$((PASSED + 1))
elif echo "$response" | grep -q "error"; then
  error_msg=$(echo "$response" | jq -r '.error // "Unknown"' 2>/dev/null || echo "Parse error")
  echo -e "${RED}❌ FAIL${NC} - Error: $error_msg"
  FAILED=$((FAILED + 1))
else
  echo -e "${RED}❌ FAIL${NC} - Unexpected response"
  FAILED=$((FAILED + 1))
fi

# Test 4: Database Migration
echo -n "Test $((TOTAL + 1)): Database Migration... "
TOTAL=$((TOTAL + 1))
cd backend
if node scripts/verify-migration-success.js > /tmp/migration-test.log 2>&1; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  FAILED=$((FAILED + 1))
  echo "  Check /tmp/migration-test.log for details"
fi
cd ..

# Test 5: ANTHROPIC_API_KEY Configured
echo -n "Test $((TOTAL + 1)): Anthropic API Key... "
TOTAL=$((TOTAL + 1))
if grep -q "ANTHROPIC_API_KEY" backend/.env 2>/dev/null; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ FAIL${NC} - Missing in backend/.env"
  FAILED=$((FAILED + 1))
fi

# Test 6: Correct Claude Model
echo -n "Test $((TOTAL + 1)): Claude Model Version... "
TOTAL=$((TOTAL + 1))
if grep -q "claude-3-5-sonnet-20240620" backend/services/openaiService.js; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ FAIL${NC} - Wrong model version"
  FAILED=$((FAILED + 1))
fi

# Test 7: Frontend Running
run_test "Frontend Accessible" \
  "curl -s http://localhost:5173" \
  "<!doctype html>"

# Résumé
echo ""
echo "=================================================="
echo "📊 RÉSULTATS DES TESTS"
echo "=================================================="
echo ""
echo "Total tests: $TOTAL"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo ""

# Calcul du pourcentage
percentage=$((PASSED * 100 / TOTAL))
echo "Score: $percentage%"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 TOUS LES TESTS SONT PASSÉS !${NC}"
  echo ""
  echo "✅ Story 1.1 - Migration Multi-User: VALIDÉE"
  echo ""
  exit 0
elif [ $percentage -ge 85 ]; then
  echo -e "${YELLOW}⚠️  TESTS MAJORITAIREMENT RÉUSSIS${NC}"
  echo ""
  echo "✅ Story 1.1 peut être validée avec réserves"
  echo "📝 Corriger les $FAILED test(s) échoué(s)"
  echo ""
  exit 0
else
  echo -e "${RED}❌ TROP DE TESTS ONT ÉCHOUÉ${NC}"
  echo ""
  echo "❌ Story 1.1 nécessite des corrections"
  echo "📝 Corriger les $FAILED test(s) échoué(s) avant validation"
  echo ""
  exit 1
fi
