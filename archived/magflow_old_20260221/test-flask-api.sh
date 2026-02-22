#!/bin/bash

# Test de l'API Flask pour génération InDesign

echo "🧪 Test de l'API Flask InDesign"
echo "================================"
echo ""

# Test 1: Status
echo "1️⃣ Test du status Flask..."
curl -s http://localhost:5003/api/status | jq '.' || echo "❌ Flask ne répond pas"
echo ""

# Test 2: Génération avec données minimales
echo "2️⃣ Test de génération avec données minimales..."
curl -X POST http://localhost:5003/api/create-layout-urls \
  -H "Authorization: Bearer alexandreesttropbeau" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "prompt=Test Article" \
  -d "text_content={\"titre_principal\":\"Test\",\"chapo\":\"Test chapo\"}" \
  -d "subtitle=Test subtitle" \
  -d "template=template-mag-simple-1808.indd" \
  -d "image_urls=https://images.unsplash.com/photo-1526481280695-3c469f99d62a?auto=format&fit=crop&w=1200&q=80" \
  | jq '.' || echo "❌ Erreur lors de la génération"

echo ""
echo "✅ Tests terminés"
