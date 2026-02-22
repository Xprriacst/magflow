# 🚀 MagFlow - Guide de démarrage rapide

## ⚡ Démarrage en 3 minutes

### 1️⃣ Initialiser Supabase (1 min)

**Option A : Via Dashboard Supabase** (recommandé)

1. Aller sur https://wxtrhxvyjfsqgphboqwo.supabase.co
2. Cliquer sur **SQL Editor** (dans le menu gauche)
3. **New query**
4. Copier/coller le contenu de `backend/supabase-schema.sql`
5. Cliquer sur **Run** (ou `Ctrl+Enter`)

✅ Vous devriez voir : `Success. No rows returned`

**Vérification :**
```sql
SELECT * FROM indesign_templates;
```
Vous devriez voir 3 templates.

---

### 2️⃣ Installer les dépendances (1 min)

```bash
# Backend
cd backend
npm install
cd ..

# Frontend (si pas déjà fait)
npm install

# Playwright (tests E2E)
npx playwright install
```

---

### 3️⃣ Démarrer l'application (30 secondes)

**Option A : Script automatique** (macOS/Linux)

```bash
./start-all.sh
```

Cela démarre :
- ✅ Backend Node.js (port 3001)
- ✅ Frontend React (port 5173)
- ✅ Flask API (port 5003)

**Option B : Manuel** (3 terminaux)

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend :**
```bash
npm run dev
```

**Terminal 3 - Flask :**
```bash
cd "Indesign automation v1"
python app.py
```

---

## 🎯 Test rapide

### Vérifier que tout fonctionne

**1. Backend :**
```bash
curl http://localhost:3001/health
# Réponse attendue: {"status":"ok",...}
```

**2. Templates :**
```bash
curl http://localhost:3001/api/templates
# Réponse attendue: {"success":true,"templates":[...]}
```

**3. Flask :**
```bash
curl http://localhost:5003/api/status
# Réponse attendue: {"status":"running",...}
```

**4. Frontend :**
Ouvrir http://localhost:5173 dans le navigateur

---

## 📝 Premier test de génération

1. Aller sur http://localhost:5173/smart-content-creator

2. Coller ce texte :
```
L'Intelligence Artificielle dans l'Art Contemporain

L'intelligence artificielle transforme radicalement le paysage artistique contemporain. 
Les artistes explorent de nouvelles formes d'expression en intégrant des algorithmes de 
génération d'images, de musique et même de textes dans leurs créations.

Cette révolution technologique soulève des questions fondamentales sur la nature de la 
créativité, l'originalité et le rôle de l'artiste à l'ère numérique. Les œuvres générées 
par IA questionnent notre conception même de l'art.
```

3. Cliquer sur **"Analyser et choisir un template"**

4. Attendre 5-10 secondes → Structure éditoriale apparaît ✨

5. Sélectionner un template

6. Ajouter des images (URLs ou fichiers)

7. Cliquer sur **"Générer le magazine"**

8. Attendre 30-60 secondes → Fichier .indd généré ! 🎉

---

## 🧪 Lancer les tests

```bash
# Tests E2E (Playwright)
npm run test:e2e

# Tests E2E avec UI
npm run test:e2e:ui

# Tests backend
cd backend
npm test
```

---

## 🛑 Arrêter l'application

**Option A : Script automatique**
```bash
./stop-all.sh
```

**Option B : Manuel**
```bash
# Trouver les processus
lsof -ti:3001,5173,5003 | xargs kill -9
```

---

## 🐛 Problèmes courants

### Backend ne démarre pas
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Flask ne répond pas
```bash
cd "Indesign automation v1"

# Créer venv si nécessaire
python3 -m venv venv
source venv/bin/activate

# Installer dépendances
pip install -r requirements.txt

# Démarrer
python app.py
```

### Tables Supabase manquantes
Retourner à l'étape 1️⃣ et exécuter `backend/supabase-schema.sql`

### Port déjà utilisé
```bash
# Libérer le port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Libérer le port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Libérer le port 5003 (flask)
lsof -ti:5003 | xargs kill -9
```

---

## 📊 Architecture

```
┌─────────────┐
│   Browser   │
│ (port 5173) │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌─────────────┐
│   React     │─────▶│  Backend    │
│  Frontend   │      │   Node.js   │
└─────────────┘      │ (port 3001) │
                     └──────┬──────┘
                            │
                   ┌────────┴────────┐
                   ▼                 ▼
            ┌──────────┐      ┌──────────┐
            │ Supabase │      │  Flask   │
            │    DB    │      │   API    │
            └──────────┘      │(port 5003)│
                              └─────┬─────┘
                                    │
                                    ▼
                              ┌──────────┐
                              │ InDesign │
                              │Automation│
                              └──────────┘
```

---

## 🎯 Prochaines étapes

1. ✅ Initialisation complète ← **VOUS ÊTES ICI**
2. 🔄 Tests de bout en bout
3. 🎨 Intégration frontend complète
4. 🚀 Déploiement production

---

## 📚 Documentation complète

- Backend : `backend/README.md`
- Tests : `e2e/README.md` (à créer)
- Flask : `Indesign automation v1/README.md`

---

## 🆘 Aide

**Logs en temps réel :**
```bash
# Backend
tail -f backend.log

# Frontend
tail -f frontend.log

# Flask
tail -f flask.log
```

**Support :**
- GitHub Issues : https://github.com/Xprriacst/magflow/issues
- Documentation InDesign API : `MODE_OPERATOIRE_API_INDESIGN.md`

---

**Version :** 1.0.0  
**Date :** 2025-09-30  
**Status :** 🟢 Ready to use
