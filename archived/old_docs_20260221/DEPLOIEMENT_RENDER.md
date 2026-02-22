# Guide de Déploiement Render - MagFlow

## 📋 Résumé des Changements

### ✅ Corrections Appliquées

1. **URLs d'images HTTPS** - Ajout de `PUBLIC_URL` pour résoudre Mixed Content
2. **Structure Flask** - Copie du code Flask dans `flask-api/` pour déploiement
3. **Configuration Render** - Fichiers `render.yaml` et documentation

### 🎯 Actions Requises

Vous devez maintenant:
1. Déployer le service Flask sur Render
2. Configurer les variables d'environnement sur Render
3. Tester la connexion complète

---

## 🚀 Déploiement Flask sur Render

### Option 1: Déploiement Rapide (Monorepo)

Si votre code est déjà dans un repo Git:

1. **Push le dossier `flask-api/`:**
   ```bash
   cd /Users/alexandreerrasti/magflow0312
   git add flask-api/
   git commit -m "Add Flask API for Render deployment"
   git push
   ```

2. **Créer le service sur Render:**
   - Aller sur https://dashboard.render.com/
   - Cliquer "New +" → "Web Service"
   - Sélectionner votre repository
   - **Root Directory:** `flask-api`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 300 --workers 2`

3. **Variables d'environnement:**
   ```
   OPENAI_API_KEY=<copier depuis backend/.env>
   API_TOKEN=alexandreesttropbeau
   ```

4. **Cliquer "Create Web Service"**

### Option 2: Repository Séparé

Si vous préférez un repo séparé pour Flask:

1. **Créer un nouveau repo Git:**
   ```bash
   cd /Users/alexandreerrasti/magflow0312/flask-api
   git init
   git add .
   git commit -m "Initial Flask API"
   # Créer repo sur GitHub, puis:
   git remote add origin <url-github>
   git push -u origin main
   ```

2. Suivre les étapes ci-dessus en sélectionnant ce nouveau repo

---

## ⚙️ Configuration Backend Node.js sur Render

Une fois Flask déployé (exemple: `https://magflow-flask-xxxxxxx.onrender.com`):

### 1. Aller dans le service Backend Node.js

Dashboard → votre service magflow → Environment

### 2. Ajouter/Modifier ces variables:

```env
# URL publique pour les images (IMPORTANT!)
PUBLIC_URL=https://magflow.onrender.com

# URL du service Flask (remplacer par votre URL Flask)
FLASK_API_URL=https://magflow-flask-xxxxxxx.onrender.com

# Token Flask
FLASK_API_TOKEN=alexandreesttropbeau

# Autres variables (vérifier qu'elles existent)
NODE_ENV=production
OPENAI_API_KEY=<votre_clé>
SUPABASE_URL=https://wxtrhxvyjfsqgphboqwo.supabase.co
SUPABASE_ANON_KEY=<votre_clé>
FRONTEND_URL=https://magflow-app.netlify.app
```

### 3. Redéployer

Cliquer "Manual Deploy" → "Deploy latest commit"

---

## 🧪 Tests de Validation

### 1. Test Flask API

```bash
# Health check (remplacer URL)
curl https://magflow-flask-xxxxxxx.onrender.com/api/status

# Devrait retourner:
# {"status": "ok", "timestamp": "..."}
```

### 2. Test Backend URLs Images

```bash
# Upload test via frontend
# Vérifier dans la réponse que l'URL commence par:
# https://magflow.onrender.com/uploads/images/...
```

### 3. Test Génération Complète

1. Aller sur https://magflow-app.netlify.app
2. Coller du texte
3. Uploader une image
4. Sélectionner un template
5. Cliquer "Générer"
6. **Vérifier les logs Render:**
   - Backend: Should show `[Flask] Calling https://...`
   - Flask: Should show incoming request

---

## 📊 Monitoring

### Logs Backend Node.js

```
Dashboard → magflow service → Logs
```

Chercher:
- `[Flask] Calling http://localhost:5003` → ❌ PROBLÈME (devrait être HTTPS)
- `[Flask] Calling https://magflow-flask...` → ✅ BON
- `Flask API not responding` → ❌ Flask pas déployé ou URL incorrecte

### Logs Flask API

```
Dashboard → magflow-flask service → Logs
```

Chercher:
- Erreurs Python
- Téléchargement des images
- Appels OpenAI
- Génération InDesign

---

## 🐛 Troubleshooting

### Problème: "Flask API not responding"

**Vérifications:**
1. Service Flask est "Live" sur Render?
2. `FLASK_API_URL` est correct dans backend Node.js?
3. Test manuel: `curl <FLASK_API_URL>/api/status`

**Solution:**
- Vérifier les logs Flask pour voir les erreurs
- Vérifier que `API_TOKEN` est identique dans les deux services

### Problème: "Mixed Content" toujours présent

**Vérifications:**
1. `PUBLIC_URL` est configuré dans backend Node.js sur Render?
2. Backend a été redéployé après l'ajout de `PUBLIC_URL`?

**Solution:**
```bash
# Vérifier dans Render Dashboard → backend → Environment
# Doit avoir: PUBLIC_URL=https://magflow.onrender.com

# Puis redéployer
```

### Problème: Flask timeout

**Symptôme:** Génération prend trop de temps et échoue

**Solution:**
- Augmenter timeout dans `flaskService.js` (ligne 92):
  ```javascript
  timeout: 600000 // 10 minutes au lieu de 5
  ```
- Augmenter timeout gunicorn dans Start Command:
  ```
  --timeout 600
  ```

### Problème: Images non téléchargées par Flask

**Symptôme:** Flask ne peut pas télécharger les images depuis Render backend

**Cause:** Les images sont dans un stockage éphémère Render

**Solutions:**
1. **Court terme:** Utiliser l'agent Desktop qui a accès local
2. **Moyen terme:** Uploader vers Supabase Storage
3. **Long terme:** Utiliser S3 ou Cloudinary

---

## 🔐 Sécurité: Clé API Exposée

⚠️ **URGENT:** Votre clé OpenAI est visible dans le fichier `.env`

### Action Immédiate:

1. **Révoquer la clé actuelle:**
   - Aller sur https://platform.openai.com/api-keys
   - Supprimer la clé exposée

2. **Créer une nouvelle clé:**
   - Créer une nouvelle clé API
   - **NE JAMAIS** la committer dans Git

3. **Configurer sur Render:**
   - Backend Node.js: Environment → `OPENAI_API_KEY=<nouvelle_clé>`
   - Flask API: Environment → `OPENAI_API_KEY=<nouvelle_clé>`

4. **Supprimer du Git:**
   ```bash
   # Ajouter .env dans .gitignore (déjà fait)
   git rm --cached magflow/backend/.env
   git commit -m "Remove exposed .env file"
   git push
   ```

---

## 📁 Structure Finale du Projet

```
magflow0312/
├── magflow/
│   ├── backend/               # Backend Node.js
│   │   ├── .env              # ❌ Ne pas committer!
│   │   ├── routes/
│   │   │   └── upload.js     # ✅ Modifié (PUBLIC_URL)
│   │   └── server.js
│   └── src/                  # Frontend React
│
├── flask-api/                # 🆕 Flask API pour Render
│   ├── app.py               # Flask application
│   ├── requirements.txt     # Dépendances Python
│   ├── .env.example         # Template config
│   ├── .gitignore           # Ignorer .env, venv, etc.
│   ├── render.yaml          # Config Render
│   └── README.md            # Doc Flask
│
├── GUIDE_CORRECTION.md      # 🆕 Guide complet des corrections
├── DEPLOIEMENT_RENDER.md    # 🆕 Ce fichier
└── magflow-agent-simple/    # Agent Desktop (WebSocket)
```

---

## ✅ Checklist de Déploiement

### Avant Déploiement
- [x] Code Flask copié dans `flask-api/`
- [x] `PUBLIC_URL` ajouté dans `backend/.env` local
- [x] `upload.js` modifié pour utiliser `PUBLIC_URL`
- [x] Documentation créée

### Déploiement Flask
- [ ] Code Flask pushé dans Git
- [ ] Service Flask créé sur Render
- [ ] Variables d'environnement configurées (OPENAI_API_KEY, API_TOKEN)
- [ ] Service déployé avec succès
- [ ] Health check OK: `curl <flask-url>/api/status`

### Configuration Backend
- [ ] `PUBLIC_URL` ajouté sur Render (backend Node.js)
- [ ] `FLASK_API_URL` ajouté sur Render (backend Node.js)
- [ ] Backend redéployé
- [ ] Test upload image → URL commence par `https://`

### Sécurité
- [ ] Ancienne clé OpenAI révoquée
- [ ] Nouvelle clé créée
- [ ] Nouvelle clé configurée sur Render (backend + Flask)
- [ ] `.env` retiré du Git

### Tests Finaux
- [ ] Upload d'image fonctionne (HTTPS)
- [ ] Flask API répond (health check)
- [ ] Génération magazine fonctionne end-to-end
- [ ] Pas d'erreur "Mixed Content" dans la console
- [ ] Logs backend montrent appel Flask avec HTTPS

---

## 🎉 Prochaines Étapes

Une fois tout déployé et fonctionnel:

1. **Agent InDesign Desktop:**
   - Configurer `BACKEND_URL` pour pointer vers Render
   - Tester connexion WebSocket
   - Valider génération via agent

2. **Optimisations:**
   - Implémenter upload S3/Supabase pour les images
   - Job queue pour générations longues
   - Monitoring et alertes

3. **Documentation:**
   - Guide utilisateur
   - API documentation (Swagger)
   - Guide de contribution

---

## 📞 Support

En cas de problème:

1. **Vérifier les logs Render** (backend + Flask)
2. **Tester les endpoints** avec curl
3. **Vérifier les variables d'environnement** sur Render
4. **Consulter les guides:**
   - [GUIDE_CORRECTION.md](./GUIDE_CORRECTION.md) - Détails techniques
   - [flask-api/README.md](./flask-api/README.md) - Documentation Flask

Bon déploiement! 🚀
