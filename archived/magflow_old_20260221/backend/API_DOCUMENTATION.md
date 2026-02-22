# 📚 MagFlow Backend API - Documentation Complète

**Version:** 1.0.0
**Base URL:** `http://localhost:3001`
**Date:** 2025-10-01

---

## 📋 Table des Matières

1. [Health Check](#health-check)
2. [Content Analysis](#content-analysis)
3. [Templates Management](#templates-management)
4. [Magazine Generation](#magazine-generation)
5. [Error Handling](#error-handling)
6. [Authentication](#authentication)

---

## 🏥 Health Check

### GET `/health`

Vérifie l'état du serveur backend.

**Request:**
```bash
curl http://localhost:3001/health
```

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2025-10-01T17:00:00.000Z",
  "version": "1.0.0"
}
```

---

## 🤖 Content Analysis

### POST `/api/content/analyze`

Analyse la structure éditoriale d'un contenu avec OpenAI GPT-4o.

**Request:**
```bash
curl -X POST http://localhost:3001/api/content/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Votre texte long ici (min 50 caractères)..."
  }'
```

**Parameters:**
- `content` (string, required): Texte à analyser (minimum 50 caractères)

**Response:** `200 OK`
```json
{
  "success": true,
  "structure": {
    "titre_principal": "L'Intelligence Artificielle dans l'Art",
    "chapo": "L'IA révolutionne le monde de l'art contemporain...",
    "sous_titres": ["IA et Créativité", "Nouveaux Horizons"],
    "sections": [
      {
        "titre": "IA et Créativité",
        "contenu": "Les artistes utilisent des algorithmes...",
        "type": "corps"
      }
    ],
    "mots_cles": ["IA", "art", "créativité"],
    "categorie_suggeree": "Art & Culture",
    "temps_lecture": 5,
    "niveau_complexite": "moyen"
  },
  "model": "gpt-4o",
  "processingTime": "3.2s"
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Le contenu doit contenir au moins 50 caractères"
}
```

---

### GET `/api/content/health`

Vérifie la santé du service OpenAI.

**Response:** `200 OK`
```json
{
  "success": true,
  "service": "openai",
  "status": "operational",
  "model": "gpt-4o"
}
```

---

## 📄 Templates Management

### GET `/api/templates`

Récupère tous les templates actifs depuis Supabase.

**Request:**
```bash
curl http://localhost:3001/api/templates
```

**Response:** `200 OK`
```json
{
  "success": true,
  "templates": [
    {
      "id": "7e60dec2-2821-4e62-aa41-5759d6571233",
      "name": "Magazine Artistique Simple",
      "filename": "template-mag-simple-1808.indt",
      "description": "Template simple et élégant pour articles artistiques",
      "preview_url": null,
      "placeholders": ["{{TITRE}}", "{{SOUS-TITRE}}", "{{ARTICLE}}"],
      "image_slots": 3,
      "category": "Art & Culture",
      "style": "simple",
      "recommended_for": ["Art & Culture", "Design", "Photographie"],
      "file_path": "/path/to/template.indt",
      "is_active": true,
      "created_at": "2025-10-01T06:10:24.723407+00:00",
      "updated_at": "2025-10-01T06:10:24.723407+00:00"
    }
  ],
  "count": 3
}
```

---

### GET `/api/templates/:id`

Récupère un template spécifique par son ID.

**Request:**
```bash
curl http://localhost:3001/api/templates/7e60dec2-2821-4e62-aa41-5759d6571233
```

**Response:** `200 OK`
```json
{
  "success": true,
  "template": {
    "id": "7e60dec2-2821-4e62-aa41-5759d6571233",
    "name": "Magazine Artistique Simple",
    ...
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "error": "Template introuvable"
}
```

---

### POST `/api/templates/recommend`

Recommande des templates basés sur l'analyse du contenu.

**Request:**
```bash
curl -X POST http://localhost:3001/api/templates/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "contentStructure": {
      "categorie_suggeree": "Art & Culture",
      "mots_cles": ["art", "design"],
      "niveau_complexite": "moyen"
    },
    "imageCount": 3
  }'
```

**Parameters:**
- `contentStructure` (object, required): Structure analysée du contenu
- `imageCount` (number, optional): Nombre d'images disponibles (défaut: 0)

**Response:** `200 OK`
```json
{
  "success": true,
  "recommended": [
    {
      "template": {
        "id": "7e60dec2-2821-4e62-aa41-5759d6571233",
        "name": "Magazine Artistique Simple",
        ...
      },
      "score": 95,
      "reasons": [
        "Catégorie parfaitement adaptée",
        "Style simple recommandé pour ce niveau de complexité",
        "3 emplacements images disponibles"
      ]
    }
  ]
}
```

---

## 📖 Magazine Generation

### POST `/api/magazine/generate`

Génère un magazine InDesign complet.

**Request:**
```bash
curl -X POST http://localhost:3001/api/magazine/generate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Texte original complet...",
    "contentStructure": {
      "titre_principal": "Mon Titre",
      "sections": [...]
    },
    "template": {
      "id": "7e60dec2-2821-4e62-aa41-5759d6571233",
      "name": "Magazine Artistique Simple"
    },
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ]
  }'
```

**Parameters:**
- `content` (string, required): Contenu original complet
- `contentStructure` (object, required): Structure analysée
- `template` (object, required): Template sélectionné
- `images` (array, optional): URLs des images

**Response:** `200 OK`
```json
{
  "success": true,
  "generationId": "abc123-def456-ghi789",
  "projectId": "xyz789",
  "downloadUrl": "http://localhost:5003/api/download/xyz789",
  "status": "processing",
  "estimatedTime": "30-60s"
}
```

**Error Response:** `500 Internal Server Error`
```json
{
  "success": false,
  "error": "Erreur lors de la génération",
  "details": "Flask service unavailable"
}
```

---

### GET `/api/magazine/status/:generationId`

Récupère le statut d'une génération en cours.

**Request:**
```bash
curl http://localhost:3001/api/magazine/status/abc123-def456-ghi789
```

**Response:** `200 OK`

**Status: Processing**
```json
{
  "success": true,
  "status": "processing",
  "projectId": "xyz789",
  "createdAt": "2025-10-01T17:00:00.000Z",
  "estimatedCompletion": "2025-10-01T17:01:00.000Z"
}
```

**Status: Completed**
```json
{
  "success": true,
  "status": "completed",
  "projectId": "xyz789",
  "downloadUrl": "http://localhost:5003/api/download/xyz789",
  "createdAt": "2025-10-01T17:00:00.000Z",
  "completedAt": "2025-10-01T17:00:45.000Z"
}
```

**Status: Failed**
```json
{
  "success": false,
  "status": "failed",
  "projectId": "xyz789",
  "error": "InDesign generation failed",
  "createdAt": "2025-10-01T17:00:00.000Z"
}
```

---

### GET `/api/magazine/history`

Récupère l'historique des générations.

**Request:**
```bash
curl "http://localhost:3001/api/magazine/history?limit=20&offset=0"
```

**Query Parameters:**
- `limit` (number, optional): Nombre de résultats (défaut: 20, max: 100)
- `offset` (number, optional): Offset pour pagination (défaut: 0)

**Response:** `200 OK`
```json
{
  "success": true,
  "generations": [
    {
      "id": "abc123",
      "projectId": "xyz789",
      "status": "completed",
      "templateName": "Magazine Artistique Simple",
      "createdAt": "2025-10-01T17:00:00.000Z",
      "completedAt": "2025-10-01T17:00:45.000Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

---

## ⚠️ Error Handling

### Standard Error Response

Toutes les erreurs suivent ce format:

```json
{
  "success": false,
  "error": "Message d'erreur lisible",
  "code": "ERROR_CODE",
  "timestamp": "2025-10-01T17:00:00.000Z"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Succès |
| `400` | Requête invalide (paramètres manquants/invalides) |
| `404` | Ressource introuvable |
| `500` | Erreur serveur interne |
| `503` | Service externe indisponible (OpenAI, Flask, Supabase) |

### Common Error Codes

- `CONTENT_TOO_SHORT`: Contenu < 50 caractères
- `TEMPLATE_NOT_FOUND`: Template inexistant
- `OPENAI_ERROR`: Erreur OpenAI API
- `FLASK_ERROR`: Erreur service Flask
- `SUPABASE_ERROR`: Erreur base de données
- `GENERATION_FAILED`: Échec génération magazine

---

## 🔐 Authentication

Actuellement, l'API est **non authentifiée** (développement).

**Production TODO:**
- Implémenter JWT tokens
- API keys pour services externes
- Rate limiting par IP/user
- CORS restreint aux domaines autorisés

---

## 📊 Rate Limiting

**Développement:** Aucune limite

**Production TODO:**
- 100 requêtes/minute par IP
- 1000 requêtes/heure par utilisateur
- 10 générations/heure par utilisateur

---

## 🧪 Testing

```bash
# Lancer les tests
cd backend
npm test

# Tests avec coverage
npm run test:coverage

# Tests UI
npm run test:ui
```

---

## 📝 Changelog

### v1.0.0 (2025-10-01)
- ✅ API complète opérationnelle
- ✅ 8 endpoints documentés
- ✅ Intégration OpenAI, Supabase, Flask
- ✅ Tests unitaires complets
- ✅ Logging structuré

---

## 🆘 Support

**Issues:** Consulter `TROUBLESHOOTING_GUIDE.md`
**Logs:** Voir `backend/logs/` (si configuré)
**Monitoring:** http://localhost:3001/health

---

**Documentation générée le:** 2025-10-01
**Auteur:** Claude (Anthropic)
**Version backend:** 1.0.0
