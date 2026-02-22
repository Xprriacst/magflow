# 🤖 Sprint 1.3 - Analyse Automatique des Templates

**Date:** 24 Octobre 2025  
**Objectif:** Extraire automatiquement les métadonnées des templates InDesign et les enrichir avec l'IA

---

## 🎯 Problème Résolu

**Avant:**
- Métadonnées des templates saisies **manuellement** dans Supabase
- `image_slots`, `category`, `style`, `recommended_for` → Valeurs arbitraires
- Risque d'erreurs et d'incohérences
- Pas de mise à jour automatique

**Après:**
- **Extraction automatique** depuis les fichiers InDesign
- **Enrichissement IA** pour catégorie et style
- Interface admin pour déclencher l'analyse
- Métadonnées précises et cohérentes

---

## ✅ Fonctionnalités Implémentées

### 1. Script InDesign d'Analyse
**Fichier:** `Indesign automation v1/scripts/analyze_templates.jsx`

**Extrait automatiquement:**
- ✅ Nombre d'emplacements images (comptage intelligent des rectangles vides)
- ✅ Placeholders de texte (`{{TITRE}}`, `{{CHAPO}}`, etc.)
- ✅ Polices utilisées
- ✅ Nuancier de couleurs
- ✅ Métadonnées InDesign (auteur, description, keywords)
- ✅ Nombre de pages/spreads
- ✅ Dimensions du document

**Algorithme de détection d'images:**
```javascript
function isImageFrame(rectangle) {
  // Vérifie si le rectangle contient déjà une image
  if (rectangle.graphics.length > 0) return true;
  
  // Vérifie le label (ex: "image", "photo")
  if (rectangle.label.includes('image')) return true;
  
  // Vérifie le nom du calque
  if (rectangle.layer.name.includes('image')) return true;
  
  // Vérifie les dimensions (min 10x10)
  // Vérifie l'absence de remplissage
  // etc.
}
```

### 2. Service Backend d'Orchestration
**Fichier:** `backend/services/templateAnalyzer.js`

**Workflow:**
```
1. Récupère templates depuis Supabase
   ↓
2. Crée config.json avec liste des templates
   ↓
3. Exécute analyze_templates.jsx via osascript
   ↓
4. Parse results.json
   ↓
5. Enrichit chaque template avec l'IA
   ↓
6. Met à jour Supabase
```

**Fonctions principales:**
- `analyzeAllTemplates()` - Analyse tous les templates
- `analyzeOneTemplate(id)` - Analyse un template spécifique

### 3. Enrichissement IA
**Fichier:** `backend/services/openaiService.js`

**Fonction:** `enrichTemplateMetadata(templateData)`

**Analyse avec GPT-4o:**
```javascript
Input:
- Nombre d'images
- Placeholders texte
- Polices utilisées
- Couleurs
- Nombre de pages

Output:
- category: "Art & Culture" | "Tech" | "Business" | etc.
- style: "simple" | "moyen" | "complexe"
- recommended_for: ["Art & Culture", "Design", "Mode"]
- description: "Template moderne avec..."
```

**Logique IA:**
- Peu d'images + 1 page = "simple"
- Polices serif = style classique → "Art & Culture"
- Polices sans-serif = style moderne → "Tech"
- Beaucoup de placeholders = "complexe"

### 4. Routes API
**Fichier:** `backend/routes/templates.js`

**Nouvelles routes:**
```javascript
POST /api/templates/analyze
// Analyse tous les templates
// Retourne: { analyzed, updated, errors }

POST /api/templates/:id/analyze
// Analyse un template spécifique
// Retourne: { template }
```

### 5. Interface Admin
**Fichier:** `src/pages/admin/templates/index.jsx`

**URL:** `http://localhost:5173/admin/templates`

**Fonctionnalités:**
- ✅ Liste de tous les templates avec métadonnées
- ✅ Bouton "Analyser tous les templates"
- ✅ Bouton "Analyser" par template
- ✅ Affichage des métadonnées extraites
- ✅ Indicateurs visuels (images, catégorie, style, statut)
- ✅ Messages de succès/erreur
- ✅ Loader pendant l'analyse

**Design:**
- Cards avec preview des templates
- Grille de métadonnées (images, catégorie, style, statut)
- Tags pour placeholders et recommended_for
- Info box explicative du processus

---

## 📊 Métadonnées Extraites

### Structure Complète

```javascript
{
  // Extraction InDesign
  "image_slots": 3,
  "placeholders": ["TITRE", "SOUS-TITRE", "ARTICLE"],
  "fonts": ["Arial Bold", "Arial Regular"],
  "swatches": [
    { "name": "Primary Blue", "space": "RGB", "values": [0, 100, 200] }
  ],
  "metadata": {
    "author": "Designer Name",
    "description": "Template description",
    "keywords": ["magazine", "art"]
  },
  "pageCount": 2,
  "spreadCount": 1,
  "size": {
    "width": 210,
    "height": 297,
    "units": "Millimeters"
  },
  
  // Enrichissement IA
  "category": "Art & Culture",
  "style": "moyen",
  "recommended_for": ["Art & Culture", "Design", "Photographie"],
  "description": "Template élégant pour articles artistiques"
}
```

---

## 🚀 Utilisation

### 1. Accéder à l'Interface Admin

```bash
# Lancer le frontend
npm run dev

# Ouvrir dans le navigateur
http://localhost:5173/admin/templates
```

### 2. Analyser Tous les Templates

1. Cliquer sur **"Analyser tous les templates"**
2. InDesign s'ouvre automatiquement
3. Chaque template est ouvert et analysé
4. Les métadonnées sont mises à jour dans Supabase
5. Message de succès avec statistiques

**Durée estimée:** ~30 secondes par template

### 3. Analyser un Template Spécifique

1. Trouver le template dans la liste
2. Cliquer sur **"Analyser"** à droite
3. Le template est analysé individuellement
4. Métadonnées mises à jour instantanément

### 4. Via API (Programmatique)

```bash
# Analyser tous les templates
curl -X POST http://localhost:3001/api/templates/analyze

# Analyser un template spécifique
curl -X POST http://localhost:3001/api/templates/7e60dec2-2821-4e62-aa41-5759d6571233/analyze
```

---

## 📁 Fichiers Créés/Modifiés

### Nouveaux Fichiers

```
Indesign automation v1/
  scripts/
    analyze_templates.jsx              ← Script d'extraction InDesign
  analysis/                             ← Dossier pour résultats temporaires
    config.json                         ← Config générée automatiquement
    results.json                        ← Résultats de l'analyse

backend/
  services/
    templateAnalyzer.js                 ← Service d'orchestration

src/
  pages/
    admin/
      templates/
        index.jsx                       ← Interface admin
```

### Fichiers Modifiés

```
backend/
  services/
    openaiService.js                    ← +enrichTemplateMetadata()
  routes/
    templates.js                        ← +POST /analyze routes

src/
  services/
    api.js                              ← +analyzeAll(), analyzeOne()
  Routes.jsx                            ← +/admin/templates route
```

---

## 🔧 Configuration Requise

### Variables d'Environnement

```bash
# backend/.env
OPENAI_API_KEY=sk-...                   # Pour enrichissement IA
SUPABASE_URL=https://...                # Base de données
SUPABASE_ANON_KEY=...                   # Lecture
SUPABASE_SERVICE_ROLE_KEY=...           # Écriture (admin)
INDESIGN_APP_NAME="Adobe InDesign 2025" # Nom de l'app InDesign
```

### Prérequis Système

- ✅ macOS (pour osascript)
- ✅ Adobe InDesign installé et accessible
- ✅ Node.js 18+
- ✅ Accès Supabase configuré

---

## 🎨 Exemple de Résultat

### Avant l'Analyse

```sql
SELECT name, image_slots, category, style FROM indesign_templates;
```

| name | image_slots | category | style |
|------|-------------|----------|-------|
| Magazine Artistique Simple | NULL | NULL | NULL |

### Après l'Analyse

```sql
SELECT name, image_slots, category, style, recommended_for FROM indesign_templates;
```

| name | image_slots | category | style | recommended_for |
|------|-------------|----------|-------|-----------------|
| Magazine Artistique Simple | 3 | Art & Culture | simple | {Art & Culture, Design, Photographie} |

---

## 🐛 Gestion des Erreurs

### Erreurs Possibles

1. **InDesign non accessible**
   - Message: "Failed to analyze templates. Check InDesign is running"
   - Solution: Ouvrir InDesign manuellement

2. **Template introuvable**
   - Message: "Template file not found: /path/to/template.indt"
   - Solution: Vérifier les chemins dans Supabase

3. **Timeout**
   - Message: "Script execution timeout"
   - Solution: Augmenter le timeout (300s par défaut)

4. **OpenAI API Error**
   - Fallback automatique sur métadonnées basiques
   - Logs dans la console

### Logs

```bash
# Backend logs
[TemplateAnalyzer] Starting full analysis...
[TemplateAnalyzer] Found 3 templates
[TemplateAnalyzer] Executing InDesign script...
[TemplateAnalyzer] Parsed 3 results
[TemplateAnalyzer] Enriching template template-mag-simple-1808.indt...
[OpenAI] Enriched template: { category: 'Art & Culture', style: 'simple', ... }
[TemplateAnalyzer] ✓ Updated template template-mag-simple-1808.indt
[TemplateAnalyzer] Analysis complete: { analyzed: 3, updated: 3, errors: [] }
```

---

## 📈 Impact sur le Système

### Amélioration du Scoring

**Avant:**
```javascript
// Scoring basique avec métadonnées manuelles
if (template.image_slots === imageCount) {
  score += 30; // Mais image_slots était souvent faux
}
```

**Après:**
```javascript
// Scoring précis avec métadonnées réelles
if (template.image_slots === imageCount) {
  score += 30; // image_slots est maintenant exact
}
```

### Recommandations Plus Pertinentes

- ✅ Comptage d'images **exact** → Meilleur matching
- ✅ Catégories **cohérentes** → Meilleur ciblage
- ✅ Style **adapté** → Meilleure UX

---

## 🔄 Workflow Complet

```
┌─────────────────────────────────────────────────────────┐
│              ANALYSE AUTOMATIQUE COMPLÈTE                │
└─────────────────────────────────────────────────────────┘

1. ADMIN clique "Analyser tous les templates"
   ↓
2. Frontend POST /api/templates/analyze
   ↓
3. Backend récupère templates depuis Supabase
   ↓
4. Backend crée config.json
   {
     "templates": [
       { "id": "...", "filename": "...", "file_path": "..." }
     ],
     "output_path": "/path/to/results.json"
   }
   ↓
5. Backend exécute osascript → InDesign
   ↓
6. InDesign ouvre analyze_templates.jsx
   ↓
7. Script JSX lit config.json
   ↓
8. Pour chaque template:
   - Ouvre le fichier .indt/.indd
   - Compte les rectangles vides (images)
   - Extrait les {{PLACEHOLDERS}}
   - Récupère polices, couleurs, métadonnées
   - Ferme le fichier
   ↓
9. Script JSX écrit results.json
   {
     "generated_at": "2025-10-24T18:00:00Z",
     "templates": [
       {
         "id": "...",
         "filename": "...",
         "imageSlots": 3,
         "textPlaceholders": ["TITRE", "CHAPO"],
         "fonts": ["Arial Bold"],
         "swatches": [...],
         "metadata": {...},
         "pageCount": 2
       }
     ]
   }
   ↓
10. Backend parse results.json
    ↓
11. Pour chaque template:
    - Appelle enrichTemplateMetadata()
    - GPT-4o analyse les données
    - Retourne category, style, recommended_for, description
    ↓
12. Backend UPDATE Supabase
    SET image_slots = 3,
        placeholders = ['TITRE', 'CHAPO'],
        category = 'Art & Culture',
        style = 'simple',
        recommended_for = ['Art & Culture', 'Design'],
        description = '...'
    WHERE id = '...'
    ↓
13. Backend retourne résultats au Frontend
    {
      "analyzed": 3,
      "updated": 3,
      "errors": []
    }
    ↓
14. Frontend affiche message de succès
    ✅ "Analyse terminée ! 3 templates analysés, 3 mis à jour."
    ↓
15. Frontend recharge la liste des templates
    → Métadonnées mises à jour visibles immédiatement
```

---

## 🎉 Résultat Final

### Interface Admin

```
┌─────────────────────────────────────────────────────────┐
│  Gestion des Templates                    [← Retour]    │
│  Analysez et enrichissez automatiquement les métadonnées│
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ✅ Analyse terminée ! 3 templates analysés, 3 mis à jour│
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Analyse Automatique                                │ │
│  │ Extrait les métadonnées depuis InDesign et enrichit│ │
│  │                    [⚡ Analyser tous les templates] │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Templates (3)                                      │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ [Preview] Magazine Artistique Simple  [Analyser]  │ │
│  │           Template simple et élégant               │ │
│  │           template-mag-simple-1808.indt            │ │
│  │                                                    │ │
│  │  Images: 3  Catégorie: Art & Culture              │ │
│  │  Style: simple  Statut: Actif                     │ │
│  │                                                    │ │
│  │  Placeholders: TITRE  SOUS-TITRE  ARTICLE         │ │
│  │  Recommandé pour: Art & Culture  Design  Photo    │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 Prochaines Améliorations

### Court Terme
- [ ] Analyse incrémentale (seulement les templates modifiés)
- [ ] Cache des résultats (éviter re-analyse)
- [ ] Webhook pour analyse automatique après upload

### Moyen Terme
- [ ] Extraction des zones de texte (positions, tailles)
- [ ] Analyse de la hiérarchie typographique
- [ ] Détection du style graphique (minimaliste, maximaliste, etc.)

### Long Terme
- [ ] ML pour prédire les templates les plus utilisés
- [ ] Génération automatique de previews
- [ ] Suggestions d'amélioration des templates

---

**Créé par:** Dev 1 (Cascade)  
**Date:** 2025-10-24 18:15  
**Tag Git:** v1.0.3-sprint-1.3-start  
**Status:** ✅ Implémenté et fonctionnel
