# MagFlow License Server

Serveur Express dédié à la gestion des licences MagFlow. Ce service reste indépendant de l'application principale et couvre la génération, l'activation, la validation, la désactivation et la consultation des licences ainsi que l'intégration Stripe.

## Démarrage rapide

```bash
cd license-server
npm install
cp .env.example .env
npm run dev
```

Le serveur écoute par défaut sur le port `3002`.

## Quick Start

### 1. Installation

```bash
cd license-server
npm install
cp .env.example .env
```

Renseignez ensuite `.env` avec vos clés Supabase (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`), le port d'écoute (`PORT`), une clé admin (`ADMIN_API_KEY`) ainsi que vos secrets Stripe et email si disponibles.

### 2. Initialisation Supabase

Dans le SQL Editor Supabase, exécutez le contenu de `database/schema.sql` pour créer les tables, index et la vue `license_stats`.

### 3. Lancement & Health check

```bash
npm run dev
curl http://localhost:3002/health
```

### 4. Tests automatisés

```bash
npm test
```

### 5. Exemples d'appels API

```bash
# POST /api/licenses/generate (admin)
curl -X POST http://localhost:3002/api/licenses/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -d '{"email":"test@example.com","plan":"monthly"}'

# POST /api/licenses/activate
curl -X POST http://localhost:3002/api/licenses/activate \
  -H "Content-Type: application/json" \
  -d '{
    "license_key":"MGFL-XXXX-XXXX-XXXX-XXXX",
    "hardware_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "device_info":{"os":"macOS","version":"14.5"}
  }'

# POST /api/licenses/validate
curl -X POST http://localhost:3002/api/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{
    "license_key":"MGFL-XXXX-XXXX-XXXX-XXXX",
    "hardware_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  }'

# POST /api/licenses/deactivate
curl -X POST http://localhost:3002/api/licenses/deactivate \
  -H "Content-Type: application/json" \
  -d '{
    "license_key":"MGFL-XXXX-XXXX-XXXX-XXXX",
    "hardware_id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  }'

# GET /api/licenses/status/:licenseKey
curl http://localhost:3002/api/licenses/status/MGFL-XXXX-XXXX-XXXX-XXXX
```

## Principales fonctionnalités

- **Gestion des licences** : génération, activation, validation, désactivation et statut.
- **Journalisation** : historique des validations et des activations machines.
- **Limitation de débit** : sécurisation de l'API via `express-rate-limit`.
- **Intégration Stripe** : création de sessions Checkout et gestion des webhooks.
- **Utilitaires crypto** : génération de clés, fingerprint machine, chiffrement symétrique.

## Structure

```
license-server/
├── server.js
├── routes/
│   ├── licenses.js
│   ├── activation.js
│   └── webhooks.js
├── services/
│   ├── keyGenerator.js
│   ├── hardwareValidator.js
│   ├── stripeService.js
│   └── emailService.js
├── database/
│   └── schema.sql
├── utils/
│   ├── encryption.js
│   └── supabaseClient.js
├── tests/
│   └── licenses.test.js
├── .env.example
├── package.json
└── README.md
```

## Endpoints

- `POST /api/licenses/generate`
- `POST /api/licenses/activate`
- `POST /api/licenses/validate`
- `POST /api/licenses/deactivate`
- `GET /api/licenses/status/:licenseKey`
- `POST /api/webhooks/stripe`

Les routes d'administration requièrent un header `Authorization: Bearer <ADMIN_API_KEY>`.

## Base de données

Le schéma SQL pour Supabase est disponible dans `database/schema.sql`. Exécuter le script pour initialiser les tables, index et la vue de statistiques.

## Tests

```bash
npm test
```

Les tests couvrent la génération de clés et la validation de format. Des tests d'API (via `supertest`) sont prêts à être complétés une fois qu'un environnement de base de données de test est disponible.
