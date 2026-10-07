#!/bin/bash

# ============================================
# MagFlow - Démarrage complet (Semi-SaaS Mode)
# ============================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       🚀 MagFlow Semi-SaaS Mode        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Ajouter Node au PATH
export PATH="/usr/local/bin:$PATH"

# Fonction pour tuer un processus sur un port
kill_port() {
  lsof -ti:$1 2>/dev/null | xargs kill -9 2>/dev/null || true
}

# Nettoyer les ports
echo -e "${YELLOW}🧹 Nettoyage des ports...${NC}"
kill_port 3001  # Backend
kill_port 5173  # Frontend
kill_port 5003  # Flask
sleep 1

# 1. Backend Node.js avec WebSocket
echo -e "${BLUE}📦 Démarrage Backend + WebSocket...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances Backend...${NC}"
    npm install
fi
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend démarré (PID: $BACKEND_PID)${NC}"
cd ..
sleep 2

# 2. Flask API
echo -e "${BLUE}🐍 Démarrage Flask API...${NC}"
cd flask-api

# Setup venv if missing
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚙️  Configuration de l'environnement virtuel Python...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

python3 app.py > ../flask.log 2>&1 &
FLASK_PID=$!
echo -e "${GREEN}✅ Flask démarré (PID: $FLASK_PID)${NC}"
cd ..
sleep 2

# 3. Frontend React
echo -e "${BLUE}⚛️  Démarrage Frontend React...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚛️  Installation des dépendances Frontend...${NC}"
    npm install
fi
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend démarré (PID: $FRONTEND_PID)${NC}"
# Résumé
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}        🎉 MagFlow est prêt !           ${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "📡 Services actifs:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:3001"
echo "   WebSocket: ws://localhost:3001"
echo "   Flask:     http://localhost:5003"
echo ""
echo "📱 Desktop Agent:"
echo "   cd magflow-agent && npm start"
echo ""
echo "🛑 Pour arrêter:"
echo "   kill $BACKEND_PID $FLASK_PID $FRONTEND_PID"
echo ""

# Sauvegarder les PIDs
echo "$BACKEND_PID" > .backend.pid
echo "$FLASK_PID" > .flask.pid  
echo "$FRONTEND_PID" > .frontend.pid

# Ouvrir le navigateur
sleep 2
open http://localhost:5173

echo -e "${GREEN}✨ Bon développement !${NC}"
