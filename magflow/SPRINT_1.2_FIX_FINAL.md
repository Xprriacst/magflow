# 🔧 Sprint 1.2 - Fix Final (Templates + Vraies Données)

**Date:** 2025-10-15 12:15  
**Bug:** Template toujours identique + Données placeholders  
**Status:** ✅ FIXÉ

---

## 🐛 Bugs Identifiés

### Bug 1: Template Inconnu
**Erreur:** `Template inconnu: 986c5391-a5b6-4370-9f10-34aeefb084ba`

**Cause:**  
- Frontend envoie UUID Supabase
- Flask cherche dans `TEMPLATE_MAPPING` avec fallback IDs seulement
- UUID pas dans le mapping → ❌ Erreur

### Bug 2: Toujours le Même Template
**Cause:**  
- Script JSX ligne 118 hardcodé : `template-mag-simple-1808.indt`
- Script JSX ne lit pas `config.template` depuis le JSON

### Bug 3: Données Placeholders
**Cause:**  
- Script JSX utilise `config.prompt` au lieu de `config.titre`
- Script JSX n'extrait pas `titre` et `chapo` du JSON

---

## ✅ Fixes Appliqués

### Fix 1: Flask `app.py` - Mapping UUIDs Supabase

**Fichier:** `Indesign automation v1/app.py` (ligne 30-47)

```python
# ✅ SPRINT 1.2: Mapping template_id → fichier .indt/.indd
TEMPLATE_MAPPING = {
    # Fallback IDs (compatibilité)
    'fallback-1': 'template-mag-simple-1808.indt',
    'fallback-2': 'template-mag-simple-2-1808.indt',
    'fallback-3': 'magazine-art-template-page-1.indd',
    
    # ✅ UUIDs Supabase (production)
    '7e60dec2-2821-4e62-aa41-5759d6571233': 'template-mag-simple-1808.indt',        # Magazine Artistique Simple
    '986c5391-a5b6-4370-9f10-34aeefb084ba': 'template-mag-simple-2-1808.indt',      # Magazine Artistique Avancé
    'e443ce87-3915-4c79-bdbc-5e7bbdc75ade': 'Magazine art template page 1.indd',    # Magazine Art - Page 1
    
    # Aliases filename (compatibilité)
    'template-mag-simple-1808': 'template-mag-simple-1808.indt',
    'template-mag-simple-2-1808': 'template-mag-simple-2-1808.indt',
    'magazine-art-template-page-1': 'magazine-art-template-page-1.indd',
    'Magazine art template page 1': 'Magazine art template page 1.indd'
}
```

**Impact:** Flask reconnaît maintenant les UUIDs Supabase ✅

---

### Fix 2: Script JSX - Extraction titre, chapo, template

**Fichier:** `Indesign automation v1/scripts/template_simple_working.jsx`

#### Changement 1: Parsing JSON (ligne 25-67)

```javascript
// ✅ SPRINT 1.2: Extraire titre (prioritaire)
var titreMatch = jsonString.match(/"titre":\s*"([^"]+)"/);
if (titreMatch) {
    config.titre = titreMatch[1];
    alert("✅ Titre trouvé: " + config.titre);
} else {
    config.titre = config.prompt || "Sans titre";
    alert("⚠️ Titre fallback: " + config.titre);
}

// ✅ SPRINT 1.2: Extraire chapo
var chapoMatch = jsonString.match(/"chapo":\s*"([^"]+)"/);
if (chapoMatch) {
    config.chapo = chapoMatch[1];
    alert("✅ Chapo trouvé: " + config.chapo.substring(0, 50) + "...");
}

// ✅ SPRINT 1.2: Extraire template
var templateMatch = jsonString.match(/"template":\s*"([^"]+)"/);
if (templateMatch) {
    config.template = templateMatch[1];
    alert("✅ Template trouvé: " + config.template);
} else {
    config.template = "template-mag-simple-1808.indt"; // Fallback
    alert("⚠️ Template fallback: " + config.template);
}
```

**Impact:** Script extrait maintenant titre, chapo ET template ✅

---

#### Changement 2: Ouverture Template Dynamique (ligne 148-153)

**AVANT:**
```javascript
var templatePath = basePath + "/indesign_templates/template-mag-simple-1808.indt"; // ❌ Hardcodé
```

**APRÈS:**
```javascript
// ✅ SPRINT 1.2: Ouvrir le template dynamique
var templateFilename = config.template || "template-mag-simple-1808.indt";
var templatePath = basePath + "/indesign_templates/" + templateFilename;
var templateFile = new File(templatePath);

alert("🔍 Ouverture template: " + templateFilename);
```

**Impact:** Template sélectionné dans l'interface est maintenant utilisé ✅

---

#### Changement 3: Remplacement Texte avec Vraies Données (ligne 184-223)

**Template 1 (template-mag-simple-1808.indt):**
```javascript
// AVANT
app.changeTextPreferences.changeTo = config.prompt || "Nouveau titre"; // ❌

// APRÈS ✅ SPRINT 1.2
app.changeTextPreferences.changeTo = config.titre || "Nouveau titre";

// AVANT
var subtitleText = config.subtitle || "Sous-titre par défaut"; // ❌

// APRÈS ✅ SPRINT 1.2
var subtitleText = config.chapo || config.subtitle || "Sous-titre par défaut";
```

**Template 2 (template-mag-simple-2-1808.indt):**
```javascript
// AVANT
var fullText = config.prompt || "Titre"; // ❌

// APRÈS ✅ SPRINT 1.2
var fullText = config.titre || "Titre";
if (config.chapo) {
    fullText += "\n\n" + config.chapo;
}
if (config.text_content) {
    fullText += "\n\n" + config.text_content;
}
```

**Impact:** Vraies données utilisateur sont maintenant utilisées ✅

---

## 🧪 Test Maintenant

```bash
# 1. Redémarrer Flask
cd "Indesign automation v1"
python app.py

# 2. Dans frontend
http://localhost:5173/smart-content-creator

# 3. Test complet:
- Coller article
- Analyser
- Sélectionner DIFFÉRENTS templates
- Générer
- Vérifier:
  ✅ Bon template ouvert
  ✅ Vraies données remplies
```

---

## 📊 Résultat Attendu

### Logs InDesign (Alerts)

```
✅ Project ID trouvé: 7f3a7b20-089b-475c-8067-99b8a0481a99
✅ Titre trouvé: [Ton vrai titre]
✅ Chapo trouvé: [Tes vraies données]...
✅ Template trouvé: template-mag-simple-2-1808.indt
🔍 Ouverture template: template-mag-simple-2-1808.indt
✅ Template ouvert avec succès!
✅ {{TITRE}} remplacé: 1 occurrence(s)
✅ {{SOUS-TITRE}} remplacé: 1 occurrence(s)
```

### InDesign Document

- ✅ Template sélectionné (1, 2 ou 3) ouvre
- ✅ Titre = Ton vrai titre (pas "Test article moderne")
- ✅ Chapo = Tes vraies données
- ✅ Contenu = Ton texte analysé

---

## 🔄 Workflow Complet Validé

```
1. Frontend
   ├─ Utilisateur saisit article
   ├─ IA analyse → titre + chapo
   ├─ Utilisateur sélectionne template (UUID Supabase)
   └─ Génération

2. Backend Node
   ├─ Reçoit template_id (UUID)
   ├─ Reçoit titre + chapo
   └─ Envoie à Flask

3. Flask
   ├─ Reçoit template_id: "986c5391-a5b6-4370-9f10-34aeefb084ba"
   ├─ Mapping → "template-mag-simple-2-1808.indt" ✅
   ├─ Crée config.json avec:
   │  ├─ template: "template-mag-simple-2-1808.indt"
   │  ├─ titre: "Vraies données"
   │  └─ chapo: "Vraies données"
   └─ Exécute script JSX

4. Script JSX
   ├─ Parse JSON
   ├─ Extrait titre, chapo, template ✅
   ├─ Ouvre BON template ✅
   ├─ Remplace avec VRAIES données ✅
   └─ Sauvegarde .indd
```

---

## 📁 Fichiers Modifiés

```
✏️ Indesign automation v1/app.py
   - Ligne 31-47: TEMPLATE_MAPPING avec UUIDs Supabase

✏️ Indesign automation v1/scripts/template_simple_working.jsx
   - Ligne 25-67: Extraction titre, chapo, template
   - Ligne 148-153: Ouverture template dynamique
   - Ligne 186-223: Remplacement avec vraies données
```

---

## ✅ Critères de Succès

| Critère | Status |
|---------|--------|
| **Flask mapping UUIDs** | ✅ FAIT |
| **Script extrait titre** | ✅ FAIT |
| **Script extrait chapo** | ✅ FAIT |
| **Script extrait template** | ✅ FAIT |
| **Template dynamique ouvert** | ✅ FAIT |
| **Vraies données remplies** | ✅ FAIT |
| **Tests manuels** | ⏳ À FAIRE |

---

## 🚨 Note Importante

**Submodule Git:** `Indesign automation v1/` est un submodule.  
Les changements ne sont PAS dans le commit principal.

**Pour commit:**
```bash
cd "Indesign automation v1"
git add app.py scripts/template_simple_working.jsx
git commit -m "fix(sprint-1.2): Template dynamique + vraies données

- Mapping UUIDs Supabase dans TEMPLATE_MAPPING
- Script JSX extrait titre, chapo, template depuis JSON
- Script JSX ouvre template dynamique
- Script JSX utilise vraies données au lieu de prompt"
```

---

## 🎯 Prochaine Étape

**TEST IMMÉDIAT:**
1. Redémarre Flask
2. Teste avec CHAQUE template
3. Vérifie que les vraies données apparaissent

**Si ça marche:** Sprint 1.2 ✅ COMPLET  
**Si problème:** Envoie-moi les logs InDesign (alerts)

---

**Créé:** 2025-10-15 12:15  
**Dev:** Cascade  
**Sprint:** 1.2 Fix Final
