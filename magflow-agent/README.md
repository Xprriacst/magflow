# MagFlow Desktop Agent

Application desktop qui connecte votre Adobe InDesign local au cloud MagFlow.

## Installation

### Prérequis
- Node.js 18+
- Adobe InDesign 2024/2025/2026
- Compte MagFlow

### Installation développeur

```bash
cd magflow-agent
npm install
npm start
```

### Build pour distribution

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

## Fonctionnement

1. **Lancez l'agent** sur votre machine
2. **Connectez-vous** avec votre compte MagFlow
3. **Créez vos magazines** sur l'app web MagFlow
4. **L'agent reçoit les jobs** automatiquement via WebSocket
5. **InDesign génère** le fichier localement
6. **Le fichier est uploadé** vers le cloud

## Architecture

```
┌─────────────────────┐
│   MagFlow Cloud     │
│   (Backend API)     │
└──────────┬──────────┘
           │ WebSocket
           ▼
┌─────────────────────┐
│  MagFlow Agent      │
│  (Cette app)        │
└──────────┬──────────┘
           │ AppleScript/JSX
           ▼
┌─────────────────────┐
│  Adobe InDesign     │
│  (Local)            │
└─────────────────────┘
```

## Configuration

L'agent stocke sa configuration dans:
- macOS: `~/Library/Application Support/magflow-agent/`
- Windows: `%APPDATA%/magflow-agent/`

## Dépannage

### InDesign non détecté
Vérifiez que InDesign est installé dans `/Applications` (macOS) ou `Program Files` (Windows).

### Connexion échouée
1. Vérifiez votre connexion internet
2. Vérifiez vos identifiants MagFlow
3. Redémarrez l'agent

## Licence

Propriétaire - MagFlow
