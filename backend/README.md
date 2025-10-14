# 🚀 MagFlow Backend

Backend Node.js/Express pour MagFlow - Système de génération automatique de magazines InDesign alimenté par l'IA.

## 📋 Fonctionnalités

- ✅ **Analyse IA** : Analyse automatique de la structure éditoriale via OpenAI
- ✅ **Gestion Templates** : CRUD complet pour templates InDesign
- ✅ **Recommandations** : Suggestion intelligente de templates basée sur le contenu
- ✅ **Génération Magazine** : Orchestration de la génération via Flask + InDesign
- ✅ **Historique** : Suivi de toutes les générations
- ✅ **API RESTful** : Endpoints bien structurés et documentés

## 🏗️ Architecture

```
Frontend React → Backend Node.js → Flask API → InDesign
                      ↓
                  Supabase DB
                      ↓
                  OpenAI API
```

## 🚀 Installation

### 1. Installer les dépendances

```bash
cd backend
npm install
```

### 2. Configuration

Le fichier `.env` est déjà configuré avec vos clés.

### 3. Initialiser Supabase

**Option A : Via Supabase MCP (recommandé)** ✨

Le MCP Supabase est configuré dans Cursor. Vous pouvez demander à l'IA :
```
"Exécute le fichier supabase-schema.sql sur ma base Supabase"
```

**Option B : Via dashboard Supabase**

1. Aller sur https://wxtrhxvyjfsqgphboqwo.supabase.co
2. SQL Editor
3. Copier/coller le contenu de `supabase-schema.sql`
4. Run

**Option C : Via CLI Supabase**

```bash
npx supabase db push
```

### 4. Démarrer le serveur

```bash
# Mode développement (avec auto-reload)
npm run dev

# Mode production
npm start
```

Le backend démarre sur **http://localhost:3001**

## 📡 Endpoints API

### 🏥 Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-09-30T21:30:00.000Z",
  "version": "1.0.0"
}
```

---

### 📝 Content Analysis

#### Analyser un contenu

```bash
POST /api/content/analyze
Content-Type: application/json

{
  "content": "Votre texte d'article ici..."
}
```

**Response:**
```json
{
  "success": true,
  "structure": {
    "titre_principal": "...",
    "chapo": "...",
    "sous_titres": ["..."],
    "sections": [...],
    "mots_cles": ["..."],
    "categorie_suggeree": "Art & Culture",
    "niveau_complexite": "moyen"
  }
}
```

#### Vérifier OpenAI

```bash
GET /api/content/health
```

---

### 📄 Templates

#### Lister tous les templates

```bash
GET /api/templates
```

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "uuid",
      "name": "Magazine Artistique Simple",
      "filename": "template-mag-simple-1808.indt",
      "description": "...",
      "image_slots": 3,
      "category": "Art & Culture",
      "style": "simple",
      "placeholders": ["{{TITRE}}", "{{SOUS-TITRE}}"],
      "file_path": "/path/to/template.indt"
    }
  ]
}
```

#### Obtenir un template

```bash
GET /api/templates/:id
```

#### Recommander des templates

```bash
POST /api/templates/recommend
Content-Type: application/json

{
  "contentStructure": { /* Structure analysée */ },
  "imageCount": 3
}
```

**Response:**
```json
{
  "success": true,
  "recommended": [
    {
      "id": "uuid",
      "name": "Template Name",
      "score": 85,
      /* ... */
    }
  ]
}
```

#### Créer un template (Admin)

```bash
POST /api/templates
Content-Type: application/json

{
  "name": "Mon Nouveau Template",
  "filename": "nouveau-template.indt",
  "description": "Description",
  "image_slots": 4,
  "category": "Tech",
  "style": "moyen",
  "file_path": "/path/to/template.indt"
}
```

---

### 📰 Magazine Generation

#### Générer un magazine

```bash
POST /api/magazine/generate
Content-Type: application/json

{
  "content": "Texte original",
  "contentStructure": { /* Structure OpenAI */ },
  "template": { /* Template object */ },
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "generationId": "uuid",
  "projectId": "flask-project-id",
  "downloadUrl": "http://localhost:5003/api/download/flask-project-id"
}
```

#### Vérifier le statut

```bash
GET /api/magazine/status/:generationId
```

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "projectId": "...",
  "downloadUrl": "...",
  "createdAt": "...",
  "completedAt": "..."
}
```

#### Historique

```bash
GET /api/magazine/history?limit=20&offset=0
```

---

## 🧪 Tests

```bash
# Lancer les tests unitaires
npm test

# Tests avec interface UI
npm run test:ui

# Coverage
npm run test:coverage
```

## 📊 Structure des fichiers

```
backend/
├── server.js              # Point d'entrée
├── routes/
│   ├── content.js        # Analyse IA
│   ├── templates.js      # Gestion templates
│   └── magazine.js       # Génération magazines
├── services/
│   ├── supabaseClient.js # Client Supabase
│   ├── openaiService.js  # Service OpenAI
│   └── flaskService.js   # Communication Flask
├── tests/                # Tests automatisés
├── supabase-schema.sql   # Schéma base de données
├── .env                  # Configuration
└── package.json
```

## 🔧 Configuration avancée

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur | 3001 |
| `NODE_ENV` | Environnement | development |
| `SUPABASE_URL` | URL Supabase | ✅ Configuré |
| `SUPABASE_ANON_KEY` | Clé publique Supabase | ✅ Configuré |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin Supabase | ✅ Configuré |
| `OPENAI_API_KEY` | Clé OpenAI | ✅ Configuré |
| `FLASK_API_URL` | URL API Flask | http://localhost:5003 |
| `FLASK_API_TOKEN` | Token Flask (optionnel) | - |

### Démarrer Flask en parallèle

```bash
# Dans un autre terminal
cd "../Indesign automation v1"
python app.py
```

Flask démarre sur **http://localhost:5003**

## 🚨 Troubleshooting

### Erreur: "Cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur: "OpenAI API Error"

Vérifiez que `OPENAI_API_KEY` est correct dans `.env`

### Erreur: "Flask not responding"

1. Vérifier que Flask est démarré : `curl http://localhost:5003/api/status`
2. Si non, lancer : `cd "../Indesign automation v1" && python app.py`

### Erreur: "Database error"

1. Vérifier Supabase : https://wxtrhxvyjfsqgphboqwo.supabase.co
2. Exécuter `supabase-schema.sql` si tables manquantes

## 📚 Liens utiles

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Express Docs](https://expressjs.com/)

## 🎯 Prochaines étapes

1. ✅ Tests Playwright E2E
2. ✅ Intégration frontend React
3. ✅ Déploiement production
4. ✅ Monitoring et logs

---

**Version :** 1.0.0  
**Date :** 2025-09-30  
**Auteur :** MagFlow Team
