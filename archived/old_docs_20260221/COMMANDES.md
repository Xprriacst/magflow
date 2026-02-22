# 🖥️ Commandes Utiles - MagFlow

## 🚀 Démarrage

### Démarrer tout (Backend + Frontend + Flask)
```bash
./start-all.sh
```

### Démarrer individuellement

**Backend seul :**
```bash
cd backend
npm run dev
```

**Frontend seul :**
```bash
npm run dev
```

**Flask seul :**
```bash
cd "Indesign automation v1"
source venv/bin/activate  # Si venv existe
python app.py
```

---

## 🛑 Arrêt

### Tout arrêter
```bash
./stop-all.sh
```

### Arrêter un service spécifique
```bash
# Trouver le PID et tuer
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:5003 | xargs kill -9  # Flask
```

---

## 🧪 Tests

### Tests E2E (Playwright)
```bash
# Mode interactif (recommandé)
npm run test:e2e:ui

# Mode headless
npm run test:e2e

# Mode avec navigateur visible
npm run test:e2e:headed

# Voir le dernier rapport
npm run test:report
```

### Tests Backend
```bash
cd backend
npm test
npm run test:ui
npm run test:coverage
```

---

## 🔍 Vérifications Santé

### Backend
```bash
curl http://localhost:3001/health
```
**Réponse attendue :**
```json
{"status":"ok","timestamp":"...","version":"1.0.0"}
```

### Templates
```bash
curl http://localhost:3001/api/templates
```
**Réponse attendue :**
```json
{"success":true,"templates":[...]}
```

### Flask
```bash
curl http://localhost:5003/api/status
```

### OpenAI Configuration
```bash
curl http://localhost:3001/api/content/health
```

---

## 📊 Tests API Complets

### Analyser un contenu
```bash
curl -X POST http://localhost:3001/api/content/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "L'\''intelligence artificielle transforme le monde de l'\''art. Les artistes utilisent des algorithmes pour créer des œuvres uniques. Cette révolution technologique questionne la nature même de la créativité."
  }'
```

### Obtenir les templates
```bash
curl http://localhost:3001/api/templates
```

### Recommander des templates
```bash
curl -X POST http://localhost:3001/api/templates/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "contentStructure": {
      "titre_principal": "Art et IA",
      "categorie_suggeree": "Art & Culture",
      "niveau_complexite": "moyen"
    },
    "imageCount": 3
  }'
```

### Générer un magazine (exemple complet)
```bash
curl -X POST http://localhost:3001/api/magazine/generate \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Article original...",
    "contentStructure": {
      "titre_principal": "Test",
      "chapo": "Chapô test",
      "sections": []
    },
    "template": {
      "id": "uuid-from-templates",
      "filename": "template-mag-simple-1808.indt"
    },
    "images": [
      "https://picsum.photos/800/600",
      "https://picsum.photos/800/601",
      "https://picsum.photos/800/602"
    ]
  }'
```

---

## 📝 Logs

### Voir les logs en temps réel
```bash
# Backend
tail -f backend.log

# Frontend
tail -f frontend.log

# Flask
tail -f flask.log

# Tous en même temps (nécessite tmux ou screen)
tail -f backend.log frontend.log flask.log
```

### Voir les dernières lignes
```bash
tail -n 50 backend.log
tail -n 50 flask.log
```

---

## 🗄️ Base de Données (Supabase)

### Initialiser (première fois)
```bash
# Via dashboard : https://wxtrhxvyjfsqgphboqwo.supabase.co
# SQL Editor → Exécuter backend/supabase-schema.sql
```

### Requêtes SQL utiles

**Lister les templates :**
```sql
SELECT name, filename, category, style, image_slots 
FROM indesign_templates 
WHERE is_active = true;
```

**Voir l'historique des générations :**
```sql
SELECT 
  g.id,
  g.status,
  g.created_at,
  t.name as template_name,
  array_length(g.image_urls, 1) as image_count
FROM magazine_generations g
LEFT JOIN indesign_templates t ON g.template_id = t.id
ORDER BY g.created_at DESC
LIMIT 10;
```

**Statistiques des templates :**
```sql
SELECT * FROM templates_stats;
```

**Chercher un template :**
```sql
SELECT * FROM search_templates('art culture', 'Art & Culture');
```

---

## 🔧 Maintenance

### Nettoyer les node_modules
```bash
# Frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
cd ..
```

### Nettoyer les logs
```bash
rm -f backend.log frontend.log flask.log
```

### Nettoyer les fichiers temporaires
```bash
rm -f .backend.pid .frontend.pid .flask.pid
```

### Réinstaller Playwright
```bash
npx playwright install
```

---

## 🐛 Debug

### Vérifier les ports utilisés
```bash
lsof -i :3001  # Backend
lsof -i :5173  # Frontend
lsof -i :5003  # Flask
```

### Vérifier les variables d'environnement
```bash
# Frontend
cat .env

# Backend
cat backend/.env
```

### Tester Flask directement
```bash
cd "Indesign automation v1"
python -c "import app; print('Flask OK')"
```

### Vérifier InDesign
```bash
# Voir si InDesign est installé
ls -la "/Applications/Adobe InDesign 2024/"
```

---

## 📦 Installation

### Première installation complète
```bash
# Frontend
npm install
npx playwright install

# Backend
cd backend
npm install
cd ..

# Flask (si venv n'existe pas)
cd "Indesign automation v1"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

---

## 🌐 URLs Importantes

### Local
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Flask: http://localhost:5003

### Dashboard
- Supabase: https://wxtrhxvyjfsqgphboqwo.supabase.co
- GitHub: https://github.com/Xprriacst/magflow
- n8n: https://polaris-ia.app.n8n.cloud

---

## 🎨 Workflow Typique

```bash
# 1. Démarrer les services
./start-all.sh

# 2. Ouvrir le navigateur
open http://localhost:5173/smart-content-creator

# 3. En parallèle, surveiller les logs
tail -f backend.log

# 4. Tester les modifications
npm run test:e2e:ui

# 5. Commit
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push

# 6. Arrêter
./stop-all.sh
```

---

## 🚨 Commandes d'urgence

### Tout réinitialiser
```bash
./stop-all.sh
rm -f *.log .*.pid
lsof -ti:3001,5173,5003 | xargs kill -9 2>/dev/null || true
./start-all.sh
```

### Vérifier que tout fonctionne
```bash
curl http://localhost:3001/health && \
curl http://localhost:5173 -I && \
curl http://localhost:5003/api/status && \
echo "✅ Tous les services répondent"
```

---

**Aide rapide :**
- `./start-all.sh` - Tout démarrer
- `./stop-all.sh` - Tout arrêter
- `npm run test:e2e:ui` - Tests visuels
- `tail -f backend.log` - Voir les logs

**Documentation complète :**
- QUICKSTART.md
- backend/README.md
- NEXT_STEPS.md
