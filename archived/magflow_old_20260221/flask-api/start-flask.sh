#!/bin/bash

# Script de démarrage Flask API pour développement local

echo "🚀 Démarrage Flask API MagFlow"
echo "================================"
echo ""

# Vérifier si on est dans le bon dossier
if [ ! -f "app.py" ]; then
    echo "❌ Erreur: app.py non trouvé"
    echo "   Assurez-vous d'être dans le dossier flask-api/"
    exit 1
fi

# Vérifier si .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env non trouvé"
    echo "   Copie de .env.example vers .env..."
    cp .env.example .env
    echo "   ⚠️  IMPORTANT: Éditer .env et ajouter votre OPENAI_API_KEY"
    echo ""
fi

# Vérifier si venv existe
if [ ! -d "venv" ]; then
    echo "📦 Création environnement virtuel Python..."
    python3 -m venv venv
    echo "✅ Environnement virtuel créé"
    echo ""
fi

# Activer venv
echo "🔌 Activation environnement virtuel..."
source venv/bin/activate

# Installer dépendances
echo "📥 Installation des dépendances..."
pip install -q -r requirements.txt

echo ""
echo "✅ Prêt!"
echo ""
echo "📡 Flask API démarrera sur: http://localhost:5003"
echo "🔗 Health check: http://localhost:5003/api/status"
echo ""
echo "Pour arrêter: Ctrl+C"
echo ""
echo "================================"
echo ""

# Démarrer Flask
export FLASK_APP=app.py
export FLASK_ENV=development
export PORT=5003

python app.py
