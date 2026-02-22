# 🔧 Templates Réutilisables - API InDesign

Ce document contient des templates de code prêts à l'emploi pour démarrer rapidement un nouveau projet d'automatisation InDesign.

---

## 📝 Template 1 : Script ExtendScript Minimal

### Fichier : `minimal_automation.jsx`

```javascript
#target indesign

// ============================================
// CONFIGURATION
// ============================================
var CONFIG = {
    // ⚠️ MODIFIER AVEC VOS CHEMINS ABSOLUS
    BASE_PATH: "/Users/VOTRE_NOM/mon_projet_indesign",
    TEMPLATE_NAME: "mon_template.indt",
    INDESIGN_APP: "Adobe InDesign 2025"
};

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function log(message) {
    var logFile = new File(CONFIG.BASE_PATH + "/automation.log");
    logFile.open("a");
    logFile.writeln("[" + new Date().toISOString() + "] " + message);
    logFile.close();
}

function parseJSON(jsonString) {
    var config = {};
    
    // Extraire les champs texte
    var fields = ["project_id", "prompt", "text_content", "subtitle"];
    for (var i = 0; i < fields.length; i++) {
        var regex = new RegExp('"' + fields[i] + '":\\s*"([^"]*)"');
        var match = jsonString.match(regex);
        if (match) {
            config[fields[i]] = match[1];
        }
    }
    
    // Extraire les chemins d'images
    config.images = [];
    var imageRegex = /"(\/[^"]+\.(jpg|jpeg|png|gif|tiff|psd))"/gi;
    var imageMatches = jsonString.match(imageRegex);
    if (imageMatches) {
        for (var j = 0; j < imageMatches.length; j++) {
            var path = imageMatches[j].replace(/"/g, '');
            config.images.push(path);
        }
    }
    
    return config;
}

function findLatestProject() {
    var uploadsFolder = new Folder(CONFIG.BASE_PATH + "/uploads");
    if (!uploadsFolder.exists) {
        throw new Error("Dossier uploads introuvable");
    }
    
    var projects = uploadsFolder.getFiles();
    var latest = null;
    var latestTime = 0;
    
    for (var i = 0; i < projects.length; i++) {
        if (projects[i] instanceof Folder) {
            var configFile = new File(projects[i] + "/config.json");
            if (configFile.exists) {
                var modTime = configFile.modified.getTime();
                if (modTime > latestTime) {
                    latestTime = modTime;
                    latest = projects[i];
                }
            }
        }
    }
    
    return latest;
}

function replaceText(doc, placeholder, newText) {
    app.findTextPreferences = NothingEnum.NOTHING;
    app.changeTextPreferences = NothingEnum.NOTHING;
    
    app.findTextPreferences.findWhat = placeholder;
    app.changeTextPreferences.changeTo = newText || "";
    
    var found = doc.changeText();
    log("Remplacé '" + placeholder + "' : " + found.length + " occurrence(s)");
    
    app.findTextPreferences = NothingEnum.NOTHING;
    app.changeTextPreferences = NothingEnum.NOTHING;
}

function placeImage(doc, imagePath, rectangleIndex) {
    if (!imagePath) return;
    
    var imageFile = new File(imagePath);
    if (!imageFile.exists) {
        log("Image non trouvée : " + imagePath);
        return;
    }
    
    var rectangles = doc.pages[0].rectangles;
    if (rectangleIndex >= rectangles.length) {
        log("Rectangle " + rectangleIndex + " n'existe pas");
        return;
    }
    
    var rectangle = rectangles[rectangleIndex];
    rectangle.place(imageFile);
    rectangle.fit(FitOptions.CONTENT_TO_FRAME);
    rectangle.fit(FitOptions.CENTER_CONTENT);
    
    log("Image placée dans rectangle " + rectangleIndex);
}

// ============================================
// FONCTION PRINCIPALE
// ============================================

function main() {
    try {
        log("=== DÉBUT SCRIPT ===");
        
        // 1. Trouver le dernier projet
        var projectFolder = findLatestProject();
        if (!projectFolder) {
            throw new Error("Aucun projet trouvé");
        }
        log("Projet : " + projectFolder.name);
        
        // 2. Lire config.json
        var configFile = new File(projectFolder + "/config.json");
        configFile.open("r");
        var configData = configFile.read();
        configFile.close();
        
        var config = parseJSON(configData);
        log("Config parsée : " + config.project_id);
        
        // 3. Ouvrir le template
        var templatePath = CONFIG.BASE_PATH + "/templates/" + CONFIG.TEMPLATE_NAME;
        var templateFile = new File(templatePath);
        
        if (!templateFile.exists) {
            throw new Error("Template non trouvé : " + templatePath);
        }
        
        var doc = app.open(templateFile);
        log("Template ouvert : " + CONFIG.TEMPLATE_NAME);
        
        // 4. Remplacer les placeholders
        replaceText(doc, "{{TITRE}}", config.prompt);
        replaceText(doc, "{{SOUS_TITRE}}", config.subtitle);
        replaceText(doc, "{{ARTICLE}}", config.text_content);
        
        // 5. Placer les images
        if (config.images && config.images.length > 0) {
            for (var i = 0; i < config.images.length; i++) {
                placeImage(doc, config.images[i], i);
            }
        }
        
        // 6. Sauvegarder
        var outputFolder = new Folder(CONFIG.BASE_PATH + "/output");
        if (!outputFolder.exists) {
            outputFolder.create();
        }
        
        var outputFile = new File(outputFolder + "/" + config.project_id + ".indd");
        doc.save(outputFile);
        doc.close();
        
        log("✅ SUCCÈS : " + outputFile.name);
        return true;
        
    } catch (error) {
        log("❌ ERREUR : " + error.toString());
        alert("ERREUR : " + error.toString());
        return false;
    }
}

// Exécuter
main();
```

---

## 🐍 Template 2 : API Flask Complète

### Fichier : `app.py`

```python
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
import json
import subprocess
import tempfile
import uuid
from datetime import datetime
from pathlib import Path

app = Flask(__name__)

# ============================================
# CONFIGURATION
# ============================================

# ⚠️ MODIFIER AVEC VOS CHEMINS
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
OUTPUT_DIR = BASE_DIR / "output"
TEMPLATES_DIR = BASE_DIR / "templates"
SCRIPTS_DIR = BASE_DIR / "scripts"

# Configuration Flask
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max
app.config['UPLOAD_FOLDER'] = str(UPLOAD_DIR)
app.config['OUTPUT_FOLDER'] = str(OUTPUT_DIR)

# Créer les dossiers
for folder in [UPLOAD_DIR, OUTPUT_DIR, TEMPLATES_DIR, SCRIPTS_DIR]:
    folder.mkdir(exist_ok=True)

# Extensions autorisées
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'tiff', 'psd'}

# ============================================
# UTILITAIRES
# ============================================

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def log(message):
    """Logger les événements"""
    log_file = BASE_DIR / "api.log"
    timestamp = datetime.now().isoformat()
    with open(log_file, 'a') as f:
        f.write(f"[{timestamp}] {message}\n")

# ============================================
# ENDPOINTS API
# ============================================

@app.route('/api/create-layout', methods=['POST'])
def create_layout():
    """Créer une mise en page InDesign"""
    try:
        log("Nouvelle requête create-layout")
        
        # Récupérer les données
        prompt = request.form.get('prompt', '')
        text_content = request.form.get('text_content', '')
        subtitle = request.form.get('subtitle', '')
        template_name = request.form.get('template', 'default.indt')
        
        if not prompt:
            return jsonify({'error': 'Le prompt est requis'}), 400
        
        # Créer un projet unique
        project_id = str(uuid.uuid4())
        project_folder = UPLOAD_DIR / project_id
        project_folder.mkdir(exist_ok=True)
        
        log(f"Projet créé : {project_id}")
        
        # Sauvegarder les images uploadées
        uploaded_images = []
        if 'images' in request.files:
            files = request.files.getlist('images')
            for idx, file in enumerate(files):
                if file and file.filename and allowed_file(file.filename):
                    ext = file.filename.rsplit('.', 1)[1].lower()
                    filename = f"image_{idx+1}.{ext}"
                    filepath = project_folder / filename
                    file.save(str(filepath))
                    uploaded_images.append(str(filepath.absolute()))
        
        log(f"Images uploadées : {len(uploaded_images)}")
        
        # Créer config.json pour InDesign
        config = {
            'project_id': project_id,
            'prompt': prompt,
            'text_content': text_content,
            'subtitle': subtitle,
            'images': uploaded_images,
            'template': template_name,
            'created_at': datetime.now().isoformat()
        }
        
        config_path = project_folder / 'config.json'
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        
        log(f"Config écrite : {config_path}")
        
        # Exécuter le script InDesign
        result = execute_indesign_script(project_id)
        
        if result['success']:
            log(f"✅ Succès : {project_id}")
            return jsonify({
                'success': True,
                'project_id': project_id,
                'message': 'Mise en page créée avec succès',
                'output_file': result.get('output_file'),
                'download_url': f'/api/download/{project_id}'
            })
        else:
            log(f"❌ Échec : {result.get('error')}")
            return jsonify({
                'success': False,
                'error': result.get('error', 'Erreur inconnue')
            }), 500
            
    except Exception as e:
        log(f"❌ Exception : {str(e)}")
        return jsonify({'error': f'Erreur serveur: {str(e)}'}), 500

@app.route('/api/download/<project_id>')
def download_file(project_id):
    """Télécharger le fichier InDesign généré"""
    try:
        output_file = OUTPUT_DIR / f"{project_id}.indd"
        
        if not output_file.exists():
            return jsonify({'error': 'Fichier non trouvé'}), 404
        
        return send_file(
            str(output_file),
            as_attachment=True,
            download_name=f"layout_{project_id}.indd"
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/templates')
def get_templates():
    """Récupérer la liste des templates disponibles"""
    templates = []
    
    for file in TEMPLATES_DIR.glob('*.indt'):
        templates.append({
            'name': file.stem,
            'filename': file.name,
            'size': file.stat().st_size
        })
    
    return jsonify(templates)

@app.route('/api/status')
def status():
    """Vérifier le statut de l'API"""
    return jsonify({
        'status': 'running',
        'version': '1.0',
        'endpoints': {
            'create_layout': '/api/create-layout',
            'download': '/api/download/<project_id>',
            'templates': '/api/templates'
        }
    })

# ============================================
# EXÉCUTION INDESIGN
# ============================================

def execute_indesign_script(project_id):
    """Exécuter le script InDesign via AppleScript (macOS)"""
    try:
        script_path = SCRIPTS_DIR / "minimal_automation.jsx"
        
        if not script_path.exists():
            return {
                'success': False,
                'error': f'Script non trouvé : {script_path}'
            }
        
        # Créer l'AppleScript
        applescript = f'''
tell application "Adobe InDesign 2025"
    activate
    do script (file POSIX file "{script_path.absolute()}") language javascript
end tell
'''
        
        # Écrire dans un fichier temporaire
        with tempfile.NamedTemporaryFile(
            mode='w', 
            suffix='.applescript', 
            delete=False
        ) as temp_file:
            temp_file.write(applescript)
            temp_path = temp_file.name
        
        try:
            # Exécuter osascript
            result = subprocess.run(
                ['osascript', temp_path],
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes max
            )
            
            if result.returncode == 0:
                output_file = OUTPUT_DIR / f"{project_id}.indd"
                return {
                    'success': True,
                    'output_file': str(output_file)
                }
            else:
                return {
                    'success': False,
                    'error': result.stderr or result.stdout
                }
        finally:
            # Nettoyer le fichier temporaire
            Path(temp_path).unlink(missing_ok=True)
            
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': 'Timeout: le script a pris trop de temps'
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Erreur exécution: {str(e)}'
        }

# ============================================
# LANCEMENT
# ============================================

if __name__ == '__main__':
    print("🚀 API InDesign démarrée sur http://localhost:5003")
    print("📁 Dossiers configurés :")
    print(f"   - Uploads: {UPLOAD_DIR}")
    print(f"   - Output:  {OUTPUT_DIR}")
    print(f"   - Templates: {TEMPLATES_DIR}")
    app.run(debug=True, host='0.0.0.0', port=5003)
```

---

## 🔄 Template 3 : Workflow n8n (JSON)

### Fichier : `workflow_minimal.json`

```json
{
  "name": "InDesign Automation Minimal",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "indesign-webhook",
        "responseMode": "lastNode",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "webhookId": "indesign-automation"
    },
    {
      "parameters": {
        "url": "http://127.0.0.1:5003/api/create-layout",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "prompt",
              "value": "={{ $json.prompt }}"
            },
            {
              "name": "text_content",
              "value": "={{ $json.text_content }}"
            },
            {
              "name": "subtitle",
              "value": "={{ $json.subtitle }}"
            },
            {
              "name": "template",
              "value": "={{ $json.template || 'default.indt' }}"
            }
          ]
        },
        "options": {
          "timeout": 300000
        }
      },
      "name": "HTTP Request - Flask",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "HTTP Request - Flask",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

---

## 🧪 Template 4 : Tests

### Fichier : `test_api.sh`

```bash
#!/bin/bash

# ============================================
# TESTS API INDESIGN
# ============================================

BASE_URL="http://localhost:5003"

echo "🧪 Tests API InDesign"
echo "===================="

# Test 1: Statut de l'API
echo -e "\n1️⃣ Test statut..."
curl -s "${BASE_URL}/api/status" | jq .

# Test 2: Liste des templates
echo -e "\n2️⃣ Test templates..."
curl -s "${BASE_URL}/api/templates" | jq .

# Test 3: Créer une mise en page
echo -e "\n3️⃣ Test création..."
PROJECT_ID=$(curl -s -X POST "${BASE_URL}/api/create-layout" \
  -F "prompt=Titre de test" \
  -F "text_content=Contenu de test pour valider l'API" \
  -F "subtitle=Sous-titre de test" \
  -F "images=@test_image.jpg" \
  | jq -r '.project_id')

if [ "$PROJECT_ID" != "null" ]; then
  echo "✅ Projet créé : $PROJECT_ID"
  
  # Test 4: Télécharger le résultat
  echo -e "\n4️⃣ Test téléchargement..."
  curl -s "${BASE_URL}/api/download/${PROJECT_ID}" \
    -o "test_output.indd"
  
  if [ -f "test_output.indd" ]; then
    echo "✅ Fichier téléchargé : test_output.indd"
    ls -lh test_output.indd
  else
    echo "❌ Téléchargement échoué"
  fi
else
  echo "❌ Création échouée"
fi

echo -e "\n✅ Tests terminés"
```

---

## 📦 Template 5 : Structure de Projet

```
mon_projet_indesign/
│
├── app.py                      # API Flask
├── .env                        # Variables d'environnement
├── requirements.txt            # Dépendances Python
├── README.md                   # Documentation
│
├── scripts/
│   ├── minimal_automation.jsx  # Script ExtendScript principal
│   └── utils.jsx               # Fonctions utilitaires
│
├── templates/
│   ├── default.indt            # Template par défaut
│   └── magazine.indt           # Template magazine
│
├── uploads/                    # Images uploadées (auto-créé)
│   └── <project_id>/
│       ├── config.json
│       └── image_1.jpg
│
├── output/                     # Fichiers .indd générés (auto-créé)
│   └── <project_id>.indd
│
├── tests/
│   ├── test_api.sh             # Tests shell
│   └── test_image.jpg          # Image de test
│
└── n8n/
    └── workflow_minimal.json   # Workflow n8n (optionnel)
```

---

## 🔑 Template 6 : Fichier .env

```env
# ============================================
# CONFIGURATION ENVIRONNEMENT
# ============================================

# InDesign
INDESIGN_APP_NAME="Adobe InDesign 2025"

# API
API_PORT=5003
API_HOST=0.0.0.0
API_TOKEN=votre_token_secret_ici

# OpenAI (optionnel)
OPENAI_API_KEY=sk-...

# Chemins
BASE_PATH=/Users/VOTRE_NOM/mon_projet_indesign

# Limites
MAX_FILE_SIZE=52428800  # 50MB en bytes
SCRIPT_TIMEOUT=300      # 5 minutes en secondes
```

---

## 📋 Template 7 : requirements.txt

```txt
Flask==3.0.0
Werkzeug==3.0.1
python-dotenv==1.0.0
Pillow==10.1.0
requests==2.31.0
```

---

## 🚀 Template 8 : Script de Démarrage

### Fichier : `start.sh`

```bash
#!/bin/bash

# ============================================
# SCRIPT DE DÉMARRAGE
# ============================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage de l'application InDesign..."

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 n'est pas installé"
    exit 1
fi

# Vérifier les dépendances
if [ ! -d "venv" ]; then
    echo "📦 Création de l'environnement virtuel..."
    python3 -m venv venv
fi

# Activer l'environnement virtuel
source venv/bin/activate

# Installer les dépendances
echo "📦 Installation des dépendances..."
pip install -q -r requirements.txt

# Créer les dossiers nécessaires
mkdir -p uploads output templates scripts

# Lancer Flask
echo "🌐 Démarrage de Flask sur http://localhost:5003..."
python3 app.py &
FLASK_PID=$!

echo "✅ Application démarrée (PID: $FLASK_PID)"
echo "📝 Pour arrêter : kill $FLASK_PID"

# Attendre que Flask soit prêt
sleep 2

# Ouvrir le navigateur
open http://localhost:5003/api/status

echo "🎉 Prêt !"
```

---

## 📄 Template 9 : README.md

```markdown
# Automatisation InDesign

Système d'automatisation pour générer des mises en page InDesign à partir de données dynamiques.

## 🚀 Démarrage Rapide

1. **Installer les dépendances**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configurer l'environnement**
   ```bash
   cp .env.example .env
   # Éditer .env avec vos paramètres
   ```

3. **Lancer l'application**
   ```bash
   ./start.sh
   ```

4. **Tester l'API**
   ```bash
   curl http://localhost:5003/api/status
   ```

## 📁 Structure

- `app.py` : API Flask principale
- `scripts/` : Scripts ExtendScript pour InDesign
- `templates/` : Templates InDesign (.indt)
- `uploads/` : Fichiers uploadés
- `output/` : Documents générés

## 🔌 API Endpoints

### POST /api/create-layout
Créer une mise en page InDesign.

**Paramètres (form-data) :**
- `prompt` : Titre/prompt (requis)
- `text_content` : Contenu texte
- `subtitle` : Sous-titre
- `template` : Nom du template
- `images` : Fichiers images (multiple)

**Réponse :**
```json
{
  "success": true,
  "project_id": "uuid",
  "download_url": "/api/download/uuid"
}
```

## 🧪 Tests

```bash
# Lancer les tests
./tests/test_api.sh

# Test manuel
curl -X POST http://localhost:5003/api/create-layout \
  -F "prompt=Mon titre" \
  -F "text_content=Mon contenu" \
  -F "images=@image.jpg"
```

## 📝 Logs

- `api.log` : Logs de l'API Flask
- `automation.log` : Logs du script InDesign

## 🔧 Configuration InDesign

1. Créer un template (.indt) avec des placeholders :
   - `{{TITRE}}`
   - `{{SOUS_TITRE}}`
   - `{{ARTICLE}}`

2. Ajouter des rectangles vides pour les images

3. Placer le template dans `templates/`

## 📚 Documentation

Voir `MODE_OPERATOIRE_API_INDESIGN.md` pour la documentation complète.
```

---

## 🎯 Utilisation des Templates

### Pour démarrer un nouveau projet :

1. **Copier les fichiers**
   ```bash
   mkdir mon_projet
   cd mon_projet
   
   # Copier les templates
   cp templates/app.py .
   cp templates/minimal_automation.jsx scripts/
   cp templates/requirements.txt .
   cp templates/.env.example .env
   cp templates/start.sh .
   ```

2. **Personnaliser**
   - Modifier les chemins dans `CONFIG` (JSX)
   - Modifier les chemins dans `.env`
   - Créer vos templates InDesign

3. **Lancer**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

---

**Note :** Ces templates sont testés et fonctionnels. Adaptez-les à vos besoins spécifiques.
