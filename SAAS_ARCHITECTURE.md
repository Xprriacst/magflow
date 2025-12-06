# MagFlow Semi-SaaS Architecture

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUD                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Frontend   │    │   Backend    │    │   Supabase   │       │
│  │   (React)    │◄──►│  (Node.js)   │◄──►│  Auth + DB   │       │
│  │   Netlify    │    │   Railway    │    │              │       │
│  └──────────────┘    └──────┬───────┘    └──────────────┘       │
│                             │                                    │
│                        WebSocket                                 │
│                        (Socket.io)                               │
└─────────────────────────────┼───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     ▼                     │
        │  ┌──────────────────────────────────┐    │
        │  │     MagFlow Desktop Agent        │    │
        │  │        (Electron App)            │    │
        │  └──────────────┬───────────────────┘    │
        │                 │ AppleScript            │
        │                 ▼                         │
        │  ┌──────────────────────────────────┐    │
        │  │      Adobe InDesign Local        │    │
        │  └──────────────────────────────────┘    │
        │                                           │
        │            MACHINE UTILISATEUR            │
        └───────────────────────────────────────────┘
```

## Composants créés

### 1. Backend avec WebSocket (`magflow/backend/server.js`)
- Serveur Express.js avec Socket.io
- Gestion des agents connectés
- Envoi de jobs en temps réel

### 2. Desktop Agent (`magflow-agent/`)
- Application Electron
- Connexion WebSocket au backend
- Exécution des scripts InDesign
- Interface utilisateur minimaliste

### 3. Script de démarrage (`start-magflow.sh`)
- Lance tous les services localement

## Flux de données

1. **Utilisateur** → Crée un magazine sur l'app web
2. **Frontend** → Envoie la requête au Backend
3. **Backend** → Stocke le job + Notifie l'Agent via WebSocket
4. **Agent** → Reçoit le job, télécharge les assets
5. **Agent** → Exécute InDesign via AppleScript
6. **InDesign** → Génère le fichier .indd
7. **Agent** → Upload le fichier vers le cloud
8. **Utilisateur** → Télécharge son fichier

## Prochaines étapes

### Phase 1: Déploiement Cloud
- [ ] Déployer Frontend sur Netlify
- [ ] Déployer Backend sur Railway
- [ ] Configurer les variables d'environnement

### Phase 2: Authentification
- [ ] Intégrer Supabase Auth
- [ ] Ajouter login/signup au frontend
- [ ] Sécuriser les routes API

### Phase 3: Distribution Agent
- [ ] Builder l'app Electron pour macOS/Windows
- [ ] Créer un installateur
- [ ] Mettre en place l'auto-update

### Phase 4: Fonctionnalités avancées
- [ ] Queue de jobs (Redis/BullMQ)
- [ ] Notifications push
- [ ] Historique des générations
- [ ] Templates partagés entre utilisateurs

## Commandes utiles

```bash
# Démarrer tout localement
./start-magflow.sh

# Lancer l'agent en dev
cd magflow-agent && npm start

# Builder l'agent
cd magflow-agent && npm run build:mac

# Déployer frontend
cd magflow && netlify deploy --prod
```

## Configuration requise

### Variables d'environnement Backend
```
PORT=3001
NODE_ENV=production
SUPABASE_URL=xxx
SUPABASE_ANON_KEY=xxx
FLASK_API_URL=http://localhost:5003
FLASK_API_TOKEN=xxx
FRONTEND_URL=https://magflow-app.netlify.app
```

### Variables d'environnement Frontend
```
VITE_API_URL=https://magflow-backend.railway.app
VITE_SUPABASE_URL=xxx
VITE_SUPABASE_ANON_KEY=xxx
```
