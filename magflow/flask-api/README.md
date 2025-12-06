# MagFlow Flask API

Service Flask pour la génération de magazines InDesign.

## Déploiement sur Render

### 1. Créer un nouveau Web Service

1. Aller sur https://dashboard.render.com/
2. Cliquer "New +" → "Web Service"
3. Connecter votre repository Git

### 2. Configuration du service

**Settings:**
- **Name:** `magflow-flask-api`
- **Environment:** Python 3
- **Root Directory:** `flask-api` (si dans un monorepo)
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 300 --workers 2`

### 3. Variables d'environnement

Ajouter dans Render Dashboard → Environment:

```
OPENAI_API_KEY=<votre_clé_openai>
API_TOKEN=alexandreesttropbeau
```

### 4. Déployer

Cliquer sur "Create Web Service" et attendre le déploiement.

### 5. Tester l'API

```bash
# Health check
curl https://<votre-app>.onrender.com/api/status

# Test avec authentification
curl -X POST https://<votre-app>.onrender.com/api/create-layout-urls \
  -H "Authorization: Bearer alexandreesttropbeau" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "prompt=Test&text_content=Hello&image_urls=https://example.com/image.jpg"
```

### 6. Mettre à jour le backend Node.js

Une fois déployé, ajouter dans les variables d'environnement du backend Node.js:

```
FLASK_API_URL=https://<votre-app-flask>.onrender.com
```

## Développement Local

### Installation

```bash
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration

Copier `.env.example` vers `.env` et remplir les valeurs:

```bash
cp .env.example .env
```

### Lancer

```bash
python app.py
```

L'API sera disponible sur http://localhost:5003

## Endpoints

### `GET /api/status`

Health check de l'API.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-14T10:30:00Z"
}
```

### `POST /api/create-layout-urls`

Crée une mise en page InDesign à partir d'URLs d'images.

**Headers:**
```
Authorization: Bearer <API_TOKEN>
Content-Type: application/x-www-form-urlencoded
```

**Body:**
```
prompt=Titre du magazine
text_content=Contenu textuel complet
subtitle=Sous-titre optionnel
template_id=ID du template (optionnel)
image_urls=https://url1.com/img1.jpg,https://url2.com/img2.jpg
```

**Response:**
```json
{
  "success": true,
  "project_id": "uuid-here",
  "output_file": "/path/to/file.indd",
  "message": "Mise en page créée avec succès"
}
```

### `GET /api/download/<project_id>`

Télécharge le fichier InDesign généré.

## Architecture

```
flask-api/
├── app.py                 # Application Flask principale
├── requirements.txt       # Dépendances Python
├── .env.example          # Template de configuration
└── README.md             # Ce fichier

uploads/                  # Dossier des images téléchargées (auto-créé)
output/                   # Dossier des fichiers générés (auto-créé)
indesign_templates/       # Templates InDesign (auto-créé)
```

## Notes Importantes

### Timeout

Les générations InDesign peuvent prendre plusieurs minutes. Le timeout gunicorn est configuré à 300 secondes (5 minutes).

### Workers

Configuré avec 2 workers pour gérer plusieurs requêtes en parallèle. Peut être ajusté selon les besoins.

### Stockage

Render utilise un système de fichiers éphémère. Les fichiers uploadés et générés sont temporaires. Pour la production, envisager:
- Stockage S3 pour les résultats
- Queue system (Redis + Celery) pour les jobs longs

### InDesign

Cette version nécessite InDesign installé localement. Pour la production, considérer:
- Agent Desktop qui communique via WebSocket
- Alternative: génération PDF avec bibliothèques Python
