#!/bin/bash

# ============================================
# Script de test - Environnement de recette
# Upload et analyse automatique de templates
# ============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FLASK_URL="${FLASK_URL:-http://localhost:5003}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🧪 Environnement de Recette - Upload Templates       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# 1. Vérification des services
# ============================================
echo -e "${YELLOW}📡 Vérification des services...${NC}"

# Backend Node.js
if curl -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Backend Node.js (${BACKEND_URL})"
else
    echo -e "  ${RED}✗${NC} Backend Node.js non disponible"
    echo -e "  ${YELLOW}→ Lancez: cd backend && npm run dev${NC}"
    BACKEND_OK=false
fi

# Flask API
if curl -s "${FLASK_URL}/api/config" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Flask API (${FLASK_URL})"
else
    echo -e "  ${RED}✗${NC} Flask API non disponible"
    echo -e "  ${YELLOW}→ Lancez: cd flask-api && python3 app.py${NC}"
    FLASK_OK=false
fi

# Frontend (optionnel)
if curl -s "${FRONTEND_URL}" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Frontend (${FRONTEND_URL})"
else
    echo -e "  ${YELLOW}○${NC} Frontend non disponible (optionnel pour tests API)"
fi

echo ""

# ============================================
# 2. Test de l'endpoint d'analyse Flask
# ============================================
echo -e "${YELLOW}🔬 Test Flask /api/templates/analyze...${NC}"

# Le fichier client reste hors Git et doit être fourni explicitement.
TEMPLATE_PATH="${MAGFLOW_TEST_TEMPLATE_PATH:-}"

if [ -n "$TEMPLATE_PATH" ] && [ -f "$TEMPLATE_PATH" ]; then
    echo -e "  Template trouvé: $(basename "$TEMPLATE_PATH")"
    
    FLASK_RESPONSE=$(curl -s -X POST "${FLASK_URL}/api/templates/analyze" \
        -H "Content-Type: application/json" \
        -d "{\"template_path\": \"${TEMPLATE_PATH}\"}" \
        --max-time 120 2>&1)
    
    if echo "$FLASK_RESPONSE" | grep -q '"success": true'; then
        echo -e "  ${GREEN}✓${NC} Analyse Flask réussie"
        
        # Extraire les infos
        PLACEHOLDERS=$(echo "$FLASK_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('template',{}).get('placeholders',[])))" 2>/dev/null || echo "?")
        IMAGE_SLOTS=$(echo "$FLASK_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('template',{}).get('image_slots',0))" 2>/dev/null || echo "?")
        THUMBNAIL=$(echo "$FLASK_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('thumbnail',{}).get('filename',''))" 2>/dev/null || echo "")
        
        echo -e "    - Placeholders: ${PLACEHOLDERS}"
        echo -e "    - Image slots: ${IMAGE_SLOTS}"
        if [ -n "$THUMBNAIL" ]; then
            echo -e "    - Miniature: ${GREEN}${THUMBNAIL}${NC}"
        fi
    else
        echo -e "  ${RED}✗${NC} Échec de l'analyse Flask"
        echo -e "  Réponse: $FLASK_RESPONSE"
    fi
else
    echo -e "  ${YELLOW}○${NC} Template de test non trouvé (skipped)"
    echo -e "    Configurez MAGFLOW_TEST_TEMPLATE_PATH sur la machine de rendu"
fi

echo ""

# ============================================
# 3. Test de l'endpoint Backend complet
# ============================================
echo -e "${YELLOW}🚀 Test Backend /api/templates (liste)...${NC}"

TEMPLATES_RESPONSE=$(curl -s "${BACKEND_URL}/api/templates" 2>&1)

if echo "$TEMPLATES_RESPONSE" | grep -q '"templates"'; then
    TEMPLATE_COUNT=$(echo "$TEMPLATES_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('templates',[])))" 2>/dev/null || echo "?")
    echo -e "  ${GREEN}✓${NC} Templates disponibles: ${TEMPLATE_COUNT}"
    
    # Afficher les templates
    echo "$TEMPLATES_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for t in data.get('templates', [])[:5]:
        preview = '🖼️' if t.get('preview_url') else '  '
        print(f\"    {preview} {t.get('name', 'Sans nom')} ({t.get('image_slots', '?')} images)\")
except:
    pass
" 2>/dev/null || true
else
    echo -e "  ${RED}✗${NC} Échec de récupération des templates"
fi

echo ""

# ============================================
# 4. Instructions pour test manuel
# ============================================
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 Test manuel via l'interface${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "1. Ouvrir ${GREEN}${FRONTEND_URL}/admin/templates${NC}"
echo -e "2. Cliquer sur ${YELLOW}'Ajouter un template'${NC}"
echo -e "3. Glisser un fichier .indt ou .indd"
echo -e "4. Cliquer sur ${YELLOW}'Traiter le template'${NC}"
echo -e "5. Vérifier:"
echo -e "   - Miniature générée automatiquement"
echo -e "   - Placeholders détectés"
echo -e "   - Catégorie/Style enrichis par l'IA"
echo ""

# ============================================
# 5. Test upload via curl (optionnel)
# ============================================
if [ -f "$TEMPLATE_PATH" ]; then
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}🔧 Commande pour tester l'upload complet${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "curl -X POST ${BACKEND_URL}/api/templates/upload-and-process \\"
    echo -e "  -F \"template=@${TEMPLATE_PATH}\" \\"
    echo -e "  -F \"name=Template Test Recette\""
    echo ""
fi

# ============================================
# 6. Résumé
# ============================================
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Résumé${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Services requis:"
echo -e "  • ${YELLOW}Backend:${NC}  cd backend && npm run dev"
echo -e "  • ${YELLOW}Flask:${NC}    cd flask-api && python3 app.py"  
echo -e "  • ${YELLOW}Frontend:${NC} npm run dev"
echo -e "  • ${YELLOW}InDesign:${NC} Doit être installé et accessible"
echo ""
echo -e "URLs de test:"
echo -e "  • Interface admin: ${GREEN}${FRONTEND_URL}/admin/templates${NC}"
echo -e "  • API Templates:   ${GREEN}${BACKEND_URL}/api/templates${NC}"
echo -e "  • API Health:      ${GREEN}${BACKEND_URL}/health${NC}"
echo ""
echo -e "${GREEN}✅ Environnement de recette prêt !${NC}"
