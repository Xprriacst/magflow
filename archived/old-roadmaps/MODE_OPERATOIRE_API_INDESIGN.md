# 📘 Mode Opératoire : API InDesign pour Automatisation

## 🎯 Vue d'ensemble

Ce guide explique comment implémenter une automatisation InDesign basée sur l'architecture Magazinator, qui permet de générer des mises en page automatiquement via une API.

### Architecture globale

```
┌─────────────┐      ┌──────────┐      ┌──────────┐      ┌──────────────┐
│  Interface  │─────>│  Flask   │─────>│   n8n    │─────>│  InDesign    │
│    Web      │      │   API    │      │ Workflow │      │ ExtendScript │
└─────────────┘      └──────────┘      └──────────┘      └──────────────┘
                           │                  │                   │
                           v                  v                   v
                     ┌──────────┐      ┌──────────┐      ┌──────────┐
                     │ OpenAI   │      │  Webhook │      │ Template │
                     │ Analysis │      │          │      │   .indt  │
                     └──────────┘      └──────────┘      └──────────┘
```

---

## 📚 Partie 1 : Comprendre l'API InDesign (ExtendScript)

### 1.1 Qu'est-ce que ExtendScript ?

**ExtendScript** est le langage de scripting d'Adobe, basé sur JavaScript ES3, qui permet d'automatiser InDesign.

**Caractéristiques clés :**
- Syntaxe JavaScript (mais ES3, pas ES6+)
- Pas de `JSON.parse()` natif fiable → parsing manuel requis
- Accès direct au DOM d'InDesign (documents, pages, éléments)
- Exécution via AppleScript sur macOS ou COM sur Windows

### 1.2 Structure d'un script ExtendScript

```javascript
#target indesign  // Cible InDesign

function main() {
    // 1. Ouvrir un document/template
    var doc = app.open(new File(templatePath));
    
    // 2. Manipuler le contenu
    // - Remplacer du texte
    // - Placer des images
    // - Modifier le style
    
    // 3. Sauvegarder
    doc.save(new File(outputPath));
    doc.close();
}

main();
```

### 1.3 API InDesign essentielle

#### **Ouvrir un fichier**
```javascript
var file = new File("/path/to/template.indt");
var doc = app.open(file);
```

#### **Remplacer du texte (Find & Replace)**
```javascript
// Réinitialiser les préférences
app.findTextPreferences = NothingEnum.NOTHING;
app.changeTextPreferences = NothingEnum.NOTHING;

// Définir la recherche
app.findTextPreferences.findWhat = "{{PLACEHOLDER}}";
app.changeTextPreferences.changeTo = "Nouveau texte";

// Exécuter le remplacement
var found = doc.changeText();
alert("Remplacé : " + found.length + " occurrence(s)");
```

#### **Placer une image dans un rectangle**
```javascript
// Récupérer le premier rectangle de la première page
var rectangle = doc.pages[0].rectangles[0];

// Placer l'image
var imageFile = new File("/path/to/image.jpg");
rectangle.place(imageFile);

// Ajuster l'image au cadre
rectangle.fit(FitOptions.CONTENT_TO_FRAME);
rectangle.fit(FitOptions.CENTER_CONTENT);
```

#### **Sauvegarder le document**
```javascript
var outputFile = new File("/path/to/output.indd");
doc.save(outputFile);
doc.close();
```

### 1.4 Parsing JSON sans JSON.parse()

ExtendScript n'a pas de parser JSON fiable. Solution : regex manuel.

```javascript
function parseSimpleJSON(jsonString) {
    var config = {};
    
    // Extraire une valeur string
    var match = jsonString.match(/"key_name":\s*"([^"]+)"/);
    if (match) {
        config.key_name = match[1];
    }
    
    // Extraire un nombre
    var numMatch = jsonString.match(/"age":\s*(\d+)/);
    if (numMatch) {
        config.age = parseInt(numMatch[1]);
    }
    
    // Extraire un tableau de chemins
    config.images = [];
    var imageMatches = jsonString.match(/"\/[^"]+\.(jpg|png)"/gi);
    if (imageMatches) {
        for (var i = 0; i < imageMatches.length; i++) {
            var path = imageMatches[i].substring(1, imageMatches[i].length - 1);
            config.images.push(path);
        }
    }
    
    return config;
}
```

### 1.5 Gestion des erreurs et debugging

```javascript
try {
    // Code principal
    var doc = app.open(file);
    alert("✅ Document ouvert");
    
} catch (error) {
    // Afficher l'erreur
    alert("❌ Erreur: " + error.toString());
    
    // Logger dans un fichier
    var logFile = new File("/path/to/debug.log");
    logFile.open("a");
    logFile.writeln("Erreur: " + error.toString());
    logFile.close();
}
```

---

## 📦 Partie 2 : Architecture Flask (Backend API)

### 2.1 Structure de l'API Flask

```
app.py
├── Routes principales
│   ├── POST /api/create-layout         → Upload fichiers
│   ├── POST /api/create-layout-urls    → URLs d'images
│   ├── GET  /api/templates             → Liste templates
│   └── GET  /api/download/<id>         → Télécharger résultat
│
├── Logique métier
│   ├── analyze_prompt_with_ai()        → Analyse OpenAI
│   ├── execute_indesign_script()       → Lance InDesign
│   └── _download_images()              → Télécharge images
│
└── Configuration
    ├── uploads/         → Images uploadées
    ├── output/          → Fichiers .indd générés
    └── indesign_templates/ → Templates .indt
```

### 2.2 Endpoint principal : `/api/create-layout-urls`

**Rôle :** Recevoir les données, préparer la config, lancer InDesign.

```python
@app.route('/api/create-layout-urls', methods=['POST'])
def create_layout_urls():
    # 1. Récupérer les données
    prompt = request.form.get('prompt')
    text_content = request.form.get('text_content')
    image_urls = _parse_image_urls_from_request(request)
    
    # 2. Créer un projet unique
    project_id = str(uuid.uuid4())
    project_folder = os.path.join('uploads', project_id)
    os.makedirs(project_folder, exist_ok=True)
    
    # 3. Télécharger les images
    downloaded_images = _download_images(image_urls, project_folder)
    
    # 4. Analyser avec OpenAI (optionnel)
    layout_instructions = analyze_prompt_with_ai(prompt, text_content, len(downloaded_images))
    
    # 5. Écrire config.json pour InDesign
    config = {
        'project_id': project_id,
        'prompt': prompt,
        'text_content': text_content,
        'images': [os.path.abspath(img) for img in downloaded_images],
        'template': request.form.get('template', 'default')
    }
    
    config_path = os.path.join(project_folder, 'config.json')
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    # 6. Exécuter le script InDesign
    result = execute_indesign_script(project_id, config_path)
    
    return jsonify(result)
```

### 2.3 Exécuter InDesign depuis Python

**Sur macOS :**

```python
def execute_indesign_script(project_id, config_path):
    script_path = os.path.abspath('scripts/template_simple_working.jsx')
    
    # Créer un AppleScript temporaire
    applescript = f'''
tell application "Adobe InDesign 2025"
    activate
    do script (file POSIX file "{script_path}") language javascript
end tell
'''
    
    # Écrire dans un fichier temporaire
    with tempfile.NamedTemporaryFile(mode='w', suffix='.applescript', delete=False) as f:
        f.write(applescript)
        temp_path = f.name
    
    try:
        # Exécuter osascript
        result = subprocess.run(
            ['osascript', temp_path],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            return {'success': True, 'output_file': f'output/{project_id}.indd'}
        else:
            return {'success': False, 'error': result.stderr}
    finally:
        os.unlink(temp_path)
```

**Sur Windows :**

```python
def execute_indesign_script_windows(script_path):
    import win32com.client
    
    # Créer une instance COM InDesign
    indesign = win32com.client.Dispatch("InDesign.Application")
    
    # Exécuter le script
    indesign.DoScript(File=script_path, Language=1246973031)  # JavaScript
```

### 2.4 Télécharger des images depuis URLs

```python
def _download_images(urls, dest_folder):
    downloaded = []
    os.makedirs(dest_folder, exist_ok=True)
    
    for i, url in enumerate(urls):
        try:
            response = requests.get(url, stream=True, timeout=20)
            response.raise_for_status()
            
            # Déterminer l'extension
            content_type = response.headers.get('Content-Type', '')
            ext_map = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/gif': 'gif'
            }
            ext = ext_map.get(content_type, 'jpg')
            
            # Sauvegarder
            filename = f"image_{i+1}.{ext}"
            filepath = os.path.join(dest_folder, filename)
            
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            downloaded.append(filepath)
        except Exception as e:
            print(f"Erreur téléchargement {url}: {e}")
    
    return downloaded
```

---

## 🔗 Partie 3 : Intégration n8n (Workflow)

### 3.1 Pourquoi n8n ?

- **Webhook** : Interface entre utilisateur et Flask
- **OpenAI** : Analyse intelligente du contenu
- **Transformation** : Préparation des données
- **Orchestration** : Gestion du flux de travail

### 3.2 Structure du workflow n8n

```
1. Webhook (Trigger)
   ├── Reçoit : images URLs, contenu, template
   └── Valide les données
   
2. OpenAI (AI Analysis)
   ├── Analyse le contenu
   ├── Extrait les sections (titre, encadrés, article)
   └── Génère un JSON structuré
   
3. Fusion & Préparation
   ├── Merge données webhook + AI
   ├── Ajoute des fallbacks
   └── Prépare la requête Flask
   
4. HTTP Request → Flask
   ├── POST http://127.0.0.1:5003/api/create-layout-urls
   ├── Body: form-data
   └── Attend la réponse (document généré)
```

### 3.3 Configuration Webhook n8n

**URL webhook :** `http://localhost:5678/webhook/indesign-webhook`

**Corps de requête attendu :**
```json
{
  "images": ["https://url1.jpg", "https://url2.jpg"],
  "contenu": "Texte complet de l'article...",
  "template": "Magazine art template page 1.indt"
}
```

### 3.4 Nœud OpenAI avec prompt adaptatif

```javascript
// Prompt OpenAI conditionnel selon le template
{% if 'template 2' in ($json.template || '') %}
  // Template 2 : titre + 3 encadrés
  {
    "title": "Titre (max 12 caractères)",
    "article_principal": "Contenu principal",
    "encadre_1": "Premier encadré",
    "encadre_2": "Deuxième encadré",
    "encadre_3": "Troisième encadré"
  }
{% else %}
  // Template 1 : titre + sous-titre + article + lettrine
  {
    "title": "Titre principal",
    "category": "Catégorie",
    "subtitle": "Sous-titre",
    "article_principal": "Article complet",
    "lettrine_texte": "Première phrase avec lettrine"
  }
{% endif %}
```

### 3.5 Nœud de fusion avec fallbacks

```javascript
{
  "prompt": "{{ $json.validation.titre }}",
  "text_content": "{{ $json.aiAnalysis.article_principal || $json.validation.contenu }}",
  "subtitle": "{{ $json.aiAnalysis.subtitle || 'Sous-titre généré' }}",
  "template": "{{ $json.validation.template }}",
  "image_urls": {{ JSON.stringify($json.validation.images) }}
}
```

---

## 🚀 Partie 4 : Implémentation dans un nouveau projet

### 4.1 Checklist préalable

- [ ] **InDesign installé** (version 2020+)
- [ ] **Python 3.8+** avec Flask
- [ ] **n8n** (Docker ou local)
- [ ] **OpenAI API Key** (optionnel)
- [ ] **Templates InDesign** (.indt) avec placeholders

### 4.2 Étapes d'implémentation

#### **Étape 1 : Créer les templates InDesign**

1. Ouvrir InDesign
2. Créer une mise en page
3. Insérer des **placeholders texte** : `{{TITRE}}`, `{{ARTICLE}}`, etc.
4. Créer des **rectangles vides** pour les images
5. Sauvegarder en `.indt` (Template InDesign)

**💡 Conseil :** Utiliser des placeholders uniques et cohérents.

#### **Étape 2 : Créer le script ExtendScript**

```javascript
#target indesign

function parseConfig(jsonString) {
    // Parser les données JSON
    var config = {};
    var match = jsonString.match(/"project_id":\s*"([^"]+)"/);
    config.project_id = match ? match[1] : null;
    
    // Ajouter d'autres champs
    return config;
}

function main() {
    try {
        // 1. Trouver le dernier projet
        var uploadsFolder = new Folder("/CHEMIN_ABSOLU/uploads");
        var latestProject = findLatestProject(uploadsFolder);
        
        // 2. Lire config.json
        var configFile = new File(latestProject + "/config.json");
        configFile.open("r");
        var configData = configFile.read();
        configFile.close();
        
        var config = parseConfig(configData);
        
        // 3. Ouvrir le template
        var templateFile = new File("/CHEMIN_ABSOLU/templates/mon_template.indt");
        var doc = app.open(templateFile);
        
        // 4. Remplacer le texte
        app.findTextPreferences.findWhat = "{{TITRE}}";
        app.changeTextPreferences.changeTo = config.prompt;
        doc.changeText();
        
        // 5. Placer les images
        if (config.images && config.images.length > 0) {
            var img = new File(config.images[0]);
            doc.pages[0].rectangles[0].place(img);
        }
        
        // 6. Sauvegarder
        var outputFile = new File("/CHEMIN_ABSOLU/output/" + config.project_id + ".indd");
        doc.save(outputFile);
        doc.close();
        
        return true;
    } catch (e) {
        alert("Erreur : " + e.toString());
        return false;
    }
}

function findLatestProject(folder) {
    var projects = folder.getFiles();
    var latest = null;
    var latestTime = 0;
    
    for (var i = 0; i < projects.length; i++) {
        if (projects[i] instanceof Folder) {
            var configFile = new File(projects[i] + "/config.json");
            if (configFile.exists) {
                var time = configFile.modified.getTime();
                if (time > latestTime) {
                    latestTime = time;
                    latest = projects[i];
                }
            }
        }
    }
    
    return latest;
}

main();
```

#### **Étape 3 : Créer l'API Flask**

```python
from flask import Flask, request, jsonify
import os
import json
import subprocess
import uuid
import tempfile

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['OUTPUT_FOLDER'] = 'output'

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

@app.route('/api/create-layout', methods=['POST'])
def create_layout():
    # Récupérer les données
    prompt = request.form.get('prompt')
    text_content = request.form.get('text_content')
    
    # Créer un projet
    project_id = str(uuid.uuid4())
    project_folder = os.path.join(app.config['UPLOAD_FOLDER'], project_id)
    os.makedirs(project_folder)
    
    # Sauvegarder les images
    images = []
    if 'images' in request.files:
        for file in request.files.getlist('images'):
            filepath = os.path.join(project_folder, file.filename)
            file.save(filepath)
            images.append(os.path.abspath(filepath))
    
    # Écrire config.json
    config = {
        'project_id': project_id,
        'prompt': prompt,
        'text_content': text_content,
        'images': images
    }
    
    config_path = os.path.join(project_folder, 'config.json')
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    # Exécuter InDesign
    result = execute_indesign_script()
    
    return jsonify(result)

def execute_indesign_script():
    script_path = os.path.abspath('scripts/automation.jsx')
    
    applescript = f'''
tell application "Adobe InDesign 2025"
    do script (file POSIX file "{script_path}") language javascript
end tell
'''
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.applescript', delete=False) as f:
        f.write(applescript)
        temp_path = f.name
    
    try:
        result = subprocess.run(['osascript', temp_path], 
                              capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            return {'success': True}
        else:
            return {'success': False, 'error': result.stderr}
    finally:
        os.unlink(temp_path)

if __name__ == '__main__':
    app.run(debug=True, port=5003)
```

#### **Étape 4 : Configurer n8n (optionnel)**

1. **Installer n8n** :
   ```bash
   docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
   ```

2. **Créer un workflow** :
   - Webhook Trigger
   - OpenAI (optionnel)
   - HTTP Request → Flask

3. **Tester** :
   ```bash
   curl -X POST http://localhost:5678/webhook/test \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Test", "images": ["https://via.placeholder.com/400"]}'
   ```

#### **Étape 5 : Script de démarrage**

```bash
#!/bin/bash
# start_all.sh

echo "🚀 Démarrage de l'application..."

# Lancer Flask
python3 app.py &
FLASK_PID=$!

echo "✅ Flask démarré (PID: $FLASK_PID)"

# Lancer n8n (si Docker)
docker start n8n 2>/dev/null || docker run -d --name n8n -p 5678:5678 n8nio/n8n

echo "✅ n8n démarré"

# Attendre que Flask soit prêt
sleep 3

# Ouvrir l'interface
open http://127.0.0.1:5003

echo "🎉 Application prête!"
```

---

## 🛠️ Partie 5 : Debugging et bonnes pratiques

### 5.1 Debugging ExtendScript

```javascript
// Écrire dans un fichier log
var logFile = new File("/path/to/debug.log");
logFile.open("a");
logFile.writeln("[" + new Date() + "] Message de debug");
logFile.close();

// Afficher des alertes temporaires
alert("✅ Étape réussie : " + variable);

// Try-catch systématique
try {
    // Code risqué
} catch (e) {
    alert("❌ Erreur : " + e.toString() + "\nLigne : " + e.line);
}
```

### 5.2 Vérifier qu'InDesign reçoit les données

```javascript
// Au début du script
alert("🔍 Config reçue :\n" + 
      "Project: " + config.project_id + "\n" +
      "Images: " + config.images.length);
```

### 5.3 Vérifier les placeholders

```javascript
// Lister tous les cadres de texte
for (var i = 0; i < doc.pages[0].textFrames.length; i++) {
    var frame = doc.pages[0].textFrames[i];
    alert("Cadre " + i + " : " + frame.contents.substring(0, 50));
}
```

### 5.4 Tester le workflow étape par étape

1. **Flask seul** : Test avec curl
   ```bash
   curl -X POST http://localhost:5003/api/create-layout \
     -F "prompt=Test" \
     -F "images=@image.jpg"
   ```

2. **Script InDesign seul** : Double-cliquer sur le .jsx

3. **n8n → Flask** : Vérifier les logs Flask

4. **Bout en bout** : Interface → n8n → Flask → InDesign

### 5.5 Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Cannot open file` | Chemin relatif | Utiliser `os.path.abspath()` |
| `JSON.parse is not defined` | ExtendScript ES3 | Parser manuellement avec regex |
| `Template not found` | Chemin incorrect | Vérifier avec `alert(templatePath)` |
| `Rectangle undefined` | Index invalide | Vérifier `rectangles.length` |
| `Timeout expired` | Script trop long | Augmenter le timeout (300s+) |

---

## 📋 Partie 6 : Checklist de déploiement

### Configuration minimale

- [ ] **Chemins absolus** partout (pas de chemins relatifs)
- [ ] **Gestion d'erreurs** dans chaque fonction
- [ ] **Logs** pour le debugging
- [ ] **Timeout** approprié (300s minimum)
- [ ] **Validation** des données entrantes
- [ ] **Fallbacks** pour l'analyse IA

### Sécurité

- [ ] **API Token** pour Flask (`Authorization: Bearer <token>`)
- [ ] **Validation** des extensions de fichiers
- [ ] **Limite** de taille de fichier (50MB)
- [ ] **Nettoyage** des fichiers temporaires
- [ ] **Variables d'environnement** (.env) pour les secrets

### Performance

- [ ] **Compression** des images avant placement
- [ ] **Cache** des templates
- [ ] **Nettoyage** régulier des uploads
- [ ] **Timeout** adapté à la complexité
- [ ] **Monitoring** des erreurs

---

## 🎓 Ressources complémentaires

### Documentation officielle

- [InDesign ExtendScript Toolkit](https://www.adobe.com/devnet/indesign/sdk.html)
- [ExtendScript API Reference](https://extendscript.docsforadobe.dev/)
- [n8n Documentation](https://docs.n8n.io/)
- [Flask Documentation](https://flask.palletsprojects.com/)

### Outils utiles

- **ExtendScript Toolkit** : IDE Adobe pour tester les scripts
- **Postman** : Tester les endpoints Flask
- **n8n Desktop** : Version locale de n8n

### Exemples de code

```javascript
// Exemple : Créer un cadre de texte
var page = doc.pages[0];
var textFrame = page.textFrames.add();
textFrame.geometricBounds = [10, 10, 100, 200]; // [y1, x1, y2, x2]
textFrame.contents = "Mon texte";

// Exemple : Styliser du texte
textFrame.paragraphs[0].pointSize = 24;
textFrame.paragraphs[0].appliedFont = "Arial";
```

---

## 🎯 Conclusion

**Points clés à retenir :**

1. **ExtendScript** est limité (ES3) → parsing manuel requis
2. **Chemins absolus** sont essentiels pour InDesign
3. **Flask** orchestre tout le workflow
4. **n8n** ajoute l'intelligence (OpenAI) et la flexibilité
5. **Debugging** via logs et alertes est crucial

**Workflow type :**
```
User → n8n Webhook → OpenAI → Flask API → ExtendScript → InDesign → Document .indd
```

Ce mode opératoire est reproductible pour tout projet nécessitant l'automatisation d'InDesign avec des données dynamiques.

---

**Version :** 1.0  
**Date :** 2025-09-30  
**Auteur :** Basé sur le projet Magazinator
