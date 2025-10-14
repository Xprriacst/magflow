#!/bin/bash

# ============================================
# Script de démarrage complet MagFlow
# Démarre Backend + Frontend + Flask
# ============================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage de MagFlow..."
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour vérifier si un port est utilisé
check_port() {
  lsof -ti:$1 > /dev/null 2>&1
}

# Fonction pour tuer un processus sur un port
kill_port() {
  if check_port $1; then
    echo -e "${YELLOW}⚠️  Port $1 déjà utilisé, arrêt du processus...${NC}"
    lsof -ti:$1 | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
}

# Nettoyer les ports
echo "🧹 Nettoyage des ports..."
kill_port 3001  # Backend
kill_port 5173  # Frontend
kill_port 5003  # Flask

echo ""

# ============================================
# 1. Backend Node.js
# ============================================
echo -e "${BLUE}📦 Démarrage Backend Node.js...${NC}"
cd backend

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
  echo "   Installing dependencies..."
  npm install
fi

# Démarrer le backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend démarré (PID: $BACKEND_PID) sur http://localhost:3001${NC}"

cd ..

# Attendre que le backend soit prêt
echo "   Waiting for backend..."
sleep 3

# ============================================
# 2. Flask API
# ============================================
echo -e "${BLUE}🐍 Démarrage Flask API...${NC}"
cd "Indesign automation v1"

# Activer l'environnement virtuel si disponible
if [ -d "venv" ]; then
  source venv/bin/activate
fi

# Démarrer Flask
python app.py > ../flask.log 2>&1 &
FLASK_PID=$!
echo -e "${GREEN}✅ Flask démarré (PID: $FLASK_PID) sur http://localhost:5003${NC}"

cd ..

# Attendre que Flask soit prêt
echo "   Waiting for Flask..."
sleep 3

# ============================================
# 3. Frontend React
# ============================================
echo -e "${BLUE}⚛️  Démarrage Frontend React...${NC}"

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
  echo "   Installing dependencies..."
  npm install
fi

# Démarrer le frontend
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend démarré (PID: $FRONTEND_PID) sur http://localhost:5173${NC}"

echo ""
echo "============================================"
echo -e "${GREEN}🎉 MagFlow est prêt !${NC}"
echo "============================================"
echo ""
echo "📡 Services actifs:"
echo "   - Backend:  http://localhost:3001"
echo "   - Frontend: http://localhost:5173"
echo "   - Flask:    http://localhost:5003"
echo ""
echo "📝 Logs:"
echo "   - Backend:  backend.log"
echo "   - Frontend: frontend.log"
echo "   - Flask:    flask.log"
echo ""
echo "⚙️  PIDs:"
echo "   - Backend:  $BACKEND_PID"
echo "   - Frontend: $FRONTEND_PID"
echo "   - Flask:    $FLASK_PID"
echo ""
echo "🛑 Pour arrêter tous les services:"
echo "   ./stop-all.sh"
echo ""
echo "   ou manuellement:"
echo "   kill $BACKEND_PID $FRONTEND_PID $FLASK_PID"
echo ""

# Sauvegarder les PIDs
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid
echo "$FLASK_PID" > .flask.pid

# Attendre un peu et vérifier que tout tourne
sleep 2
echo "🔍 Vérification des services..."

check_service() {
  if curl -s "$1" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ $2 OK${NC}"
    return 0
  else
    echo -e "   ${YELLOW}⚠️  $2 ne répond pas${NC}"
    return 1
  fi
}

check_service "http://localhost:3001/health" "Backend"
check_service "http://localhost:5173" "Frontend"
check_service "http://localhost:5003/api/status" "Flask"

echo ""
echo "🌐 Ouverture du navigateur..."
sleep 1
open http://localhost:5173

echo ""
echo -e "${GREEN}✨ Tout est prêt ! Bon développement !${NC}"
echo ""
