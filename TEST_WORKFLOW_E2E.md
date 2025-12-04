# Guide de Test E2E - MagFlow

## ✅ Corrections Appliquées

### 1. **Chemin basePath corrigé**
   - `template_simple_working.jsx` pointe maintenant vers `/magflow/Indesign automation v1`
   - Les dossiers `uploads/`, `output/`, `indesign_templates/` sont accessibles

### 2. **Endpoint /api/status ajouté**
   - Flask répond maintenant correctement aux health checks
   - Backend Node peut vérifier la disponibilité de Flask

### 3. **Format de contenu amélioré**
   - `flaskService.js` formate désormais `contentStructure` en texte lisible
   - Plus de JSON brut dans InDesign - contenu structuré avec sections

### 4. **Gestion d'erreurs images**
   - Messages d'erreur détaillés pour le téléchargement d'images
   - Logs précis : URL, taille, type MIME
   - Erreur explicite si aucune image n'est téléchargeable

### 5. **Tokens vérifiés**
   - Backend Node : `FLASK_API_TOKEN=alexandreesttropbeau`
   - Flask : `API_TOKEN=alexandreesttropbeau`
   - ✅ Authentification synchronisée

### 6. **Script de test créé**
   - `Indesign automation v1/test-flask-direct.sh`
   - Teste Flask isolément sans dépendances

---

## 🧪 Plan de Test Complet

### Étape 1 : Test Flask Isolé

```bash
cd "Indesign automation v1"

# Démarrer Flask (si pas déjà lancé)
python app.py

# Dans un autre terminal
./test-flask-direct.sh
```

**Vérifications :**
- ✅ `/api/status` retourne 200
- ✅ `/api/templates` liste les templates
- ✅ `/api/create-layout-urls` génère un fichier `.indd`
- ✅ Fichier présent dans `output/`

---

### Étape 2 : Test Backend Node

```bash
cd magflow

# Démarrer le backend (si pas déjà lancé)
npm run dev

# Dans un autre terminal - Test API direct
curl -X POST http://localhost:3001/api/magazine/generate \
  -H "Content-Type: application/json" \
  -d '{
    "contentStructure": {
      "titre_principal": "Test Article",
      "chapo": "Sous-titre de test",
      "sections": [
        {"titre": "Introduction", "contenu": "Contenu de l'introduction..."}
      ]
    },
    "template": {
      "id": 1,
      "name": "Magazine Artistique Simple",
      "filename": "template-mag-simple-1808.indt"
    },
    "images": ["https://images.unsplash.com/photo-1549887534-1541e9326642?w=800"]
  }'
```

**Vérifications :**
- ✅ Backend appelle Flask avec succès
- ✅ Reçoit `projectId` et `downloadUrl`
- ✅ Logs montrent le workflow complet

---

### Étape 3 : Test Frontend Complet

```bash
# Démarrer le frontend (si pas déjà lancé)
npm run dev:frontend

# Ouvrir navigateur
open http://localhost:5173
```

**Workflow UI :**
1. Aller sur **Smart Content Creator**
2. Coller un texte (>50 caractères)
3. Cliquer **"Analyser et choisir un template"**
4. Attendre l'analyse IA (~10s)
5. Vérifier la structure éditoriale
6. Sélectionner un template recommandé
7. (Optionnel) Ajouter des images
8. Cliquer **"Générer le magazine"**
9. Attendre la redirection vers résultat
10. Télécharger le fichier `.indd`

---

### Étape 4 : Test E2E Playwright

```bash
# S'assurer que tous les services tournent
npm run start:all

# Lancer les tests E2E
npm run test:e2e
```

**Tests automatiques :**
- ✅ Navigation et formulaires
- ✅ Analyse IA du contenu
- ✅ Sélection de template
- ✅ Génération complète
- ✅ Téléchargement du fichier

---

## 🔧 Dépannage

### Problème : "Téléchargement des images échoué"

**Causes possibles :**
1. URL d'image invalide ou inaccessible
2. Firewall/réseau bloque les requêtes
3. Format d'image non supporté

**Solutions :**
```bash
# Tester l'URL d'image directement
curl -I "https://images.unsplash.com/photo-1549887534-1541e9326642?w=800"

# Vérifier les logs Flask détaillés
tail -f flask.log
```

### Problème : "Dossier uploads non trouvé"

**Cause :** Chemin `basePath` incorrect dans le JSX

**Solution :**
- Vérifier ligne 69 de `template_simple_working.jsx`
- Doit pointer vers `magflow/Indesign automation v1`

### Problème : "Template non trouvé"

**Vérifications :**
```bash
cd "Indesign automation v1/indesign_templates"
ls -la *.indt
```

Templates attendus :
- `template-mag-simple-1808.indt`
- `template-mag-simple-2-1808.indt`

### Problème : "Flask API not responding"

**Vérifications :**
```bash
# Flask tourne-t-il ?
curl http://localhost:5003/api/status

# Vérifier le port
lsof -i :5003

# Relancer Flask
cd "Indesign automation v1"
python app.py
```

### Problème : InDesign ne se lance pas

**Vérifications :**
1. InDesign est installé et accessible
2. Scripts activés dans InDesign (Préférences > Scripts)
3. Nom de l'app correct dans `.env` : `INDESIGN_APP_NAME=Adobe InDesign 2025`

---

## 📊 Logs Utiles

```bash
# Logs backend Node
tail -f backend.log

# Logs Flask
tail -f flask.log

# Logs InDesign (créés par le script JSX)
tail -f "Indesign automation v1/debug_indesign.log"
```

---

## 🎯 Checklist Finale

Avant de déclarer le workflow opérationnel :

- [ ] Flask répond à `/api/status`
- [ ] Templates listés via `/api/templates`
- [ ] Tokens synchronisés (Node ↔ Flask)
- [ ] Chemin `basePath` correct dans JSX
- [ ] Test Flask isolé réussi (`test-flask-direct.sh`)
- [ ] Backend Node appelle Flask avec succès
- [ ] Contenu formaté en texte (pas JSON)
- [ ] Images téléchargées correctement
- [ ] InDesign génère le fichier `.indd`
- [ ] Fichier téléchargeable depuis l'UI
- [ ] Tests E2E Playwright passent

---

## 📝 Notes Importantes

### Format du contenu

Le backend formate maintenant `contentStructure` en texte lisible :
```js
// Avant (❌)
text_content: JSON.stringify(contentStructure)

// Après (✅)
text_content: formatContentForInDesign(contentStructure)
// Résultat : "Section 1\n\nContenu...\n\nSection 2\n\nContenu..."
```

### Gestion des images

Images acceptées :
- URLs publiques (Unsplash, S3, etc.)
- Formats : JPG, PNG, GIF, TIFF, PSD
- Logs détaillés en cas d'erreur

### Templates disponibles

Chaque template a ses propres placeholders :
- `template-mag-simple-1808.indt` : `{{TITRE}}`, `{{SOUS-TITRE}}`, `{{ARTICLE}}`
- `template-mag-simple-2-1808.indt` : `{{ARTICLE}}` uniquement

---

## 🚀 Prochaines Étapes

1. **Test de bout en bout** : Lancer `npm run test:e2e`
2. **Migration template final** : Adapter `template_final_working.jsx` si besoin
3. **Robustesse parsing JSON** : Améliorer ExtendScript si structures complexes
4. **n8n (optionnel)** : Mettre à jour workflow si utilisé

---

**Date de mise à jour :** 2025-10-02  
**Version :** 1.0  
**Testé avec :** Node.js v22, Python 3.9, InDesign 2025
