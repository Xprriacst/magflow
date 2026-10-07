# Guide de Correction des Problèmes MagFlow

## Problèmes Identifiés

### 1. Mixed Content (URLs HTTP dans page HTTPS)
**Erreur:** `Mixed Content: The page at 'https://magflow-app.netlify.app/' was loaded over HTTPS, but requested an insecure element 'http://localhost:3001/uploads/images/...'`

**Cause:** Les URLs d'images générées par le backend pointent vers `http://localhost:3001` au lieu de l'URL de production HTTPS.

### 2. Flask API non accessible
**Erreur:** `Flask API not responding. Is it running on port 5003?`

**Cause:**
- Le service Flask n'est pas déployé sur Render
- Le backend Node.js essaie d'appeler `http://localhost:5003` en production

### 3. Agent InDesign déconnexion
**Symptôme:** Agent se connecte puis se déconnecte immédiatement

**Cause:** Problème de communication WebSocket ou configuration réseau

---

## Solutions Appliquées

### ✅ 1. Correction des URLs d'images

**Fichiers modifiés:**
- [backend/.env](/Users/alexandreerrasti/magflow0312/magflow/backend/.env) - Ajout de `PUBLIC_URL`
- [backend/routes/upload.js](/Users/alexandreerrasti/magflow0312/magflow/backend/routes/upload.js:59) - Utilisation de `PUBLIC_URL`

**Changements:**

```javascript
// Avant
const baseUrl = `${req.protocol}://${req.get('host')}`;

// Après
const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
```

**Variables d'environnement à configurer sur Render:**

Pour le service backend Node.js, ajoutez :
```
PUBLIC_URL=https://magflow.onrender.com
```

---

## 2. Déploiement de Flask API sur Render

### Étape A: Préparer le code Flask

Le code Flask est dans:
```
/Users/alexandreerrasti/Library/Mobile Documents/com~apple~CloudDocs/Indesign automation v1/
```

**Fichiers nécessaires:**
- `app.py` (Flask application)
- `requirements.txt` (dépendances Python)
- `.env` (configuration locale)

### Étape B: Créer un nouveau service sur Render

1. **Aller sur Render Dashboard:** https://dashboard.render.com/

2. **Créer un nouveau Web Service:**
   - Cliquez sur "New +" → "Web Service"
   - Choisissez "Build and deploy from a Git repository"

3. **Connecter le repository:**
   Option 1: Créer un nouveau repo Git pour Flask uniquement
   Option 2: Ajouter Flask dans le monorepo existant

### Étape C: Configuration du service Flask

**Settings du service:**
```yaml
Name: magflow-flask-api
Environment: Python 3
Build Command: pip install -r requirements.txt
Start Command: gunicorn app:app --bind 0.0.0.0:$PORT
```

**Variables d'environnement:**
```
OPENAI_API_KEY=<votre_clé_openai>
API_TOKEN=replace-with-a-new-random-secret
PORT=10000
```

**Note importante:** Render assignera automatiquement le PORT. N'utilisez pas 5003 en production.

### Étape D: Mettre à jour le backend Node.js

Une fois Flask déployé sur Render (exemple: `https://magflow-flask.onrender.com`), mettez à jour sur Render Dashboard les variables d'environnement du backend Node.js:

```
FLASK_API_URL=https://magflow-flask.onrender.com
FLASK_API_TOKEN=replace-with-a-new-random-secret
```

---

## 3. Correction du WebSocket pour l'agent InDesign

### Problème actuel

Le backend accepte les connexions WebSocket mais l'agent se déconnecte immédiatement.

### Diagnostic

1. **Vérifier les logs du backend:**
```bash
# Sur Render, aller dans Logs du service backend
# Chercher les messages:
🔌 Agent connecté: <socket_id>
✅ Agent enregistré: <agent_id>
❌ Agent déconnecté: <socket_id>
```

2. **Vérifier la configuration de l'agent:**
[magflow-agent-simple/agent.js](/Users/alexandreerrasti/magflow0312/magflow-agent-simple/agent.js)

### Solution suggérée

**Problème potentiel:** L'URL WebSocket en production

L'agent doit se connecter à:
```javascript
// Développement
const BACKEND_URL = 'http://localhost:3001';

// Production
const BACKEND_URL = 'https://magflow.onrender.com';
```

**Correction à faire dans l'agent:**
```javascript
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
```

Et créer un `.env` pour l'agent:
```
BACKEND_URL=https://magflow.onrender.com
USER_ID=<votre_user_id>
```

---

## Configuration Complète sur Render

### Service 1: Backend Node.js (existant)

**URL:** https://magflow.onrender.com

**Variables d'environnement:**
```env
NODE_ENV=production
PORT=10000
PUBLIC_URL=https://magflow.onrender.com
OPENAI_API_KEY=<votre_clé>
SUPABASE_URL=https://wxtrhxvyjfsqgphboqwo.supabase.co
SUPABASE_ANON_KEY=<votre_clé>
FLASK_API_URL=https://magflow-flask.onrender.com
FLASK_API_TOKEN=replace-with-a-new-random-secret
FRONTEND_URL=https://magflow-app.netlify.app
```

### Service 2: Flask API (à créer)

**URL:** https://magflow-flask.onrender.com (ou autre nom)

**Variables d'environnement:**
```env
OPENAI_API_KEY=<votre_clé>
API_TOKEN=replace-with-a-new-random-secret
```

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
gunicorn app:app --bind 0.0.0.0:$PORT --timeout 300
```

**Note:** Timeout de 300 secondes pour les longues générations InDesign

### Service 3: Frontend (Netlify - existant)

**URL:** https://magflow-app.netlify.app

**Variables d'environnement (Netlify):**
```env
VITE_API_URL=https://magflow.onrender.com
VITE_SUPABASE_URL=https://wxtrhxvyjfsqgphboqwo.supabase.co
VITE_SUPABASE_ANON_KEY=<votre_clé>
```

---

## Checklist de Déploiement

### Backend Node.js
- [x] Ajouter `PUBLIC_URL` dans les variables d'environnement
- [x] Modifier `upload.js` pour utiliser `PUBLIC_URL`
- [ ] Ajouter `FLASK_API_URL` pointant vers le service Flask Render
- [ ] Redéployer le service sur Render

### Flask API
- [ ] Créer un nouveau service Web Service sur Render
- [ ] Configurer Python 3 comme environnement
- [ ] Ajouter `requirements.txt` dans le repo
- [ ] Configurer les variables d'environnement
- [ ] Déployer et noter l'URL finale

### Frontend (Netlify)
- [ ] Vérifier que `VITE_API_URL` pointe vers le backend Render
- [ ] Redéployer si changements nécessaires

### Agent InDesign Desktop
- [ ] Mettre à jour `BACKEND_URL` vers l'URL Render
- [ ] Tester la connexion WebSocket
- [ ] Vérifier l'enregistrement de l'agent dans les logs

---

## Tests de Validation

### 1. Test des images
```bash
# Upload une image via le frontend
# Vérifier que l'URL retournée commence par https://
# Exemple attendu: https://magflow.onrender.com/uploads/images/xxxxx.png
```

### 2. Test Flask API
```bash
# Health check
curl https://magflow-flask.onrender.com/api/status

# Test de génération (avec Bearer token)
curl -X POST https://magflow-flask.onrender.com/api/create-layout-urls \
  -H "Authorization: Bearer replace-with-a-new-random-secret" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "prompt=Test&text_content=Test&image_urls=https://example.com/image.jpg"
```

### 3. Test WebSocket
```bash
# Dans les logs du backend Render, vérifier:
🔌 Agent connecté: <id>
✅ Agent enregistré: <agent_id>
# Et PAS de déconnexion immédiate
```

### 4. Test complet E2E
1. Créer un magazine via le frontend
2. Vérifier les logs du backend
3. Vérifier que Flask est appelé
4. Télécharger le résultat

---

## Problèmes Connus et Solutions

### Problème: "Flask API not responding"

**Cause:** Le service Flask n'est pas démarré ou l'URL est incorrecte

**Solution:**
1. Vérifier que le service Flask est déployé et "Live" sur Render
2. Vérifier `FLASK_API_URL` dans le backend Node.js
3. Tester manuellement: `curl <FLASK_API_URL>/api/status`

### Problème: "Mixed Content"

**Cause:** `PUBLIC_URL` n'est pas configuré en production

**Solution:**
1. Ajouter `PUBLIC_URL=https://magflow.onrender.com` sur Render
2. Redéployer le backend
3. Vérifier les URLs d'images uploadées

### Problème: Agent se déconnecte

**Causes possibles:**
1. L'agent n'envoie pas `agent:register` correctement
2. Le `userId` est manquant ou invalide
3. Problème réseau/firewall

**Solution:**
1. Vérifier les logs de l'agent desktop
2. Vérifier que `BACKEND_URL` pointe vers Render
3. Tester avec `wscat`: `wscat -c wss://magflow.onrender.com`

### Problème: Timeout lors de la génération

**Cause:** Génération InDesign prend trop de temps

**Solution:**
1. Augmenter le timeout dans `flaskService.js` (actuellement 5 minutes)
2. Augmenter le timeout de gunicorn: `--timeout 600`
3. Implémenter un système de job asynchrone avec polling

---

## Structure Finale

```
Production:
┌─────────────────────────────────────────┐
│  Frontend (Netlify)                     │
│  https://magflow-app.netlify.app       │
└────────────┬────────────────────────────┘
             │ HTTPS
             ↓
┌─────────────────────────────────────────┐
│  Backend Node.js (Render)               │
│  https://magflow.onrender.com           │
│  - API REST                             │
│  - WebSocket                            │
│  - Upload images                        │
└────────┬────────────────────────────────┘
         │ HTTPS
         ↓
┌─────────────────────────────────────────┐
│  Flask API (Render)                     │
│  https://magflow-flask.onrender.com     │
│  - Génération InDesign                  │
│  - Analyse OpenAI                       │
└─────────────────────────────────────────┘

         ↑ WebSocket
         │
┌────────┴────────────────────────────────┐
│  Agent Desktop (Local)                  │
│  - InDesign automation                  │
│  - Upload résultats                     │
└─────────────────────────────────────────┘
```

---

## Support et Debug

### Logs utiles

**Backend Node.js (Render):**
- Aller sur Dashboard → magflow service → Logs
- Chercher `[Flask]`, `[Magazine]`, `[Content]`

**Flask API (Render):**
- Aller sur Dashboard → magflow-flask service → Logs
- Chercher erreurs Python, InDesign

**Agent Desktop:**
- Console locale où l'agent tourne
- Logs WebSocket, InDesign automation

### Variables d'environnement de debug

Backend Node.js:
```env
LOG_LEVEL=debug
```

Flask:
```env
FLASK_ENV=development
FLASK_DEBUG=1
```

---

## Next Steps

1. **Déployer Flask sur Render** (priorité haute)
2. **Configurer PUBLIC_URL sur Render** (priorité haute)
3. **Tester la génération complète** (priorité haute)
4. **Corriger WebSocket agent** (priorité moyenne)
5. **Implémenter système de queue pour jobs longs** (futur)
6. **Ajouter monitoring/alerting** (futur)

---

## Contact

Pour toute question ou problème:
1. Vérifier les logs Render
2. Tester les health checks
3. Vérifier les variables d'environnement
4. Consulter ce guide

Bon déploiement! 🚀
