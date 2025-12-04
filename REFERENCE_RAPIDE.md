# ⚡ Référence Rapide - API InDesign

Guide ultra-compact pour l'automatisation InDesign. À garder sous la main !

---

## 🎯 Architecture en 1 coup d'œil

```
┌───────────────────────────────────────────────────────────────┐
│                    FLUX DE DONNÉES                            │
└───────────────────────────────────────────────────────────────┘

   USER INPUT                 API BACKEND            INDESIGN
   
┌─────────┐              ┌──────────────┐         ┌──────────┐
│ Images  │─────────────>│              │         │          │
│ + Texte │              │    FLASK     │────────>│ Template │
│ + Prompt│              │    (Python)  │         │  .indt   │
└─────────┘              │              │         │          │
                         │ 1. Créer ID  │         └──────────┘
   (optionnel)           │ 2. Save data │              │
┌─────────┐              │ 3. Call JSX  │              │
│   n8n   │─────────────>│              │              v
│ + OpenAI│              └──────────────┘         ┌──────────┐
└─────────┘                     │                 │ExtendScript
                                │                 │   (JSX)  │
                                v                 │          │
                         ┌──────────────┐         │ 1. Open  │
                         │ config.json  │<────────│ 2. Replace│
                         │              │         │ 3. Place │
                         │ {            │         │ 4. Save  │
                         │   project_id │         └──────────┘
                         │   prompt     │              │
                         │   images[]   │              v
                         │ }            │         ┌──────────┐
                         └──────────────┘         │ Output   │
                                                  │ .indd    │
                                                  └──────────┘
```

---

## 📚 API ExtendScript - Antisèche

### Objets InDesign essentiels

| Objet | Description | Exemple |
|-------|-------------|---------|
| `app` | Application InDesign | `app.open(file)` |
| `doc` | Document actif | `doc.save(file)` |
| `page` | Page du document | `doc.pages[0]` |
| `textFrame` | Cadre de texte | `page.textFrames[0]` |
| `rectangle` | Rectangle graphique | `page.rectangles[0]` |

### Opérations courantes

#### 📂 Fichiers

```javascript
// Créer un objet File
var file = new File("/path/to/file.indt");

// Vérifier existence
if (file.exists) { }

// Ouvrir un document
var doc = app.open(file);

// Sauvegarder
doc.save(new File("/path/to/output.indd"));

// Fermer
doc.close();
```

#### 🔍 Find & Replace

```javascript
// Réinitialiser
app.findTextPreferences = NothingEnum.NOTHING;
app.changeTextPreferences = NothingEnum.NOTHING;

// Définir recherche
app.findTextPreferences.findWhat = "{{PLACEHOLDER}}";
app.changeTextPreferences.changeTo = "Nouveau texte";

// Exécuter
var found = doc.changeText();

// Nombre de remplacements
alert(found.length + " remplacements");

// Toujours réinitialiser après !
app.findTextPreferences = NothingEnum.NOTHING;
app.changeTextPreferences = NothingEnum.NOTHING;
```

#### 🖼️ Images

```javascript
// Récupérer un rectangle
var rect = doc.pages[0].rectangles[0];

// Placer une image
var imgFile = new File("/path/to/image.jpg");
rect.place(imgFile);

// Ajuster
rect.fit(FitOptions.CONTENT_TO_FRAME);  // Image → cadre
rect.fit(FitOptions.FRAME_TO_CONTENT);  // Cadre → image
rect.fit(FitOptions.CENTER_CONTENT);    // Centrer
rect.fit(FitOptions.PROPORTIONALLY);    // Proportionnel
```

#### 📝 Texte

```javascript
// Lire le contenu d'un cadre
var text = textFrame.contents;

// Modifier le contenu
textFrame.contents = "Nouveau texte";

// Accéder à un paragraphe
var para = textFrame.paragraphs[0];

// Styler
para.pointSize = 24;
para.appliedFont = "Arial";
para.fillColor = doc.swatches.itemByName("Black");
```

#### 🗂️ Dossiers

```javascript
// Créer un objet Folder
var folder = new Folder("/path/to/folder");

// Vérifier existence
if (folder.exists) { }

// Créer le dossier
folder.create();

// Lister les fichiers
var files = folder.getFiles();
for (var i = 0; i < files.length; i++) {
    alert(files[i].name);
}

// Filtrer par extension
var pdfFiles = folder.getFiles("*.pdf");
```

#### 🐛 Debugging

```javascript
// Alertes
alert("Message simple");
alert("Valeur : " + variable);

// Log dans fichier
var log = new File("/path/to/debug.log");
log.open("a");  // append
log.writeln("Message : " + new Date());
log.close();

// Try-catch
try {
    // Code risqué
} catch (error) {
    alert("Erreur : " + error.toString());
    alert("Ligne : " + error.line);
}
```

---

## 🐍 Flask - Antisèche

### Routes essentielles

```python
from flask import Flask, request, jsonify, send_file

app = Flask(__name__)

# POST avec form-data
@app.route('/api/endpoint', methods=['POST'])
def handle_post():
    data = request.form.get('field')
    file = request.files.get('image')
    return jsonify({'success': True})

# GET simple
@app.route('/api/status')
def status():
    return jsonify({'status': 'ok'})

# Téléchargement de fichier
@app.route('/download/<id>')
def download(id):
    return send_file('output/file.indd', as_attachment=True)
```

### Gestion des fichiers

```python
from werkzeug.utils import secure_filename
import os

# Upload sécurisé
file = request.files['image']
filename = secure_filename(file.filename)
filepath = os.path.join('uploads', filename)
file.save(filepath)

# Chemin absolu
abs_path = os.path.abspath(filepath)

# Vérifier extension
ALLOWED = {'jpg', 'png', 'gif'}
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED
```

### Exécution subprocess

```python
import subprocess
import tempfile

# Créer fichier temporaire
with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
    f.write("contenu")
    temp_path = f.name

# Exécuter commande
result = subprocess.run(
    ['osascript', temp_path],
    capture_output=True,
    text=True,
    timeout=300
)

# Vérifier résultat
if result.returncode == 0:
    print("Succès")
else:
    print("Erreur :", result.stderr)

# Nettoyer
os.unlink(temp_path)
```

---

## 🔗 n8n - Antisèche

### Workflow minimal

```
Webhook → HTTP Request → Response
```

### Expressions n8n

```javascript
// Accéder aux données JSON
{{ $json.field }}

// Avec fallback
{{ $json.field || 'default' }}

// Plusieurs nœuds précédents
{{ $node["NodeName"].json.field }}

// Tableau
{{ $json.items[0].value }}

// Conditions
{% if $json.type === 'A' %}
  Valeur A
{% else %}
  Valeur B
{% endif %}
```

### HTTP Request vers Flask

**Configuration :**
- Method: POST
- URL: `http://127.0.0.1:5003/api/create-layout`
- Body: Form-Data
- Timeout: 300000 (5 min)

**Body Parameters :**
```javascript
prompt: {{ $json.titre }}
text_content: {{ $json.contenu }}
images: {{ JSON.stringify($json.images) }}
```

---

## 🔧 Commandes Shell Utiles

### Tester l'API

```bash
# Statut
curl http://localhost:5003/api/status

# POST simple
curl -X POST http://localhost:5003/api/create-layout \
  -F "prompt=Test" \
  -F "text_content=Contenu test"

# POST avec image
curl -X POST http://localhost:5003/api/create-layout \
  -F "prompt=Test" \
  -F "images=@image.jpg"

# POST avec JSON
curl -X POST http://localhost:5003/api/create-layout \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test", "text_content": "Contenu"}'
```

### Lancer les services

```bash
# Flask
python3 app.py

# n8n (Docker)
docker run -it --rm -p 5678:5678 n8nio/n8n

# InDesign (tester un script)
osascript -e 'tell application "Adobe InDesign 2025" to do script (file POSIX file "/path/script.jsx") language javascript'
```

### Debugging

```bash
# Logs Flask en temps réel
tail -f api.log

# Logs InDesign
tail -f automation.log

# Vérifier processus
ps aux | grep python
ps aux | grep InDesign

# Tuer un processus
kill -9 <PID>
```

---

## ⚠️ Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Cannot find file` | Chemin relatif | Utiliser `os.path.abspath()` |
| `JSON.parse is not defined` | ExtendScript ES3 | Parser manuellement |
| `Template cannot be opened` | Fichier corrompu | Recréer le template |
| `Rectangle undefined` | Index invalide | Vérifier `rectangles.length` |
| `Permission denied` | Droits fichier | `chmod +x script.sh` |
| `Connection refused` | Flask non démarré | `python3 app.py` |
| `Timeout expired` | Script trop long | Augmenter timeout |
| `Module not found` | Dépendance manquante | `pip install -r requirements.txt` |

---

## 📋 Checklist Projet

### Avant de commencer

- [ ] InDesign installé et configuré
- [ ] Python 3.8+ avec Flask
- [ ] Créer les dossiers : `uploads/`, `output/`, `templates/`, `scripts/`
- [ ] Templates InDesign avec placeholders
- [ ] Script JSX configuré avec bons chemins

### Configuration

- [ ] `.env` avec chemins absolus
- [ ] `requirements.txt` installé
- [ ] Logs activés (`api.log`, `automation.log`)
- [ ] Gestion d'erreurs dans tout le code

### Tests

- [ ] Template s'ouvre dans InDesign
- [ ] Script JSX exécute sans erreur
- [ ] Flask répond à `/api/status`
- [ ] Upload d'image fonctionne
- [ ] Document .indd généré

### Production

- [ ] Variables sensibles dans `.env`
- [ ] Timeout approprié (300s+)
- [ ] Validation des données entrantes
- [ ] Nettoyage des fichiers temporaires
- [ ] Logs rotatifs configurés

---

## 🎯 Placeholders Recommandés

### Pour les templates InDesign

**Texte :**
- `{{TITRE}}` - Titre principal
- `{{SOUS_TITRE}}` - Sous-titre
- `{{ARTICLE}}` - Corps de l'article
- `{{ENCADRE_1}}` - Premier encadré
- `{{CATEGORY}}` - Catégorie
- `{{AUTHOR}}` - Auteur
- `{{DATE}}` - Date

**Images :**
- Rectangles vides numérotés (0, 1, 2...)
- Nommer les calques pour faciliter l'identification

**Conventions :**
- Utiliser `{{MAJUSCULES}}` pour les placeholders
- Éviter les accents dans les noms
- Garder des noms courts et explicites

---

## 💡 Bonnes Pratiques

### ExtendScript

✅ **À FAIRE :**
- Chemins absolus partout
- Try-catch sur tout
- Réinitialiser les préférences Find/Replace
- Logger chaque étape importante
- Tester chaque fonction isolément

❌ **À ÉVITER :**
- JSON.parse() natif
- Chemins relatifs
- Oublier de fermer les documents
- Laisser des alertes en production
- Parcours complexes de DOM

### Flask

✅ **À FAIRE :**
- Valider toutes les entrées
- Logger les requêtes
- Nettoyer les fichiers temporaires
- Utiliser `os.path.abspath()`
- Gérer les timeouts

❌ **À ÉVITER :**
- Stocker des secrets dans le code
- Upload sans validation
- Fichiers temporaires non nettoyés
- Chemins en dur
- Timeout trop court

### n8n

✅ **À FAIRE :**
- Fallbacks pour l'IA
- Timeout élevé (300s+)
- Validation des données webhook
- Logs détaillés
- Tests unitaires par nœud

❌ **À ÉVITER :**
- Faire confiance aveugle à l'IA
- Timeout par défaut (30s)
- Chaînage sans validation
- Oublier la gestion d'erreur
- Secrets dans le workflow

---

## 🚀 Démarrage en 5 minutes

```bash
# 1. Cloner la structure
mkdir mon_projet && cd mon_projet
mkdir uploads output templates scripts

# 2. Créer l'API
cat > app.py << 'EOF'
from flask import Flask, request, jsonify
app = Flask(__name__)
@app.route('/api/status')
def status():
    return jsonify({'status': 'ok'})
if __name__ == '__main__':
    app.run(port=5003)
EOF

# 3. Créer le script JSX
cat > scripts/test.jsx << 'EOF'
#target indesign
alert("Script fonctionne !");
EOF

# 4. Installer dépendances
pip install flask

# 5. Lancer
python3 app.py
```

Ouvrir : http://localhost:5003/api/status

---

## 📞 Commandes d'urgence

```bash
# Tout arrêter
pkill -f flask
pkill -f n8n
killall "Adobe InDesign"

# Nettoyer les uploads
rm -rf uploads/*

# Réinitialiser les logs
> api.log
> automation.log

# Recréer les dossiers
mkdir -p uploads output templates scripts

# Redémarrer proprement
python3 app.py
```

---

## 📊 Métriques de Performance

| Métrique | Valeur normale | Action si dépassé |
|----------|----------------|-------------------|
| Temps API Flask | < 2s | Vérifier images/réseau |
| Temps script InDesign | < 30s | Simplifier template |
| Temps OpenAI | < 10s | Réduire le prompt |
| Taille upload | < 50MB | Compresser images |
| Timeout total | < 300s | Augmenter limite |

---

## 🔗 Liens Rapides

- [ExtendScript API](https://extendscript.docsforadobe.dev/)
- [Flask Docs](https://flask.palletsprojects.com/)
- [n8n Docs](https://docs.n8n.io/)
- [InDesign Scripting Guide](https://www.adobe.com/devnet/indesign/scripting.html)

---

**💡 Conseil :** Imprimez cette page et gardez-la près de vous pendant le développement !
