#!/bin/bash

# ============================================
# Test Fonctionnel Multi-User MagFlow
# Tests l'application avec la nouvelle migration v2.0
# ============================================

set -e

echo "🧪 Test Fonctionnel Multi-User MagFlow"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_URL="http://localhost:3001"
ADMIN_EMAIL="alexandre.errasti@gmail.com"

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Fonction de test
test_endpoint() {
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  local name=$1
  local url=$2
  local expected_status=${3:-200}
  
  echo -n "Test $TOTAL_TESTS: $name... "
  
  response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo "000")
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✅ PASS${NC} (HTTP $status_code)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ FAIL${NC} (Expected $expected_status, got $status_code)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    return 1
  fi
}

echo "📡 Test 1: Vérification des Services"
echo "------------------------------------"

# Test Backend Health
test_endpoint "Backend Health Check" "$BACKEND_URL/health"

# Test Backend API
test_endpoint "Backend API Status" "$BACKEND_URL/api/status"

echo ""
echo "🔐 Test 2: Endpoints Multi-User"
echo "------------------------------------"

# Test templates endpoint (devrait nécessiter auth)
test_endpoint "Templates Endpoint (Auth Required)" "$BACKEND_URL/api/templates" 401

# Test profiles endpoint (devrait nécessiter auth)
test_endpoint "Profiles Endpoint (Auth Required)" "$BACKEND_URL/api/profiles" 401

echo ""
echo "📊 Test 3: Database Migration Verification"
echo "------------------------------------"

# Vérifier via script Node.js
cd backend
echo -n "Test: Migration Success Verification... "
if node scripts/verify-migration-success.js > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
  echo -e "${RED}❌ FAIL${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
fi
cd ..

echo ""
echo "========================================"
echo "📊 RÉSULTATS DES TESTS"
echo "========================================"
echo ""
echo "Total tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 TOUS LES TESTS SONT PASSÉS !${NC}"
  echo ""
  echo "✅ L'application est prête pour les tests manuels:"
  echo "   1. Ouvrez http://localhost:5173"
  echo "   2. Connectez-vous avec: $ADMIN_EMAIL"
  echo "   3. Testez la création de templates"
  echo "   4. Testez la génération de magazines"
  echo "   5. Vérifiez que seules VOS données sont visibles (RLS)"
  echo ""
  exit 0
else
  echo -e "${RED}⚠️  CERTAINS TESTS ONT ÉCHOUÉ${NC}"
  echo ""
  echo "Vérifiez les logs:"
  echo "   - Backend:  tail -f backend.log"
  echo "   - Frontend: tail -f frontend.log"
  echo "   - Flask:    tail -f flask.log"
  echo ""
  exit 1
fi
