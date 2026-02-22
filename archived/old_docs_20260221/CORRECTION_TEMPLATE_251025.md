# 🔧 Correction Template 251025_2_PH

**Date:** 25 Octobre 2025  
**Template:** Template 251025_2_PH.indt  
**UUID:** 30050538-7b3b-4147-b587-cd9e39f1e7ce

---

## ⚠️ Problème identifié

Le script automatique a remplacé les deux blocs de texte par `{{CHAPO}}` au lieu de différencier `{{CHAPO}}` et `{{ARTICLE}}`.

### État actuel du template

```
FRAME #0 (59 caractères originaux, pas de lettrine)
  → Contient: {{CHAPO}} ✅ CORRECT

FRAME #1 (533 caractères originaux, avec lettrine M)
  → Contient: {{CHAPO}} ❌ INCORRECT
  → Devrait contenir: {{ARTICLE}}
```

---

## 🛠️ Correction manuelle dans InDesign

### Étape 1: Ouvrir le template

```bash
# Chemin du template
/Users/alexandreerrasti/Documents/magflow/Indesign automation v1/indesign_templates/Template 251025_2_PH.indt
```

1. Ouvrir **Adobe InDesign 2025**
2. **Fichier > Ouvrir**
3. Sélectionner `Template 251025_2_PH.indt`

---

### Étape 2: Identifier les text frames

Le template contient 10 text frames. Chercher ceux qui contiennent `{{CHAPO}}`:

1. **Outil Texte** (T)
2. Cliquer dans chaque frame de texte
3. Identifier:
   - **FRAME avec lettrine M** → Doit contenir `{{ARTICLE}}`
   - **FRAME sans lettrine** → Doit contenir `{{CHAPO}}`

---

### Étape 3: Corriger le texte

**Pour le frame AVEC lettrine (533 caractères originaux):**

1. Sélectionner tout le texte `{{CHAPO}}`
2. Le remplacer par `{{ARTICLE}}`
3. Vérifier que la lettrine est toujours active:
   - Sélectionner le paragraphe
   - **Paragraphe > Lettrines et styles imbriqués**
   - Vérifier: **Lignes de lettrine: 3** (ou autre valeur)
   - **Nombre de caractères: 1**

---

### Étape 4: Vérifier les deux placeholders

Après correction, le template doit contenir:

```
✅ {{CHAPO}}    - 1 occurrence (bloc court, pas de lettrine)
✅ {{ARTICLE}}  - 1 occurrence (bloc long, avec lettrine M)
```

**Vérification rapide:**
- **Édition > Rechercher/Remplacer** (Cmd+F)
- Chercher: `{{CHAPO}}`
- Résultat attendu: **1 occurrence**
- Chercher: `{{ARTICLE}}`
- Résultat attendu: **1 occurrence**

---

### Étape 5: Sauvegarder

1. **Fichier > Enregistrer** (Cmd+S)
2. Confirmer l'écrasement du template existant
3. Fermer InDesign

---

## 📊 Métadonnées des placeholders

### {{CHAPO}}
- **Type:** Texte court d'introduction
- **Longueur recommandée:** 59 caractères
- **Plage acceptée:** 47-71 caractères
- **Lettrine:** Non
- **Frame original:** #0

### {{ARTICLE}}
- **Type:** Article principal
- **Longueur recommandée:** 533 caractères
- **Plage acceptée:** 426-640 caractères
- **Lettrine:** Oui (M majuscule, 3 lignes)
- **Frame original:** #1

---

## ✅ Vérification finale

Après correction, exécuter:

```bash
# 1. Inspecter le template corrigé
node backend/scripts/inspect-template.js

# 2. Vérifier que le résultat montre:
#    - FRAME avec "{{CHAPO}}" (pas de lettrine)
#    - FRAME avec "{{ARTICLE}}" (avec lettrine)
```

---

## 🧪 Test de génération

Après correction, tester la génération:

```bash
# 1. Démarrer les services
cd backend && npm run dev                        # Terminal 1
cd "Indesign automation v1" && python3 app.py    # Terminal 2
npm run dev                                      # Terminal 3

# 2. Tester via l'interface
# http://localhost:5173/dashboard
# - Coller un article
# - Sélectionner "Magazine Complet - Octobre 2025"
# - Générer
```

**Vérifications:**
- Le chapo (59 caractères) remplace bien `{{CHAPO}}`
- L'article (533 caractères) remplace bien `{{ARTICLE}}`
- La lettrine M est préservée sur l'article

---

## 📝 Notes techniques

### Pourquoi le script a échoué?

Le script `add_placeholders_to_template.jsx` utilisait `indexOf()` pour chercher:
- `'Ut enim ad minim veniam'` → trouvé dans FRAME #0 ✅
- `'Minim veniam'` → trouvé dans FRAME #1 ✅

Mais les deux ont été remplacés par `{{CHAPO}}` au lieu de `{{CHAPO}}` et `{{ARTICLE}}` respectivement.

### Solution temporaire

Correction manuelle dans InDesign (ce guide).

### Solution permanente

Créer un script JSX plus robuste qui:
1. Identifie d'abord TOUS les text frames
2. Détecte les lettrines
3. Applique les règles de remplacement en fonction du contexte
4. Génère un rapport de validation

---

## 🎯 Résultat attendu

Après cette correction, le template `Template 251025_2_PH.indt` sera:

✅ Prêt pour la génération automatique  
✅ Compatible avec le workflow Magflow  
✅ Avec limites de caractères documentées  
✅ Avec placeholder {{ARTICLE}} contenant la lettrine

---

**Temps estimé:** 5 minutes  
**Difficulté:** Facile  
**Prérequis:** InDesign installé
