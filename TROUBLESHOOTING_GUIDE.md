# 🔧 Guide de Dépannage - API InDesign

Guide complet pour résoudre les problèmes courants lors de l'implémentation d'une automatisation InDesign.

---

## 🎯 Méthodologie de Debug

### 1. Isoler le problème

```
Interface → n8n → Flask → ExtendScript → InDesign
    ↓        ↓       ↓          ↓           ↓
  Test 1   Test 2  Test 3    Test 4      Test 5
```

**Tester chaque composant isolément :**
1. Interface/Webhook envoie-t-il les bonnes données ?
2. n8n transforme-t-il correctement ?
3. Flask reçoit-il et traite-t-il ?
4. ExtendScript s'exécute-t-il ?
5. InDesign génère-t-il le document ?

### 2. Activer les logs partout

```javascript
// ExtendScript
var log = new File("/path/to/debug.log");
log.open("a");
log.writeln("[" + new Date() + "] Checkpoint: " + message);
log.close();
```

```python
# Flask
import logging
logging.basicConfig(filename='api.log', level=logging.DEBUG)
logging.debug(f"Checkpoint: {data}")
```

### 3. Utiliser les alertes temporaires

```javascript
// ExtendScript - Alertes pour debug
alert("🔍 Config: " + JSON.stringify(config));
alert("📊 Rectangles: " + doc.pages[0].rectangles.length);
alert("🖼️ Images: " + config.images.length);
```

---

## 🚨 Problèmes Fréquents

### Problème #1 : Template ne s'ouvre pas

**Symptômes :**
- Erreur "Cannot open file"
- Script s'arrête immédiatement
- Aucun document InDesign créé

**Causes possibles :**

#### A. Chemin incorrect

```javascript
// ❌ MAUVAIS - Chemin relatif
var templateFile = new File("templates/template.indt");

// ✅ BON - Chemin absolu
var templateFile = new File("/Users/nom/projet/templates/template.indt");
```

**Solution :**
```javascript
// Vérifier le chemin
var templateFile = new File("/chemin/absolu/template.indt");
alert("Existe ? " + templateFile.exists);
alert("Taille : " + templateFile.length + " bytes");
```

#### B. Fichier corrompu

**Test :**
1. Ouvrir le template manuellement dans InDesign
2. Si ça échoue → fichier corrompu

**Solution :**
1. Créer un nouveau template
2. Sauvegarder en `.indt`
3. Tester à nouveau

#### C. Permissions insuffisantes

**Test :**
```bash
# Vérifier les permissions
ls -la /path/to/template.indt

# Devrait afficher : -rw-r--r--
```

**Solution :**
```bash
chmod 644 /path/to/template.indt
```

---

### Problème #2 : Placeholders ne se remplacent pas

**Symptômes :**
- `{{TITRE}}` reste affiché dans le document
- Texte par défaut non remplacé
- Script se termine sans erreur

**Diagnostic :**

```javascript
// Ajouter avant le remplacement
alert("Avant remplacement - Recherche: " + app.findTextPreferences.findWhat);

// Compter les occurrences
app.findTextPreferences.findWhat = "{{TITRE}}";
var found = doc.findText();
alert("Occurrences trouvées: " + found.length);

// Si 0 occurrence → placeholder n'existe pas dans le template
```

**Causes possibles :**

#### A. Placeholder différent dans le template

**Test :**
```javascript
// Lister tout le texte du document
for (var i = 0; i < doc.pages[0].textFrames.length; i++) {
    var frame = doc.pages[0].textFrames[i];
    alert("Cadre " + i + ": " + frame.contents.substring(0, 100));
}
```

**Solution :**
- Identifier le vrai placeholder
- Corriger le script

#### B. Préférences Find/Replace non réinitialisées

```javascript
// ❌ MAUVAIS
app.findTextPreferences.findWhat = "{{TITRE}}";
app.changeTextPreferences.changeTo = "Nouveau";
doc.changeText();
// Suivant ne marchera pas car préférences encore actives !

// ✅ BON
app.findTextPreferences = NothingEnum.NOTHING;
app.changeTextPreferences = NothingEnum.NOTHING;
app.findTextPreferences.findWhat = "{{TITRE}}";
app.changeTextPreferences.changeTo = "Nouveau";
doc.changeText();
app.findTextPreferences = NothingEnum.NOTHING;
app.changeTextPreferences = NothingEnum.NOTHING;
```

#### C. Caractères spéciaux

```javascript
// Si le placeholder contient des caractères spéciaux
// Il faut les échapper dans la recherche

// ❌ Échouera si () [] {} dans le texte
app.findTextPreferences.findWhat = "{{TITRE(1)}}";

// ✅ Solution : regex ou chercher texte exact
app.findTextPreferences.findWhat = "{{TITRE\\(1\\)}}";
```

---

### Problème #3 : Images ne se placent pas

**Symptômes :**
- Rectangles restent vides
- Erreur "Image not found"
- Script continue sans placer d'image

**Diagnostic :**

```javascript
// Vérifier l'image
var imageFile = new File(imagePath);
alert("Image existe ? " + imageFile.exists);
alert("Chemin: " + imagePath);

// Vérifier les rectangles
alert("Rectangles dispo: " + doc.pages[0].rectangles.length);

// Test de placement
try {
    doc.pages[0].rectangles[0].place(imageFile);
    alert("✅ Placement réussi");
} catch (e) {
    alert("❌ Erreur: " + e.toString());
}
```

**Causes possibles :**

#### A. Chemin image incorrect

```javascript
// ❌ MAUVAIS - Chemin relatif ou Windows sur macOS
var imgPath = "uploads\\image.jpg";  // Windows
var imgPath = "image.jpg";           // Relatif

// ✅ BON - Chemin absolu macOS
var imgPath = "/Users/nom/projet/uploads/image.jpg";
```

**Solution Flask :**
```python
# Toujours utiliser chemins absolus
images = [os.path.abspath(img) for img in uploaded_images]
```

#### B. Index rectangle invalide

```javascript
// Si config.rectangle_index = 2 mais seulement 2 rectangles (0,1)
var rectIndex = config.rectangle_index || 0;

// ✅ Valider l'index
if (rectIndex < doc.pages[0].rectangles.length) {
    doc.pages[0].rectangles[rectIndex].place(imageFile);
} else {
    alert("⚠️ Rectangle " + rectIndex + " n'existe pas");
}
```

#### C. Format image non supporté

**Formats supportés :**
- JPG, PNG, GIF, TIFF, PSD, PDF, AI

**Test :**
```bash
# Vérifier le format
file /path/to/image.jpg

# Si corrupted ou wrong format → reconvertir
convert image.png image.jpg
```

---

### Problème #4 : JSON parsing échoue

**Symptômes :**
- Config vide ou undefined
- Script s'arrête avec "undefined property"
- Valeurs null partout

**Cause :**
ExtendScript ES3 n'a pas de `JSON.parse()` fiable.

**Solution - Parser manuel :**

```javascript
function parseConfig(jsonString) {
    var config = {};
    
    // Debug: afficher le JSON brut
    var logFile = new File("/path/debug.log");
    logFile.open("w");
    logFile.write(jsonString);
    logFile.close();
    
    // Parser chaque champ
    try {
        // String simple
        var match = jsonString.match(/"project_id":\s*"([^"]+)"/);
        config.project_id = match ? match[1] : null;
        
        // String avec caractères spéciaux (échapper \n, \t, etc)
        var textMatch = jsonString.match(/"text_content":\s*"((?:[^"\\]|\\.)*)"/);
        if (textMatch) {
            config.text_content = textMatch[1]
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\"/g, '"');
        }
        
        // Array de strings
        config.images = [];
        var arrayMatch = jsonString.match(/"images":\s*\[(.*?)\]/);
        if (arrayMatch) {
            var items = arrayMatch[1].match(/"([^"]+)"/g);
            if (items) {
                for (var i = 0; i < items.length; i++) {
                    config.images.push(items[i].replace(/"/g, ''));
                }
            }
        }
        
        // Number
        var numMatch = jsonString.match(/"rectangle_index":\s*(\d+)/);
        config.rectangle_index = numMatch ? parseInt(numMatch[1]) : 0;
        
        return config;
        
    } catch (e) {
        alert("Erreur parsing: " + e.toString());
        return null;
    }
}
```

**Test du parser :**

```javascript
// Créer un JSON de test
var testJSON = '{"project_id":"test-123","text_content":"Hello\\nWorld","images":["/path/img1.jpg","/path/img2.jpg"],"rectangle_index":1}';

var parsed = parseConfig(testJSON);
alert("Project: " + parsed.project_id);
alert("Text: " + parsed.text_content);
alert("Images: " + parsed.images.length);
alert("Index: " + parsed.rectangle_index);
```

---

### Problème #5 : Flask ne lance pas InDesign

**Symptômes :**
- Requête Flask réussit mais rien ne se passe
- InDesign ne s'ouvre pas
- Timeout après 5 minutes

**Diagnostic :**

```python
# Ajouter logs détaillés
def execute_indesign_script(project_id):
    logging.debug("Début exécution InDesign")
    
    script_path = os.path.abspath('scripts/automation.jsx')
    logging.debug(f"Script path: {script_path}")
    
    if not os.path.exists(script_path):
        logging.error(f"Script non trouvé: {script_path}")
        return {'success': False, 'error': 'Script non trouvé'}
    
    # ... reste du code
```

**Causes possibles :**

#### A. Nom de l'application incorrect

```python
# ❌ MAUVAIS
INDESIGN_APP = "InDesign"
INDESIGN_APP = "Adobe InDesign"

# ✅ BON - Nom exact
INDESIGN_APP = "Adobe InDesign 2025"
```

**Trouver le bon nom :**
```bash
# Lister les applications Adobe
ls -la /Applications | grep Adobe

# Nom exact pour AppleScript
osascript -e 'tell application "System Events" to get name of every process whose name contains "InDesign"'
```

#### B. AppleScript mal formé

```python
# ✅ Template AppleScript correct
applescript = f'''
tell application "{INDESIGN_APP}"
    activate
    do script (file POSIX file "{script_path}") language javascript
end tell
'''

# ⚠️ Attention aux guillemets !
# Utiliser f''' ''' pour éviter les problèmes d'échappement
```

**Tester AppleScript isolément :**
```bash
# Créer un fichier test
cat > test.applescript << 'EOF'
tell application "Adobe InDesign 2025"
    activate
    display dialog "Test réussi!"
end tell
EOF

# Exécuter
osascript test.applescript
```

#### C. InDesign pas installé ou version différente

```bash
# Vérifier installation
ls -la "/Applications/Adobe InDesign 2025"

# Si version différente
ls -la /Applications | grep "InDesign"

# Ajuster le nom dans .env
INDESIGN_APP_NAME="Adobe InDesign 2024"  # ou la version installée
```

---

### Problème #6 : Config.json vide ou mal formé

**Symptômes :**
- Script ExtendScript reçoit des données vides
- Parsing réussit mais valeurs null
- Document généré mais vide

**Diagnostic :**

```python
# Flask - Vérifier config avant écriture
config = {
    'project_id': project_id,
    'prompt': prompt,
    'text_content': text_content,
    'images': uploaded_images
}

# Debug
print("=== CONFIG ===")
print(json.dumps(config, indent=2, ensure_ascii=False))

# Écrire avec encoding UTF-8
with open(config_path, 'w', encoding='utf-8') as f:
    json.dump(config, f, ensure_ascii=False, indent=2)
```

**Vérifier le fichier généré :**
```bash
# Afficher le config.json
cat uploads/<project_id>/config.json | jq .

# Vérifier l'encodage
file uploads/<project_id>/config.json

# Devrait afficher: UTF-8 Unicode text
```

**Problèmes courants :**

#### A. Caractères spéciaux

```python
# ❌ Peut causer des problèmes
text = "L'article avec des «guillemets» et\ndes sauts"

# ✅ Solution - JSON encode automatiquement
config = {'text': text}  # JSON.dump gère les échappements

# Ou nettoyer manuellement
text_clean = text.replace('\r\n', '\n').replace('\r', '\n')
```

#### B. Chemins non absolus

```python
# ❌ MAUVAIS
images = ['uploads/image1.jpg', 'uploads/image2.jpg']

# ✅ BON
images = [os.path.abspath(img) for img in relative_images]

# Vérifier
for img in images:
    assert os.path.isabs(img), f"Chemin non absolu: {img}"
    assert os.path.exists(img), f"Fichier non trouvé: {img}"
```

---

### Problème #7 : Timeout lors de l'exécution

**Symptômes :**
- Erreur "TimeoutExpired" après 5 minutes
- Flask renvoie une erreur 500
- Document non généré

**Causes :**

#### A. Template trop complexe

**Solution :**
- Simplifier le template
- Réduire le nombre d'éléments
- Optimiser les images

#### B. Script trop lent

**Optimisations :**

```javascript
// ❌ LENT - Chercher dans tout le document
app.findTextPreferences.findWhat = "{{TITRE}}";
doc.changeText();

// ✅ RAPIDE - Chercher dans un cadre spécifique
var frame = doc.pages[0].textFrames[0];
app.findTextPreferences.findWhat = "{{TITRE}}";
app.changeTextPreferences.changeTo = "Nouveau";
frame.changeText();
```

```javascript
// ❌ LENT - Placer images haute résolution
rectangle.place(imageFile);

// ✅ RAPIDE - Placer puis ajuster
rectangle.place(imageFile);
rectangle.fit(FitOptions.CONTENT_TO_FRAME);  // Plus rapide
```

#### C. Timeout trop court

```python
# Augmenter le timeout
result = subprocess.run(
    ['osascript', temp_path],
    capture_output=True,
    text=True,
    timeout=600  # 10 minutes au lieu de 5
)
```

---

### Problème #8 : Document corrompu ou vide

**Symptômes :**
- .indd généré mais ne s'ouvre pas
- Taille du fichier 0 bytes
- Erreur "Document damaged"

**Causes possibles :**

#### A. Document non sauvegardé correctement

```javascript
// ❌ MAUVAIS
doc.save(outputFile);
// Si erreur → document corrompu

// ✅ BON - Try-catch
try {
    var outputFile = new File("/path/output.indd");
    doc.save(outputFile);
    doc.close(SaveOptions.YES);
    alert("✅ Sauvegarde réussie");
} catch (e) {
    alert("❌ Erreur sauvegarde: " + e.toString());
    doc.close(SaveOptions.NO);  // Fermer sans sauvegarder
}
```

#### B. Chemin de sortie incorrect

```javascript
// Vérifier le dossier de sortie
var outputFolder = new Folder("/path/output");
if (!outputFolder.exists) {
    outputFolder.create();
}

// Chemin complet avec extension
var outputPath = outputFolder + "/" + config.project_id + ".indd";
var outputFile = new File(outputPath);

alert("Sauvegarde vers: " + outputPath);
```

#### C. Template modifié pendant l'exécution

**Solution :**
- Ne jamais sauvegarder le template original
- Toujours "Enregistrer sous" avec nouveau nom

---

## 🔍 Outils de Diagnostic

### Script de test ExtendScript

```javascript
#target indesign

// Test complet des fonctionnalités
function runDiagnostics() {
    var results = [];
    
    // Test 1: Ouvrir template
    try {
        var templateFile = new File("/path/template.indt");
        if (!templateFile.exists) {
            results.push("❌ Template non trouvé");
        } else {
            var doc = app.open(templateFile);
            results.push("✅ Template ouvert");
            
            // Test 2: Compter éléments
            results.push("📊 Pages: " + doc.pages.length);
            results.push("📊 TextFrames: " + doc.pages[0].textFrames.length);
            results.push("📊 Rectangles: " + doc.pages[0].rectangles.length);
            
            // Test 3: Find & Replace
            app.findTextPreferences.findWhat = "{{TITRE}}";
            var found = doc.findText();
            results.push("🔍 '{{TITRE}}' trouvé: " + found.length + " fois");
            
            // Test 4: Lister le contenu
            for (var i = 0; i < doc.pages[0].textFrames.length; i++) {
                var content = doc.pages[0].textFrames[i].contents;
                results.push("📝 Frame " + i + ": " + content.substring(0, 50));
            }
            
            doc.close(SaveOptions.NO);
        }
    } catch (e) {
        results.push("❌ Erreur: " + e.toString());
    }
    
    // Afficher résultats
    alert(results.join("\n"));
    
    // Écrire dans log
    var logFile = new File("/path/diagnostics.log");
    logFile.open("w");
    logFile.write(results.join("\n"));
    logFile.close();
}

runDiagnostics();
```

### Script de test Flask

```python
#!/usr/bin/env python3
"""Test Flask API"""

import requests
import sys

BASE_URL = "http://localhost:5003"

def test_status():
    """Test endpoint status"""
    try:
        r = requests.get(f"{BASE_URL}/api/status")
        assert r.status_code == 200
        print("✅ Status OK")
        return True
    except Exception as e:
        print(f"❌ Status: {e}")
        return False

def test_templates():
    """Test templates endpoint"""
    try:
        r = requests.get(f"{BASE_URL}/api/templates")
        templates = r.json()
        print(f"✅ Templates: {len(templates)}")
        return True
    except Exception as e:
        print(f"❌ Templates: {e}")
        return False

def test_create():
    """Test create layout"""
    try:
        data = {
            'prompt': 'Test titre',
            'text_content': 'Test contenu',
            'subtitle': 'Test sous-titre'
        }
        r = requests.post(f"{BASE_URL}/api/create-layout", data=data)
        result = r.json()
        
        if result.get('success'):
            print(f"✅ Create: {result.get('project_id')}")
            return True
        else:
            print(f"❌ Create: {result.get('error')}")
            return False
    except Exception as e:
        print(f"❌ Create: {e}")
        return False

if __name__ == '__main__':
    print("🧪 Tests Flask API\n")
    
    tests = [
        ("Status", test_status),
        ("Templates", test_templates),
        ("Create", test_create)
    ]
    
    passed = 0
    for name, func in tests:
        if func():
            passed += 1
    
    print(f"\n📊 Résultat: {passed}/{len(tests)} tests réussis")
    sys.exit(0 if passed == len(tests) else 1)
```

---

## 📊 Checklist de Dépannage

Avant de demander de l'aide, vérifier :

### Environnement

- [ ] InDesign installé et version correcte
- [ ] Python 3.8+ avec Flask installé
- [ ] Tous les dossiers créés (uploads, output, templates, scripts)
- [ ] Variables d'environnement configurées (.env)
- [ ] Permissions correctes sur les fichiers

### Chemins

- [ ] Tous les chemins sont absolus (pas relatifs)
- [ ] Template existe et s'ouvre manuellement
- [ ] Script JSX existe et bon nom
- [ ] Config.json créé et valide

### Code

- [ ] Try-catch partout dans JSX
- [ ] Logs activés (Flask + ExtendScript)
- [ ] Préférences Find/Replace réinitialisées
- [ ] Validation des données entrantes
- [ ] Timeout suffisant (300s+)

### Tests

- [ ] Template s'ouvre manuellement
- [ ] Script JSX fonctionne isolément
- [ ] Flask répond à /api/status
- [ ] Config.json bien formé
- [ ] Images accessibles

---

## 🆘 Démarche Systématique

**Si ça ne marche toujours pas :**

1. **Simplifier au maximum**
   - Template minimal (1 cadre texte, pas d'image)
   - Script minimal (juste ouvrir/fermer)
   - Flask minimal (juste créer config)

2. **Tester individuellement**
   - Template seul → OK ?
   - Script seul → OK ?
   - Flask seul → OK ?
   - Ensemble → KO ? → Identifier l'interface qui échoue

3. **Ajouter logs partout**
   - Alert à chaque étape du JSX
   - Print à chaque étape de Flask
   - Identifier où ça bloque exactement

4. **Comparer avec exemple fonctionnel**
   - Utiliser templates fournis
   - Comparer ligne par ligne
   - Identifier la différence

5. **Chercher dans les logs**
   ```bash
   # Logs système InDesign (macOS)
   tail -f ~/Library/Logs/Adobe/InDesign/*/indesign.log
   
   # Logs application
   tail -f api.log
   tail -f automation.log
   ```

---

**Avec ce guide, 95% des problèmes devraient être résolus. Pour les 5% restants : vérifier que le café est assez fort ! ☕**
