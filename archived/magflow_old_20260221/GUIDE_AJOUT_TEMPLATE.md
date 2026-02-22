# 📚 Guide d'ajout d'un nouveau template InDesign

> **Date:** 25 Octobre 2025  
> **Version:** 1.0  
> **Testé avec:** Template 251025.indt

## 🎯 Vue d'ensemble

Ce guide explique comment ajouter un nouveau template InDesign à Magflow avec extraction automatique des métadonnées et intégration complète.

---

## 📋 Prérequis

- ✅ InDesign installé (Adobe InDesign 2025)
- ✅ Backend Node.js configuré (`backend/.env`)
- ✅ Accès Supabase configuré
- ✅ OpenAI API Key configurée (`OPENAI_API_KEY`)

---

## 🚀 Procédure complète

### Étape 1: Copier le fichier template

Copier le fichier `.indt` ou `.indd` dans le dossier des templates:

```bash
cp "/chemin/vers/votre/template.indt" \
   "/Users/alexandreerrasti/Documents/magflow/Indesign automation v1/indesign_templates/"
```

**Exemple:**
```bash
cp "/Users/alexandreerrasti/Library/Mobile Documents/com~apple~CloudDocs/Indesign automation/indesign_templates/Template 251025.indt" \
   "/Users/alexandreerrasti/Documents/magflow/Indesign automation v1/indesign_templates/"
```

---

### Étape 2: Ajouter dans Supabase

Utiliser le script d'ajout automatique:

```bash
node backend/scripts/add-template.js \
  "nom-du-fichier.indt" \
  "Nom d'affichage du template"
```

**Exemple:**
```bash
node backend/scripts/add-template.js \
  "Template 251025.indt" \
  "Magazine Complet - Octobre 2025"
```

**📤 Ce script va:**
- ✅ Générer un UUID unique
- ✅ Créer l'entrée dans la table `indesign_templates`
- ✅ Définir le chemin complet du fichier
- ✅ Définir des métadonnées par défaut
- ✅ Retourner l'UUID du template créé

**📝 Notez l'UUID retourné** pour l'étape suivante !

---

### Étape 3: Analyser le template

Lancer l'analyse automatique avec l'UUID obtenu:

```bash
node backend/scripts/analyze-one-template.js <UUID>
```

**Exemple:**
```bash
node backend/scripts/analyze-one-template.js 30050538-7b3b-4147-b587-cd9e39f1e7ce
```

**🔍 Cette étape va:**
- ✅ Ouvrir InDesign automatiquement
- ✅ Analyser le template (images, placeholders, fonts, couleurs)
- ✅ Enrichir les métadonnées via GPT-4o:
  - Catégorie (Mode, Art & Culture, Tech, Business, Lifestyle)
  - Style (simple, moyen, complexe)
  - Recommandations d'usage
  - Description attractive
- ✅ Mettre à jour Supabase avec toutes les métadonnées

**⏱️ Durée:** 1-2 minutes par template

---

### Étape 4: Ajouter le mapping Flask

Éditer `/Indesign automation v1/app.py` et ajouter le template dans `TEMPLATE_MAPPING`:

```python
TEMPLATE_MAPPING = {
    # ... templates existants ...
    
    # ✅ UUIDs Supabase (production)
    '7e60dec2-2821-4e62-aa41-5759d6571233': 'template-mag-simple-1808.indt',
    '986c5391-a5b6-4370-9f10-34aeefb084ba': 'template-mag-simple-2-1808.indt',
    'e443ce87-3915-4c79-bdbc-5e7bbdc75ade': 'Magazine art template page 1.indd',
    '<VOTRE-UUID>': 'nom-du-fichier.indt',  # ← AJOUTER ICI
}
```

**Exemple:**
```python
'30050538-7b3b-4147-b587-cd9e39f1e7ce': 'Template 251025.indt',  # Magazine Complet - Octobre 2025
```

---

### Étape 5: Vérifier l'intégration

Lister tous les templates pour vérifier:

```bash
node backend/scripts/list-templates.js
```

**✅ Vérifications:**
- Template visible dans la liste
- UUID correct
- Métadonnées complètes (catégorie, style, images, placeholders)
- Statut `Actif: ✅`

---

## 🧪 Test de génération

1. **Démarrer les services:**
```bash
# Terminal 1 - Backend Node
cd backend && npm run dev

# Terminal 2 - Flask
cd "Indesign automation v1" && python3 app.py

# Terminal 3 - Frontend
npm run dev
```

2. **Tester via l'interface:**
   - Ouvrir http://localhost:5173/dashboard
   - Coller un article
   - Vérifier que le nouveau template apparaît
   - Générer un magazine avec ce template

3. **Vérifier le résultat:**
   - Le fichier `.indd` est créé
   - Le contenu est correctement placé
   - Le téléchargement fonctionne

---

## 📊 Métadonnées extraites automatiquement

L'analyse automatique extrait et enrichit:

### Extraction InDesign (JSX)
- ✅ **Images:** Comptage des rectangles vides (`image_slots`)
- ✅ **Placeholders:** Extraction des `{{TEXTE}}` (`placeholders`)
- ✅ **Polices:** Liste complète des fonts utilisées
- ✅ **Couleurs:** Nuances CMYK/RGB du template
- ✅ **Métadonnées:** Author, title, keywords du fichier
- ✅ **Dimensions:** Taille du document (inches/points)

### Enrichissement IA (GPT-4o)
- ✅ **Category:** Art & Culture, Mode, Tech, Business, Lifestyle
- ✅ **Style:** simple, moyen, complexe
- ✅ **recommended_for:** Liste de cas d'usage
- ✅ **Description:** Texte marketing attractif

---

## 🛠️ Scripts utilitaires

### `add-template.js`
Ajoute un nouveau template dans Supabase.
```bash
node backend/scripts/add-template.js <filename> <display_name>
```

### `analyze-one-template.js`
Analyse un template spécifique via InDesign + IA.
```bash
node backend/scripts/analyze-one-template.js <uuid>
```

### `list-templates.js`
Liste tous les templates avec leurs métadonnées.
```bash
node backend/scripts/list-templates.js
```

---

## 🔧 Dépannage

### ❌ Erreur "Supabase n'est pas configuré"
- Vérifier `backend/.env` contient `SUPABASE_URL` et `SUPABASE_ANON_KEY`
- Le script charge automatiquement le `.env` du dossier `backend/`

### ❌ Erreur "OPENAI_API_KEY manquante"
- Vérifier `backend/.env` contient `OPENAI_API_KEY=sk-...`
- Relancer le script d'analyse

### ❌ InDesign ne s'ouvre pas
- Vérifier le nom de l'application dans `.env`:
  ```
  INDESIGN_APP_NAME=Adobe InDesign 2025
  ```
- Vérifier qu'InDesign est installé et accessible

### ❌ Template non visible dans l'interface
- Vérifier le mapping Flask (`app.py`)
- Redémarrer Flask: `cd "Indesign automation v1" && python3 app.py`
- Vider le cache du navigateur

### ⚠️ Templates avec Lorem Ipsum (pas de {{PLACEHOLDERS}})

Si votre template utilise du texte Lorem Ipsum au lieu de placeholders `{{TEXTE}}`:

1. **Inspecter le template:**
   ```bash
   # Modifier le chemin dans le script
   node backend/scripts/inspect-template.js
   ```

2. **Noter les longueurs de texte** (en caractères)

3. **Deux options:**

   **Option A: Ajout automatique de placeholders** (peut nécessiter correction manuelle)
   ```bash
   node backend/scripts/add-placeholders.js
   ```
   
   **Option B: Modification manuelle dans InDesign**
   - Ouvrir le template dans InDesign
   - Remplacer les textes Lorem Ipsum par:
     - `{{CHAPO}}` pour le texte court
     - `{{ARTICLE}}` pour le texte long
     - `{{TITRE}}` pour le titre
   - Sauvegarder le template

4. **Mettre à jour les métadonnées:**
   ```bash
   # Éditer le script avec les bonnes valeurs
   node backend/scripts/update-template-metadata.js
   ```

5. **Documenter les limites de caractères** dans la description Supabase

📖 **Voir:** `CORRECTION_TEMPLATE_251025.md` pour un exemple complet

---

## 📁 Fichiers impliqués

```
magflow/
├── Indesign automation v1/
│   ├── app.py                           # ← TEMPLATE_MAPPING
│   ├── indesign_templates/
│   │   └── <votre-template.indt>        # ← Fichier template
│   └── scripts/
│       └── analyze_templates.jsx        # Script InDesign
│
└── backend/
    ├── scripts/
    │   ├── add-template.js              # ← Ajout Supabase
    │   ├── analyze-one-template.js      # ← Analyse IA
    │   └── list-templates.js            # ← Vérification
    │
    └── services/
        ├── templateAnalyzer.js          # Orchestration analyse
        └── openaiService.js             # Enrichissement IA
```

---

## ✅ Checklist complète

- [ ] Fichier `.indt` copié dans `indesign_templates/`
- [ ] Template ajouté dans Supabase (script `add-template.js`)
- [ ] UUID du template noté
- [ ] Analyse automatique lancée (script `analyze-one-template.js`)
- [ ] Métadonnées vérifiées (script `list-templates.js`)
- [ ] Mapping Flask mis à jour (`app.py`)
- [ ] Test de génération réussi
- [ ] Template visible dans l'interface

---

## 🎉 Résultat

Après ces étapes, votre nouveau template est:
- ✅ Disponible dans l'interface utilisateur
- ✅ Correctement catégorisé et décrit
- ✅ Prêt pour la génération de magazines
- ✅ Intégré au système de recommandation

---

## 📝 Exemple complet

```bash
# 1. Copier le template
cp "/chemin/source/Template 251025.indt" \
   "Indesign automation v1/indesign_templates/"

# 2. Ajouter dans Supabase
node backend/scripts/add-template.js \
  "Template 251025.indt" \
  "Magazine Complet - Octobre 2025"
# → UUID: 30050538-7b3b-4147-b587-cd9e39f1e7ce

# 3. Analyser
node backend/scripts/analyze-one-template.js \
  30050538-7b3b-4147-b587-cd9e39f1e7ce
# → Métadonnées: Catégorie "Mode", Style "simple", 1 image

# 4. Vérifier
node backend/scripts/list-templates.js
# → 4 templates dont le nouveau

# 5. Éditer app.py manuellement
# Ajouter la ligne dans TEMPLATE_MAPPING

# 6. Tester
cd backend && npm run dev  # Terminal 1
cd "Indesign automation v1" && python3 app.py  # Terminal 2
npm run dev  # Terminal 3
# → http://localhost:5173/dashboard
```

---

**🎯 Temps total:** ~5 minutes (hors temps d'analyse InDesign)

**🔄 Dernière mise à jour:** 25 Octobre 2025
