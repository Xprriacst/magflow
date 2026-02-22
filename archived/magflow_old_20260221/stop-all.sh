#!/bin/bash

# ============================================
# Script d'arrêt complet MagFlow
# Arrête Backend + Frontend + Flask
# ============================================

echo "🛑 Arrêt de MagFlow..."

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Lire les PIDs sauvegardés
if [ -f .backend.pid ]; then
  BACKEND_PID=$(cat .backend.pid)
  kill $BACKEND_PID 2>/dev/null && echo -e "${GREEN}✅ Backend arrêté${NC}" || echo -e "${RED}⚠️  Backend PID introuvable${NC}"
  rm .backend.pid
fi

if [ -f .frontend.pid ]; then
  FRONTEND_PID=$(cat .frontend.pid)
  kill $FRONTEND_PID 2>/dev/null && echo -e "${GREEN}✅ Frontend arrêté${NC}" || echo -e "${RED}⚠️  Frontend PID introuvable${NC}"
  rm .frontend.pid
fi

if [ -f .flask.pid ]; then
  FLASK_PID=$(cat .flask.pid)
  kill $FLASK_PID 2>/dev/null && echo -e "${GREEN}✅ Flask arrêté${NC}" || echo -e "${RED}⚠️  Flask PID introuvable${NC}"
  rm .flask.pid
fi

# Nettoyer les processus sur les ports au cas où
echo ""
echo "🧹 Nettoyage des ports..."
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "   Port 3001 libéré" || true
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "   Port 5173 libéré" || true
lsof -ti:5003 | xargs kill -9 2>/dev/null && echo "   Port 5003 libéré" || true

echo ""
echo -e "${GREEN}✅ Tous les services sont arrêtés${NC}"
echo ""
