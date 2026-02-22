# ⚡ Actions Immédiates - MagFlow

## ✅ Corrections Appliquées

J'ai corrigé les problèmes suivants:

### 1. Mixed Content (Images HTTP/HTTPS) ✅
- **Fichier modifié:** [backend/routes/upload.js](magflow/backend/routes/upload.js)
- **Changement:** Utilise maintenant `PUBLIC_URL` au lieu de `req.get('host')`

### 2. Structure Flask pour Déploiement ✅
- **Nouveau dossier:** `flask-api/`
- **Contenu:** Code Flask copié et prêt pour Render

### 3. Documentation Complète ✅
- [GUIDE_CORRECTION.md](GUIDE_CORRECTION.md) - Guide technique détaillé
- [DEPLOIEMENT_RENDER.md](DEPLOIEMENT_RENDER.md) - Guide de déploiement étape par étape
- [flask-api/README.md](flask-api/README.md) - Documentation Flask API

---

## 🚨 Actions Requises MAINTENANT

### 1. Déployer Flask sur Render (30 minutes)

**Étapes rapides:**

1. **Le code est déjà pushé sur GitHub** ✅

2. **Créer service sur Render:**
   - Aller: https://dashboard.render.com/
   - New + → Web Service
   - Sélectionner votre repo
   - Root Directory: `flask-api`
   - Build: `pip install -r requirements.txt`
   - Start: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 300 --workers 2`

3. **Variables d'environnement:**
   ```
   OPENAI_API_KEY=<votre_clé_openai>
   API_TOKEN=alexandreesttropbeau
   ```

4. **Cliquer "Create Web Service"**

5. **Noter l'URL finale** (ex: `https://magflow-flask-xyz.onrender.com`)

---

### 2. Configurer Backend Node.js (5 minutes)

Une fois Flask déployé:

1. **Aller dans Render Dashboard** → votre service backend → Environment

2. **Ajouter ces variables:**
   ```
   PUBLIC_URL=https://magflow.onrender.com
   FLASK_API_URL=https://magflow-flask-xyz.onrender.com
   FLASK_API_TOKEN=alexandreesttropbeau
   ```

3. **Redéployer:** Manual Deploy → Deploy latest commit

---

### 3. Sécurité - Révoquer Clé OpenAI (URGENT - 5 minutes)

⚠️ Votre clé OpenAI est exposée dans ce fichier!

1. **Révoquer:** https://platform.openai.com/api-keys → Supprimer la clé
2. **Créer nouvelle clé**
3. **Configurer sur Render:**
   - Backend: `OPENAI_API_KEY=<nouvelle_clé>`
   - Flask: `OPENAI_API_KEY=<nouvelle_clé>`

---

## 🧪 Tester Que Tout Fonctionne

### Test 1: Flask API
```bash
curl https://magflow-flask-xyz.onrender.com/api/status
```
✅ Devrait retourner: `{"status": "ok", ...}`

### Test 2: Upload Image
1. Aller sur https://magflow-app.netlify.app
2. Uploader une image
3. Vérifier que l'URL commence par `https://magflow.onrender.com/uploads/...`

### Test 3: Génération Complète
1. Coller du texte
2. Uploader une image
3. Générer magazine
4. Vérifier les logs Render (backend + Flask)

---

## 📋 Checklist Rapide

- [ ] Flask déployé sur Render
- [ ] Variables `PUBLIC_URL` et `FLASK_API_URL` ajoutées au backend
- [ ] Backend redéployé
- [ ] Clé OpenAI révoquée et recréée
- [ ] Test upload image (URL HTTPS)
- [ ] Test génération magazine
- [ ] Pas d'erreur "Mixed Content"
- [ ] Pas d'erreur "Flask API not responding"

---

## 📚 Documentation Complète

Pour plus de détails:
- **Problèmes et solutions:** [GUIDE_CORRECTION.md](GUIDE_CORRECTION.md)
- **Déploiement détaillé:** [DEPLOIEMENT_RENDER.md](DEPLOIEMENT_RENDER.md)
- **Flask API:** [flask-api/README.md](flask-api/README.md)

---

## 🆘 Besoin d'Aide?

Si problème:
1. Vérifier les logs Render (Dashboard → Logs)
2. Tester les endpoints avec curl
3. Vérifier les variables d'environnement
4. Consulter les guides ci-dessus

Bon déploiement! 🚀
