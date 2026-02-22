# 🧪 Guide de Test Rapide - MagFlow

## 🎯 Objectif
Tester le workflow complet de génération de magazine.

---

## ✅ Pré-requis

### Vérifier que tout est démarré

```bash
# 1. Backend (port 3001)
curl http://localhost:3001/health
# ✅ Devrait retourner: {"status":"ok"...}

# 2. Flask (port 5003) - À DÉMARRER si pas encore fait
cd "Indesign automation v1"
python app.py
# ✅ Devrait afficher: * Running on http://localhost:5003

# 3. Frontend (port 5173) - À DÉMARRER
npm run dev
# ✅ Devrait afficher: Local: http://localhost:5173/
```

---

## 🚀 Test Workflow Complet

### Étape 1 : Ouvrir l'application
```
http://localhost:5173/smart-content-creator
```

### Étape 2 : Coller du contenu
Utiliser ce texte de test :

```
L'Intelligence Artificielle dans l'Art Contemporain

L'intelligence artificielle révolutionne le monde de l'art contemporain. 
Les artistes utilisent des algorithmes génératifs pour créer des œuvres 
uniques qui questionnent notre rapport à la créativité.

Cette fusion entre art et technologie ouvre des perspectives inédites. 
Les galeries s'adaptent et proposent des expositions immersives où 
l'art devient une expérience multisensorielle.

Les outils d'IA permettent aux artistes d'explorer de nouveaux territoires 
créatifs, repoussant les limites de l'expression artistique traditionnelle.
```

### Étape 3 : Cliquer "Analyser et choisir un template"

**Attendu :**
- ⏳ Chargement 5-10 secondes
- ✅ Structure éditoriale affichée
  - Titre principal
  - Chapô
  - Sections
  - Mots-clés
- ✅ 3 templates recommandés

**Vérifier dans la console réseau (F12) :**
```
POST http://localhost:3001/api/content/analyze
Status: 200 OK
Response: {success: true, structure: {...}}
```

### Étape 4 : Sélectionner un template

**Attendu :**
- ✅ Template mis en surbrillance
- ✅ Détails du template affichés

### Étape 5 : Ajouter des images (optionnel)

**URLs de test :**
```
https://picsum.photos/800/600
https://picsum.photos/800/601
https://picsum.photos/800/602
```

### Étape 6 : Cliquer "Générer le magazine"

**Attendu :**
- ✅ Redirection vers `/generation-result`
- ✅ Page "Génération en cours..."
- ✅ Progress bar animée
- ⏳ Attente 30-60 secondes

**Vérifier dans la console réseau :**
```
POST http://localhost:3001/api/magazine/generate
Status: 200 OK
Response: {generationId: "...", projectId: "...", downloadUrl: "..."}

GET http://localhost:3001/api/magazine/status/{generationId}
(toutes les 3 secondes)
```

### Étape 7 : Téléchargement

**Attendu :**
- ✅ Message "Magazine généré avec succès !"
- ✅ Bouton "Télécharger le fichier .indd"
- ✅ Clic → Téléchargement du fichier

---

## 🔍 Points de Contrôle

### Backend API
```bash
# Templates disponibles
curl http://localhost:3001/api/templates
# ✅ Doit retourner 3 templates

# Analyse de contenu
curl -X POST http://localhost:3001/api/content/analyze \
  -H "Content-Type: application/json" \
  -d '{"content":"Test court pour analyse"}'
# ✅ Doit retourner une structure

# Recommandations
curl -X POST http://localhost:3001/api/templates/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "contentStructure": {"categorie_suggeree": "Art & Culture"},
    "imageCount": 3
  }'
# ✅ Doit retourner des templates recommandés
```

### Console Navigateur (F12)
Vérifier qu'il n'y a PAS :
- ❌ Erreurs CORS
- ❌ 404 Not Found
- ❌ Erreurs OpenAI API
- ❌ Erreurs de parsing JSON

Vérifier qu'il y a :
- ✅ Appels API réussis (200 OK)
- ✅ Logs de succès

---

## 🐛 Dépannage

### Erreur : "Network Error"
**Cause :** Backend non démarré  
**Solution :**
```bash
cd backend
npm run dev
```

### Erreur : "Flask not responding"
**Cause :** Flask non démarré  
**Solution :**
```bash
cd "Indesign automation v1"
python app.py
```

### Erreur : "Could not find table"
**Cause :** Supabase non initialisé  
**Solution :** Exécuter `backend/supabase-schema.sql`

### Erreur : "OpenAI API Error"
**Cause :** Clé API invalide  
**Solution :** Vérifier `backend/.env` → `OPENAI_API_KEY`

### Frontend ne charge pas
**Cause :** Dépendances manquantes  
**Solution :**
```bash
npm install
npm run dev
```

---

## 📊 Vérifications Finales

### ✅ Checklist Complète

- [ ] Backend répond sur port 3001
- [ ] Frontend accessible sur port 5173
- [ ] Flask répond sur port 5003
- [ ] Supabase contient 3 templates
- [ ] Analyse de contenu fonctionne
- [ ] Recommandation de templates fonctionne
- [ ] Génération lance Flask
- [ ] Page résultat affiche le statut
- [ ] Fichier .indd téléchargeable
- [ ] Pas d'erreurs console

### ✅ Tests API Unitaires

```bash
# Test complet automatique
cd backend
npm test

# Tests E2E (si Playwright installé)
cd ..
npm run test:e2e:headed
```

---

## 🎉 Succès !

Si tous les points sont verts ✅, félicitations ! 

Votre installation MagFlow est complète et fonctionnelle.

**Prochaines étapes :**
1. Générer votre premier magazine
2. Ouvrir le .indd dans InDesign
3. Personnaliser le design
4. Exporter en PDF

---

## 📞 Support

**Logs utiles :**
```bash
# Backend
tail -f backend.log

# Flask  
tail -f flask.log

# Frontend
tail -f frontend.log
```

**Documentation :**
- `QUICKSTART.md` - Démarrage rapide
- `backend/README.md` - API documentation
- `COMMANDES.md` - Toutes les commandes
- `SESSION_01OCT_MATIN.md` - Derniers changements

---

**Version :** 1.0.0-rc1  
**Date :** 2025-10-01  
**Statut :** 🟢 Ready to test
