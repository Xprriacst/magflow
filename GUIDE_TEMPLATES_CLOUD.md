# Guide : Templates InDesign dans le Cloud

## Architecture

```
┌─────────────────────┐
│  Supabase Storage   │  ← Templates .indt/.indd stockés dans le cloud
│  (bucket: templates)│
└─────────┬───────────┘
          │
          │ Téléchargement au démarrage
          ▼
┌─────────────────────┐
│  MagFlow Agent      │  ← Cache local ~/.magflow/templates/
│  (Desktop App)      │
└─────────┬───────────┘
          │
          │ Utilise les templates locaux
          ▼
┌─────────────────────┐
│  Adobe InDesign     │
└─────────────────────┘
```

## Étape 1 : Créer le bucket Supabase Storage

1. Connectez-vous à [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Storage** > **New Bucket**
4. Configurez :
   - **Name** : `templates`
   - **Public** : ✅ Oui (pour téléchargement sans auth)
   - **File size limit** : 100 MB
5. Cliquez **Create bucket**

## Étape 2 : Appliquer la migration SQL

Exécutez dans l'éditeur SQL de Supabase :

```sql
-- Ajouter les colonnes pour le cloud storage
ALTER TABLE indesign_templates 
ADD COLUMN IF NOT EXISTS storage_url TEXT;

ALTER TABLE indesign_templates 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE indesign_templates 
ADD COLUMN IF NOT EXISTS file_checksum TEXT;
```

## Étape 3 : Uploader vos templates

### Option A : Via l'API (Recommandé)

```bash
# Uploader tous les templates locaux vers Supabase Storage
curl -X POST http://localhost:3001/api/templates/upload-all
```

### Option B : Upload individuel

```bash
# Uploader un template spécifique
curl -X POST http://localhost:3001/api/templates/upload-local \
  -H "Content-Type: application/json" \
  -d '{
    "localPath": "/Users/alexandreerrasti/Documents/magflow/Indesign automation v1/indesign_templates/template-mag-simple-1808.indt",
    "templateId": "UUID_DU_TEMPLATE"
  }'
```

### Option C : Upload manuel dans Supabase

1. Allez dans **Storage** > **templates**
2. Cliquez **Upload files**
3. Sélectionnez vos fichiers `.indt` / `.indd`
4. Copiez l'URL publique
5. Mettez à jour la table `indesign_templates` avec `storage_url`

## Étape 4 : Vérification

```bash
# Vérifier que les templates ont bien storage_url
curl http://localhost:3001/api/templates | jq '.templates[] | {name, storage_url, version}'
```

## Comment ça marche ?

### Au démarrage de l'Agent

1. L'agent appelle `GET /api/templates` pour récupérer la liste
2. Pour chaque template avec `storage_url` :
   - Vérifie si le fichier existe en cache (`~/.magflow/templates/`)
   - Compare la `version` locale vs serveur
   - Télécharge si nécessaire
3. Stocke les chemins locaux pour utilisation ultérieure

### Lors d'un job de génération

1. Le backend envoie le `template_id` et `template_name`
2. L'agent résout le chemin local via `resolveTemplatePath()`
3. InDesign utilise le template depuis le cache local

## Structure des fichiers

```
~/.magflow/
├── templates/                    # Cache des templates
│   ├── template-mag-simple-1808.indt
│   ├── template-mag-simple-2-1808.indt
│   └── Magazine art template page 1.indd
└── config.json                   # electron-store
```

## API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/templates` | GET | Liste tous les templates (avec storage_url) |
| `/api/templates/upload` | POST | Upload un fichier (multipart/form-data) |
| `/api/templates/upload-local` | POST | Upload depuis un chemin local |
| `/api/templates/upload-all` | POST | Upload tous les templates locaux |

## Troubleshooting

### L'agent ne télécharge pas les templates

1. Vérifiez que `storage_url` est défini dans Supabase
2. Vérifiez que le bucket est **public**
3. Vérifiez la connectivité réseau

### Template non trouvé lors de la génération

```javascript
// Dans l'agent, vérifiez le cache
const templates = await ipcRenderer.invoke('get-local-templates');
console.log(templates);
```

### Forcer la resynchronisation

```javascript
// Vider le cache et resync
await ipcRenderer.invoke('clear-template-cache');
await ipcRenderer.invoke('sync-templates');
```

## Versioning

Chaque modification du fichier template incrémente automatiquement la `version` dans Supabase (via trigger SQL). L'agent compare sa version locale et re-télécharge si nécessaire.

## Sécurité (Production)

Pour un bucket privé, ajoutez cette politique RLS :

```sql
CREATE POLICY "Templates downloadable by authenticated"
ON storage.objects FOR SELECT
USING (bucket_id = 'templates');
```

Et modifiez l'agent pour inclure le token d'auth dans les requêtes de téléchargement.
