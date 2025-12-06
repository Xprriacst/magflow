# Guide - Upload et Analyse Automatique de Templates

## Vue d'ensemble

Le système d'ajout de templates a été amélioré pour automatiser le processus complet :

1. **Upload** du fichier InDesign (.indt ou .indd)
2. **Analyse automatique** via InDesign (placeholders, zones d'images)
3. **Génération automatique** de la miniature (JPG de la première page)
4. **Enrichissement IA** (catégorie, style, recommandations)
5. **Création en BDD** avec toutes les métadonnées

## Workflow utilisateur

### Via l'interface admin

1. Aller sur `/admin/templates`
2. Cliquer sur **"Ajouter un template"**
3. Glisser-déposer ou sélectionner un fichier `.indt` ou `.indd`
4. Optionnellement, personnaliser le nom du template
5. Cliquer sur **"Traiter le template"**
6. Attendre le traitement (1-2 minutes avec InDesign)
7. Le template apparaît dans la liste avec sa miniature

### Via l'API

```bash
# Upload et traitement complet
curl -X POST http://localhost:3001/api/templates/upload-and-process \
  -F "template=@mon-template.indt" \
  -F "name=Mon Super Template"
```

Réponse :
```json
{
  "success": true,
  "message": "Template processed successfully",
  "template": {
    "id": "uuid...",
    "name": "Mon Super Template",
    "filename": "mon-template.indt",
    "preview_url": "https://...",
    "placeholders": ["{{TITRE}}", "{{ARTICLE}}"],
    "image_slots": 3,
    "category": "Lifestyle",
    "style": "simple"
  }
}
```

## Re-analyse d'un template existant

Pour mettre à jour les métadonnées et regénérer la miniature :

```bash
curl -X POST http://localhost:3001/api/templates/{template_id}/reanalyze
```

Ou via l'interface : cliquer sur **"Re-analyser"** sur un template.

## Architecture technique

### Fichiers créés/modifiés

```
flask-api/
├── scripts/
│   └── analyze_and_thumbnail.jsx  # Script InDesign (analyse + miniature)
├── app.py                          # Endpoints Flask (/api/templates/analyze)
├── analysis/                       # Dossier de config temporaire
└── thumbnails/                     # Miniatures générées

backend/
├── services/
│   └── templateWorkflow.js         # Orchestration du workflow
├── routes/
│   └── templateUpload.js           # Endpoints upload + reanalyze

src/pages/admin/templates/
└── index.jsx                       # Interface admin avec modal d'upload
```

### Flux technique

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  Backend    │────▶│   Flask     │
│  (Upload)   │     │  (Node.js)  │     │  (Python)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           │                    ▼
                           │            ┌─────────────┐
                           │            │  InDesign   │
                           │            │   (JSX)     │
                           │            └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Supabase   │◀────│  Miniature  │
                    │  (Storage)  │     │   (JPG)     │
                    └─────────────┘     └─────────────┘
```

### Données extraites automatiquement

- **Placeholders** : `{{TITRE}}`, `{{ARTICLE}}`, etc.
- **Zones d'images** : Nombre de rectangles vides
- **Polices** : Liste des polices utilisées
- **Couleurs** : Nuancier du document
- **Dimensions** : Taille du document
- **Pages** : Nombre de pages

### Données enrichies par l'IA

- **Catégorie** : Art & Culture, Lifestyle, Tech, Business...
- **Style** : simple, moyen, complexe
- **Recommandations** : Tags de cas d'usage
- **Description** : Texte attractif généré

## Prérequis

1. **InDesign** doit être installé et accessible (`Adobe InDesign 2025`)
2. **Flask API** doit tourner sur le port 5003
3. **Supabase** doit être configuré avec le bucket `templates`

## Configuration

Variables d'environnement (backend) :
```env
FLASK_API_URL=http://localhost:5003
TEMPLATES_DIR=/tmp/magflow-templates
INDESIGN_APP_NAME=Adobe InDesign 2025
```

## Dépannage

### "Script InDesign timeout"
- Vérifier qu'InDesign est lancé
- Augmenter le timeout dans Flask (120s par défaut)

### "Thumbnail not generated"
- Le template doit avoir au moins une page
- Vérifier les logs InDesign pour les erreurs

### "Analysis failed"
- Vérifier que le fichier n'est pas corrompu
- Ouvrir manuellement dans InDesign pour diagnostiquer

## Bonnes pratiques pour les templates

1. **Nommer les placeholders clairement** : `{{TITRE}}`, `{{CHAPO}}`, `{{ARTICLE}}`
2. **Utiliser des rectangles vides** pour les zones d'images
3. **Première page représentative** (utilisée pour la miniature)
4. **Format .indt** préféré (template InDesign)
