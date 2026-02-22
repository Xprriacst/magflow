# 🚀 Guide de Déploiement Client - MagFlow + InDesign

**Version:** 1.0.0  
**Date:** 2025-10-14  
**Public:** Clients finaux avec Adobe InDesign

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis Client](#prérequis-client)
3. [Architecture de Déploiement](#architecture-de-déploiement)
4. [Option A: Déploiement Local](#option-a-déploiement-local)
5. [Option B: Déploiement Cloud + InDesign Local](#option-b-déploiement-cloud--indesign-local)
6. [Configuration InDesign](#configuration-indesign)
7. [Sécurité & Accès](#sécurité--accès)
8. [Support & Maintenance](#support--maintenance)

---

## 🎯 Vue d'ensemble

### Qu'est-ce que MagFlow ?

MagFlow est une plateforme de génération automatique de magazines qui :
- Analyse le contenu avec l'IA (GPT-4o)
- Recommande des templates InDesign adaptés
- Génère automatiquement des mises en page InDesign
- Permet le téléchargement de fichiers .indd prêts à éditer

### Comment ça fonctionne ?

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Navigateur │─────▶│   Backend    │─────▶│  Flask API  │
│   Client    │      │  (Node.js)   │      │  (Python)   │
└─────────────┘      └──────────────┘      └─────────────┘
                            │                      │
                            │                      │
                            ▼                      ▼
                     ┌──────────────┐      ┌─────────────┐
                     │   Supabase   │      │   InDesign  │
                     │   Database   │      │    Local    │
                     └──────────────┘      └─────────────┘
```

---

## ✅ Prérequis Client

### Matériel Requis

#### Machine Cliente
- **OS:** macOS 10.15+ ou Windows 10+
- **RAM:** Minimum 8 GB (recommandé 16 GB)
- **Disque:** 5 GB d'espace libre minimum
- **Processeur:** Intel i5 / Apple M1 ou supérieur

### Logiciels Requis

#### Obligatoires
1. **Adobe InDesign** (2023 ou plus récent)
   - Licence active et valide
   - ExtendScript activé
   - Scripts autorisés

2. **Node.js** (v18.x ou plus récent)
   - Installation: https://nodejs.org/

3. **Python** (v3.9 ou plus récent)
   - Installation: https://www.python.org/

#### Optionnels (selon déploiement)
- **Git** (pour mises à jour)
- **Docker** (pour déploiement conteneurisé)

### Accès Réseau

- **Internet requis** pour :
  - API OpenAI (analyse de contenu)
  - Supabase (base de données)
  - Téléchargement d'images
  
- **Ports à ouvrir** (déploiement local) :
  - `3001` - Backend Node.js
  - `5003` - Flask API
  - `5173` - Frontend (dev) / `80` (prod)

---

## 🏗️ Architecture de Déploiement

### Deux Options Principales

#### Option A: Installation Complète Locale
```
Tout sur la machine du client
✅ Contrôle total
✅ Pas de latence réseau
❌ Maintenance client
❌ Configuration complexe
```

#### Option B: Cloud + InDesign Local
```
Backend cloud + Flask/InDesign local
✅ Maintenance centralisée
✅ Mises à jour automatiques
✅ Configuration simplifiée
❌ Latence réseau possible
```

---

## 📦 Option A: Déploiement Local

### Étape 1: Installation des Dépendances

#### 1.1 Node.js & Python
```bash
# Vérifier Node.js
node --version  # doit afficher v18.x ou +

# Vérifier Python
python3 --version  # doit afficher v3.9 ou +
```

#### 1.2 Cloner le Projet
```bash
# Créer un dossier de travail
mkdir ~/MagFlow
cd ~/MagFlow

# Cloner depuis GitHub
git clone https://github.com/Xprriacst/magflow.git
cd magflow
```

### Étape 2: Configuration

#### 2.1 Backend Configuration
```bash
cd backend

# Créer le fichier .env
cat > .env << 'EOF'
# API Keys
OPENAI_API_KEY=sk-proj-VOTRE_CLE_OPENAI

# Supabase
SUPABASE_URL=https://VOTRE_PROJET.supabase.co
SUPABASE_SERVICE_KEY=VOTRE_CLE_SERVICE_SUPABASE

# Flask API
FLASK_API_URL=http://localhost:5003
FLASK_API_TOKEN=TOKEN_SECURISE_ICI

# Environment
NODE_ENV=production
PORT=3001
EOF

# Installer les dépendances
npm install
```

#### 2.2 Flask Configuration
```bash
cd "../Indesign automation v1"

# Créer le fichier .env
cat > .env << 'EOF'
# API Token
API_TOKEN=TOKEN_SECURISE_ICI

# InDesign
INDESIGN_APP_NAME=Adobe InDesign 2025

# Paths
TEMPLATES_FOLDER=indesign_templates
UPLOAD_FOLDER=uploads
OUTPUT_FOLDER=output

# Flask
FLASK_ENV=production
FLASK_PORT=5003
EOF

# Installer les dépendances Python
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 2.3 Frontend Configuration
```bash
cd ..

# Installer les dépendances
npm install

# Build de production
npm run build
```

### Étape 3: Configuration InDesign

#### 3.1 Activer les Scripts
1. Ouvrir **Adobe InDesign**
2. Menu **Édition → Préférences → Scripts** (Mac: InDesign → Préférences)
3. Cocher **"Activer les scripts ExtendScript"**
4. Cocher **"Autoriser les scripts à écrire et à accéder au réseau"**

#### 3.2 Copier les Templates
```bash
# Les templates InDesign doivent être dans:
# magflow/Indesign automation v1/indesign_templates/

# Vérifier qu'ils existent
ls "Indesign automation v1/indesign_templates/"
# Doit afficher:
# - template-mag-simple-1808.indt
# - template-mag-simple-2-1808.indt
```

#### 3.3 Tester la Connexion InDesign
```bash
cd "Indesign automation v1"

# Lancer un test simple
python3 test_indesign_direct_final.py
```

### Étape 4: Démarrage des Services

#### 4.1 Script de Démarrage Automatique
```bash
cd ~/MagFlow/magflow

# Rendre le script exécutable
chmod +x start-all.sh

# Démarrer tous les services
./start-all.sh
```

#### 4.2 Démarrage Manuel (si nécessaire)
```bash
# Terminal 1 - Backend
cd ~/MagFlow/magflow/backend
npm start

# Terminal 2 - Flask
cd ~/MagFlow/magflow/Indesign\ automation\ v1
source venv/bin/activate
python app.py

# Terminal 3 - Frontend (production)
cd ~/MagFlow/magflow
npm run serve  # ou utiliser un serveur web
```

### Étape 5: Vérification

#### 5.1 Tests de Santé
```bash
# Backend
curl http://localhost:3001/health
# Réponse attendue: {"status":"ok"}

# Flask
curl http://localhost:5003/api/status
# Réponse attendue: {"status":"ok"}

# Frontend
curl http://localhost:5173
# Doit afficher la page HTML
```

#### 5.2 Test Complet
1. Ouvrir le navigateur: `http://localhost:5173`
2. Aller sur **"Smart Content Creator"**
3. Coller du texte (>50 caractères)
4. Cliquer **"Analyser et choisir un template"**
5. Sélectionner un template
6. Cliquer **"Générer le magazine"**
7. Télécharger le fichier `.indd`
8. Ouvrir dans InDesign → ✅ Succès !

---

## ☁️ Option B: Déploiement Cloud + InDesign Local

### Architecture Hybride

```
┌──────────────────────────────────────┐
│           CLOUD (Vercel/Netlify)     │
│  ┌────────────┐    ┌──────────────┐  │
│  │  Frontend  │    │   Backend    │  │
│  │   React    │◀──▶│   Node.js    │  │
│  └────────────┘    └──────────────┘  │
│                           │           │
│                           ▼           │
│                    ┌──────────────┐  │
│                    │   Supabase   │  │
│                    └──────────────┘  │
└──────────────────────────────────────┘
                     │
                     │ HTTPS/API
                     │
┌────────────────────▼──────────────────┐
│        MACHINE CLIENT (Local)         │
│  ┌──────────────┐    ┌─────────────┐ │
│  │  Flask API   │───▶│  InDesign   │ │
│  │   Python     │    │    2025     │ │
│  └──────────────┘    └─────────────┘ │
└───────────────────────────────────────┘
```

### Avantages de cette Architecture
- ✅ Frontend/Backend centralisés (mises à jour faciles)
- ✅ Seul Flask + InDesign sur la machine client
- ✅ Configuration client minimale
- ✅ Support simplifié
- ✅ Scalabilité pour plusieurs clients

### Étape 1: Déploiement Cloud (Côté Fournisseur)

#### 1.1 Déployer le Backend (Vercel)
```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
cd backend
vercel --prod
# Note l'URL: https://magflow-backend.vercel.app
```

#### 1.2 Déployer le Frontend (Vercel)
```bash
cd ..
vercel --prod
# Note l'URL: https://magflow.vercel.app
```

#### 1.3 Configuration Variables Cloud
```bash
# Dans Vercel Dashboard
OPENAI_API_KEY=sk-proj-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
FLASK_API_URL=https://client-specifique.ngrok.io
```

### Étape 2: Installation Client Simplifiée

#### 2.1 Package Client Minimal
```bash
# Créer un package client-only
mkdir magflow-client
cd magflow-client

# Copier uniquement Flask + InDesign
cp -r ../magflow/Indesign\ automation\ v1/* .
```

#### 2.2 Script d'Installation Client
```bash
# install-client.sh
cat > install-client.sh << 'EOF'
#!/bin/bash

echo "🚀 Installation MagFlow Client..."

# 1. Vérifier Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 requis. Installer depuis python.org"
    exit 1
fi

# 2. Créer environnement virtuel
python3 -m venv venv
source venv/bin/activate

# 3. Installer dépendances
pip install -r requirements.txt

# 4. Configuration
echo "📝 Configuration..."
read -p "Token API (fourni par le fournisseur): " API_TOKEN
read -p "Nom InDesign (ex: Adobe InDesign 2025): " INDESIGN_NAME

cat > .env << ENVEOF
API_TOKEN=$API_TOKEN
INDESIGN_APP_NAME=$INDESIGN_NAME
FLASK_ENV=production
FLASK_PORT=5003
ENVEOF

# 5. Test
echo "🧪 Test de connexion..."
python3 app.py &
sleep 5
curl http://localhost:5003/api/status

echo "✅ Installation terminée !"
echo "Démarrer avec: ./start-client.sh"
EOF

chmod +x install-client.sh
```

#### 2.3 Script de Démarrage Client
```bash
# start-client.sh
cat > start-client.sh << 'EOF'
#!/bin/bash

echo "🚀 Démarrage MagFlow Client..."

# Activer environnement Python
source venv/bin/activate

# Démarrer Flask
python3 app.py

# Flask tourne maintenant sur http://localhost:5003
EOF

chmod +x start-client.sh
```

### Étape 3: Exposer Flask au Cloud (Tunnel Sécurisé)

#### Option 3.1: ngrok (Recommandé pour démo/test)
```bash
# Installer ngrok
brew install ngrok  # Mac
# ou télécharger: https://ngrok.com/download

# Démarrer le tunnel
ngrok http 5003

# Copier l'URL publique (ex: https://abc123.ngrok.io)
# La configurer dans le backend cloud
```

#### Option 3.2: Cloudflare Tunnel (Recommandé pour production)
```bash
# Installer cloudflared
brew install cloudflare/cloudflare/cloudflared

# Authentifier
cloudflared tunnel login

# Créer un tunnel
cloudflared tunnel create magflow-client-X

# Configurer
cat > ~/.cloudflared/config.yml << EOF
tunnel: magflow-client-X
credentials-file: /Users/.../.cloudflared/xxx.json

ingress:
  - hostname: client-x.magflow.app
    service: http://localhost:5003
  - service: http_status:404
EOF

# Démarrer
cloudflared tunnel run magflow-client-X
```

#### Option 3.3: VPN Client (Production Sécurisée)
```bash
# Utiliser un VPN dédié (Tailscale, ZeroTier, etc.)
# Flask reste privé, accessible uniquement via VPN
```

---

## 🔒 Sécurité & Accès

### Authentification API

#### Token API Client
```python
# Dans Flask .env
API_TOKEN=magflow_client_abc123def456

# Le backend cloud vérifie ce token
# Chaque client a un token unique
```

#### Rotation des Tokens
```bash
# Générer un nouveau token client
openssl rand -base64 32

# Mettre à jour dans:
# 1. .env client (Flask)
# 2. Variables environnement cloud (Backend)
```

### Sécurité Réseau

#### Firewall Client
```bash
# Autoriser uniquement:
# - Flask vers Backend Cloud (HTTPS)
# - Backend Cloud vers Flask (via tunnel)
# - InDesign vers Flask (localhost)
```

#### HTTPS Obligatoire
```bash
# Backend cloud DOIT être en HTTPS
# Tunnels (ngrok/cloudflare) fournissent HTTPS automatiquement
```

### Protection des Données

#### Données Sensibles
- ❌ Jamais stocker de clés API côté client
- ✅ Templates InDesign peuvent rester locaux
- ✅ Fichiers générés stockés localement ou cloud selon config

#### Logs
```bash
# Activer les logs client
cd "Indesign automation v1"
tail -f flask.log
```

---

## 🛠️ Configuration InDesign Avancée

### Scripts ExtendScript

#### Emplacement des Scripts
```
# Mac
~/Library/Preferences/Adobe InDesign/Version X.X/Scripts/

# Windows
C:\Users\[user]\AppData\Roaming\Adobe\InDesign\Version X.X\Scripts\
```

#### Templates InDesign

##### Structure Recommandée
```
indesign_templates/
├── template-magazine-culture.indt
├── template-magazine-tech.indt
├── template-magazine-business.indt
└── README.md (guide des placeholders)
```

##### Placeholders Obligatoires
Chaque template DOIT contenir au minimum :
- `{{TITRE}}` - Titre principal
- `{{ARTICLE}}` - Contenu principal

##### Placeholders Optionnels
- `{{SOUS-TITRE}}` - Sous-titre
- `{{CHAPO}}` - Chapô
- `{{AUTEUR}}` - Nom de l'auteur
- `{{DATE}}` - Date de publication
- `{{IMAGE_1}}`, `{{IMAGE_2}}`, etc. - Espaces pour images

### Permissions InDesign

#### macOS
```bash
# Donner les permissions à Terminal/iTerm
System Preferences → Security & Privacy → Automation
→ Cocher "Terminal" pour "Adobe InDesign"
```

#### Windows
```powershell
# Exécuter PowerShell en Administrateur
Set-ExecutionPolicy RemoteSigned
```

---

## 📊 Monitoring & Logs

### Logs Client

#### Activer le Logging
```python
# Dans Flask app.py
import logging

logging.basicConfig(
    filename='flask.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
```

#### Surveiller les Logs
```bash
# En temps réel
tail -f flask.log

# Dernières erreurs
grep ERROR flask.log | tail -20
```

### Health Checks

#### Script de Monitoring
```bash
# health-check.sh
#!/bin/bash

check_service() {
    SERVICE=$1
    URL=$2
    
    if curl -s $URL > /dev/null; then
        echo "✅ $SERVICE: OK"
    else
        echo "❌ $SERVICE: DOWN"
        # Optionnel: Restart automatique
        # ./restart-$SERVICE.sh
    fi
}

check_service "Flask API" "http://localhost:5003/api/status"
check_service "Backend Cloud" "https://magflow-backend.vercel.app/health"
```

#### Cron Job (Surveillance 24/7)
```bash
# Ajouter au crontab
crontab -e

# Vérifier toutes les 5 minutes
*/5 * * * * /path/to/health-check.sh >> /var/log/magflow-health.log 2>&1
```

---

## 🔄 Mises à Jour

### Mise à Jour Client (Local)

#### Mise à Jour Manuelle
```bash
cd ~/MagFlow/magflow

# Arrêter les services
./stop-all.sh

# Mettre à jour le code
git pull origin main

# Réinstaller les dépendances si nécessaire
cd backend && npm install
cd ../"Indesign automation v1" && pip install -r requirements.txt

# Redémarrer
cd ..
./start-all.sh
```

#### Mise à Jour Automatique
```bash
# update-client.sh
#!/bin/bash

echo "🔄 Mise à jour MagFlow..."

cd ~/MagFlow/magflow

# Backup de la config
cp backend/.env backend/.env.backup
cp "Indesign automation v1/.env" "Indesign automation v1/.env.backup"

# Arrêter
./stop-all.sh

# Mise à jour
git pull origin main

# Restaurer la config
mv backend/.env.backup backend/.env
mv "Indesign automation v1/.env.backup" "Indesign automation v1/.env"

# Redémarrer
./start-all.sh

echo "✅ Mise à jour terminée !"
```

### Mise à Jour Cloud (Option B)

#### Backend/Frontend
```bash
# Les mises à jour cloud sont automatiques
# via CI/CD (GitHub Actions → Vercel)
# Aucune action client requise ✅
```

#### Flask Client Only
```bash
# Seul le client Flask doit être mis à jour manuellement
cd ~/MagFlow/magflow-client
git pull origin main
pip install -r requirements.txt
./restart-client.sh
```

---

## 📞 Support Client

### Documentation Client

#### Guide Utilisateur (à fournir)
1. **Guide de Démarrage Rapide** (1 page)
2. **Guide Utilisateur Complet** (10-15 pages)
3. **FAQ** (Questions fréquentes)
4. **Troubleshooting** (Résolution de problèmes)

#### Checklist de Formation
- [ ] Démarrer/Arrêter les services
- [ ] Utiliser l'interface web
- [ ] Analyser du contenu
- [ ] Choisir un template
- [ ] Générer un magazine
- [ ] Ouvrir le fichier dans InDesign
- [ ] Personnaliser la mise en page
- [ ] Exporter en PDF

### Problèmes Courants

#### "InDesign ne répond pas"
```bash
# 1. Vérifier qu'InDesign est ouvert
# 2. Vérifier les permissions (macOS)
# 3. Relancer InDesign
# 4. Tester:
cd "Indesign automation v1"
python3 test_indesign_direct_final.py
```

#### "Flask API ne démarre pas"
```bash
# 1. Vérifier le port
lsof -i :5003

# 2. Tuer le processus si nécessaire
lsof -ti:5003 | xargs kill -9

# 3. Redémarrer
python3 app.py
```

#### "Templates non trouvés"
```bash
# Vérifier l'emplacement
ls -la "Indesign automation v1/indesign_templates/"

# Doit contenir des fichiers .indt
```

---

## 💰 Modèles de Déploiement

### Option 1: Installation On-Premise
- ✅ Client possède tout le code
- ✅ Aucune dépendance externe (sauf API OpenAI)
- ✅ Données restent locales
- ❌ Maintenance à la charge du client
- **Prix:** Licence unique + support annuel optionnel

### Option 2: SaaS avec Agent Local
- ✅ Backend/Frontend hébergés et maintenus
- ✅ Mises à jour automatiques
- ✅ Support inclus
- ✅ Installation client simplifiée (Flask seulement)
- ❌ Abonnement mensuel
- **Prix:** Abonnement mensuel par utilisateur

### Option 3: Hosted avec VPN
- ✅ Tout hébergé (y compris InDesign dans le cloud)
- ✅ Zéro installation client
- ✅ Accessible depuis n'importe où
- ❌ Coût infrastructure élevé
- ❌ Nécessite InDesign Server (licence spéciale)
- **Prix:** Abonnement premium + coûts infrastructure

---

## 🎓 Formation Client

### Programme de Formation (4h)

#### Session 1: Installation & Configuration (1h)
- Installation des dépendances
- Configuration InDesign
- Premier démarrage
- Tests de connexion

#### Session 2: Utilisation Basique (1h)
- Interface web
- Analyse de contenu
- Sélection de templates
- Génération de magazines

#### Session 3: Utilisation Avancée (1h)
- Création de templates personnalisés
- Upload d'images
- Gestion des projets
- Export PDF

#### Session 4: Maintenance & Support (1h)
- Démarrage/Arrêt des services
- Consultation des logs
- Résolution de problèmes courants
- Mises à jour

---

## ✅ Checklist de Déploiement

### Avant Installation Client

- [ ] Vérifier les prérequis matériels
- [ ] Confirmer licence InDesign active
- [ ] Préparer les credentials (OpenAI, Supabase)
- [ ] Générer le token API client unique
- [ ] Préparer les templates InDesign
- [ ] Tester l'installation sur une machine test

### Pendant Installation

- [ ] Installer Node.js et Python
- [ ] Cloner/Copier le code
- [ ] Configurer les fichiers .env
- [ ] Installer les dépendances
- [ ] Configurer InDesign
- [ ] Démarrer les services
- [ ] Tests de santé
- [ ] Test workflow complet

### Après Installation

- [ ] Formation utilisateur
- [ ] Documentation remise
- [ ] Contacts support fournis
- [ ] Plan de maintenance établi
- [ ] Premier magazine généré avec succès ✅

---

## 📄 Contrats & SLA

### SLA Recommandés

#### Disponibilité
- **Cloud:** 99.9% uptime (Option B)
- **Support:** Réponse <24h jours ouvrés
- **Critique:** Réponse <4h

#### Performance
- **Analyse IA:** < 10 secondes
- **Génération InDesign:** < 60 secondes
- **Téléchargement:** Immédiat

#### Maintenance
- **Mises à jour:** 1x par mois minimum
- **Backups:** Quotidiens (si cloud)
- **Sécurité:** Patches critiques <48h

---

## 📧 Contact Support

### Pour les Clients

**Email Support:** support@magflow.com  
**Documentation:** docs.magflow.com  
**Status Page:** status.magflow.com

### Pour les Développeurs

**GitHub Issues:** https://github.com/Xprriacst/magflow/issues  
**API Docs:** api.magflow.com/docs

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2025-10-14  
**Auteur:** MagFlow Team
