#!/bin/bash

# ============================================
# Démarrage environnement de recette
# Lance tous les services nécessaires
# ============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Répertoire racine
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🚀 Démarrage Environnement de Recette MagFlow        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Fonction pour cleanup à la sortie
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Arrêt des services...${NC}"
    
    # Tuer les processus en arrière-plan
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "  ${GREEN}✓${NC} Backend arrêté"
    fi
    
    if [ ! -z "$FLASK_PID" ]; then
        kill $FLASK_PID 2>/dev/null || true
        echo -e "  ${GREEN}✓${NC} Flask arrêté"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "  ${GREEN}✓${NC} Frontend arrêté"
    fi
    
    echo -e "${GREEN}✅ Tous les services arrêtés${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# ============================================
# 1. Vérifier les dépendances
# ============================================
echo -e "${YELLOW}📦 Vérification des dépendances...${NC}"

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "  ${GREEN}✓${NC} Node.js ${NODE_VERSION}"
else
    echo -e "  ${RED}✗${NC} Node.js non installé"
    exit 1
fi

# Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "  ${GREEN}✓${NC} ${PYTHON_VERSION}"
else
    echo -e "  ${RED}✗${NC} Python3 non installé"
    exit 1
fi

# InDesign (check approximatif)
if [ -d "/Applications/Adobe InDesign 2025" ] || [ -d "/Applications/Adobe InDesign 2024" ]; then
    echo -e "  ${GREEN}✓${NC} Adobe InDesign détecté"
else
    echo -e "  ${YELLOW}⚠${NC} Adobe InDesign non détecté (peut être installé ailleurs)"
fi

echo ""

# ============================================
# 2. Installation des dépendances si nécessaire
# ============================================
echo -e "${YELLOW}📥 Vérification des node_modules...${NC}"

# Backend
if [ ! -d "$ROOT_DIR/backend/node_modules" ]; then
    echo -e "  Installing backend dependencies..."
    cd "$ROOT_DIR/backend" && npm install --silent
fi
echo -e "  ${GREEN}✓${NC} Backend"

# Frontend
if [ ! -d "$ROOT_DIR/node_modules" ]; then
    echo -e "  Installing frontend dependencies..."
    cd "$ROOT_DIR" && npm install --silent
fi
echo -e "  ${GREEN}✓${NC} Frontend"

# Flask (venv optionnel)
if [ -f "$ROOT_DIR/flask-api/requirements.txt" ]; then
    echo -e "  ${GREEN}✓${NC} Flask (requirements.txt présent)"
fi

echo ""

# ============================================
# 3. Créer les dossiers nécessaires
# ============================================
echo -e "${YELLOW}📁 Création des dossiers...${NC}"

mkdir -p "$ROOT_DIR/flask-api/analysis"
mkdir -p "$ROOT_DIR/flask-api/thumbnails"
mkdir -p "$ROOT_DIR/flask-api/indesign_templates"
mkdir -p "/tmp/magflow-uploads"
mkdir -p "/tmp/magflow-templates"

echo -e "  ${GREEN}✓${NC} Dossiers créés"
echo ""

# ============================================
# 4. Démarrer Flask API
# ============================================
echo -e "${YELLOW}🐍 Démarrage Flask API (port 5003)...${NC}"

cd "$ROOT_DIR/flask-api"
python3 app.py > /tmp/magflow-flask.log 2>&1 &
FLASK_PID=$!

sleep 2

if kill -0 $FLASK_PID 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Flask API démarré (PID: $FLASK_PID)"
else
    echo -e "  ${RED}✗${NC} Échec démarrage Flask"
    cat /tmp/magflow-flask.log
    exit 1
fi

# ============================================
# 5. Démarrer Backend Node.js
# ============================================
echo -e "${YELLOW}🟢 Démarrage Backend Node.js (port 3001)...${NC}"

cd "$ROOT_DIR/backend"
npm run dev > /tmp/magflow-backend.log 2>&1 &
BACKEND_PID=$!

sleep 3

if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Backend démarré (PID: $BACKEND_PID)"
else
    echo -e "  ${RED}✗${NC} Échec démarrage Backend"
    cat /tmp/magflow-backend.log
    exit 1
fi

# ============================================
# 6. Démarrer Frontend
# ============================================
echo -e "${YELLOW}⚛️  Démarrage Frontend Vite (port 5173)...${NC}"

cd "$ROOT_DIR"
npm run dev > /tmp/magflow-frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 3

if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Frontend démarré (PID: $FRONTEND_PID)"
else
    echo -e "  ${RED}✗${NC} Échec démarrage Frontend"
    cat /tmp/magflow-frontend.log
    exit 1
fi

echo ""

# ============================================
# 7. Résumé et URLs
# ============================================
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   ✅ Environnement de Recette Prêt !                   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 URLs d'accès :${NC}"
echo ""
echo -e "   📱 Interface admin:  ${BLUE}http://localhost:5173/admin/templates${NC}"
echo -e "   🔧 API Templates:    ${BLUE}http://localhost:3001/api/templates${NC}"
echo -e "   🐍 Flask API:        ${BLUE}http://localhost:5003/api/config${NC}"
echo ""
echo -e "${GREEN}📋 Tests disponibles :${NC}"
echo ""
echo -e "   ./scripts/test-template-upload.sh    # Test automatisé"
echo ""
echo -e "${YELLOW}💡 Logs :${NC}"
echo -e "   tail -f /tmp/magflow-backend.log"
echo -e "   tail -f /tmp/magflow-flask.log"
echo -e "   tail -f /tmp/magflow-frontend.log"
echo ""
echo -e "${YELLOW}🛑 Pour arrêter : Ctrl+C${NC}"
echo ""

# ============================================
# 8. Attendre
# ============================================
echo -e "${CYAN}En attente... (Ctrl+C pour arrêter)${NC}"

# Garder le script en vie
wait
