#!/bin/bash

# Test rapide du workflow complet Backend → Flask → InDesign

echo "🧪 Test Workflow E2E - Quick Check"
echo "==================================="
echo ""

# 1. Backend health
echo "1️⃣  Backend Health..."
BACKEND_STATUS=$(curl -s http://localhost:3001/health | grep -o '"status":"ok"')
if [ -n "$BACKEND_STATUS" ]; then
    echo "   ✅ Backend OK"
else
    echo "   ❌ Backend FAILED"
    exit 1
fi

# 2. Flask health
echo "2️⃣  Flask Health..."
FLASK_STATUS=$(curl -s http://localhost:5003/api/status | grep -o '"status":"ok"')
if [ -n "$FLASK_STATUS" ]; then
    echo "   ✅ Flask OK"
else
    echo "   ❌ Flask FAILED"
    exit 1
fi

# 3. Templates disponibles
echo "3️⃣  Templates..."
TEMPLATES_COUNT=$(curl -s http://localhost:3001/api/templates | grep -o '"id"' | wc -l | tr -d ' ')
if [ "$TEMPLATES_COUNT" -gt 0 ]; then
    echo "   ✅ $TEMPLATES_COUNT templates disponibles"
else
    echo "   ❌ Aucun template trouvé"
    exit 1
fi

# 4. Test génération complète (optionnel - nécessite InDesign)
echo "4️⃣  Test génération magazine..."
echo "   📝 Envoi de la requête..."

RESPONSE=$(curl -s -X POST http://localhost:3001/api/magazine/generate \
  -H "Content-Type: application/json" \
  -d '{
    "contentStructure": {
      "titre_principal": "Test Workflow E2E",
      "chapo": "Vérification du workflow complet Backend → Flask → InDesign",
      "sections": [
        {
          "titre": "Introduction",
          "contenu": "Ceci est un test automatisé du workflow complet de génération de magazine."
        },
        {
          "titre": "Contenu principal",
          "contenu": "Le système doit formater ce contenu en texte lisible, télécharger les images depuis les URLs fournies, et générer un fichier InDesign."
        }
      ]
    },
    "template": {
      "id": "7e60dec2-2821-4e62-aa41-5759d6571233",
      "name": "Magazine Artistique Simple",
      "filename": "template-mag-simple-1808.indt"
    },
    "images": ["https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&q=80"]
  }')

# Vérifier la réponse
if echo "$RESPONSE" | grep -q '"success":true'; then
    PROJECT_ID=$(echo "$RESPONSE" | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ Génération lancée"
    echo "   📦 Project ID: $PROJECT_ID"
    
    # Vérifier si le fichier a été créé
    sleep 10  # Attendre qu'InDesign génère le fichier
    OUTPUT_FILE="Indesign automation v1/output/${PROJECT_ID}.indd"
    if [ -f "$OUTPUT_FILE" ]; then
        FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
        echo "   ✅ Fichier créé: $OUTPUT_FILE ($FILE_SIZE)"
    else
        echo "   ⚠️  Fichier non trouvé (InDesign en cours ou non lancé)"
    fi
else
    ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
    echo "   ❌ Génération FAILED"
    echo "   💬 Erreur: $ERROR"
    echo ""
    echo "   📋 Réponse complète:"
    echo "$RESPONSE" | python3 -m json.tool
fi

echo ""
echo "=================================="
echo "🎯 Résultat:"
echo "   - Backend ✅"
echo "   - Flask ✅"
echo "   - Templates ✅"
echo "   - Workflow: Vérifiez ci-dessus"
echo ""
echo "💡 Pour un test complet avec Playwright:"
echo "   npm run test:e2e"
echo ""
