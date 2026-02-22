# 👥 Instructions Dev 2 - Sprint 3.1 License Server

**Date:** 2025-10-15  
**Sprint:** 3.1 - Système de Licensing  
**Durée:** 3-4 jours  
**Branche:** `feature/sprint-3.1-license-server`

**🎯 TOTALEMENT INDÉPENDANT - Aucune dépendance avec l'app principale**

---

## 🎯 Ton Objectif

Créer un **système de licensing complet** pour monétiser MagFlow:
- API de gestion des licenses
- Base de données dédiée
- Génération de clés
- Validation hardware ID
- Interface d'activation

**C'est un projet SÉPARÉ** - Tu peux travailler en parallèle sans bloquer Dev 1.

---

## 📋 Architecture à Créer

```
license-server/                    # NOUVEAU projet
├── server.js                      # API Express
├── routes/
│   ├── licenses.js               # CRUD licenses
│   ├── activation.js             # Activation/validation
│   └── webhooks.js               # Stripe webhooks
├── services/
│   ├── keyGenerator.js           # Génération clés
│   ├── hardwareValidator.js      # Validation hardware
│   └── stripeService.js          # Paiements
├── database/
│   └── schema.sql                # Schéma Supabase
├── utils/
│   └── encryption.js             # Crypto utils
├── tests/
│   └── licenses.test.js          # Tests
├── .env.example
├── package.json
└── README.md
```

---

## 🗄️ Base de Données (Supabase)

### Schéma SQL à Créer

**Fichier:** `license-server/database/schema.sql`

```sql
-- Table des licenses
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_key VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL, -- 'monthly', 'annual', 'lifetime'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'expired', 'suspended'
  hardware_id VARCHAR(255), -- Machine ID (null tant que pas activé)
  max_activations INTEGER DEFAULT 1,
  current_activations INTEGER DEFAULT 0,
  
  -- Dates
  created_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP,
  expires_at TIMESTAMP,
  last_validated_at TIMESTAMP,
  
  -- Stripe
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_plan CHECK (plan IN ('monthly', 'annual', 'lifetime')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'expired', 'suspended', 'cancelled'))
);

-- Index pour performance
CREATE INDEX idx_licenses_email ON licenses(email);
CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_licenses_hardware ON licenses(hardware_id);
CREATE INDEX idx_licenses_status ON licenses(status);

-- Table des validations (logs)
CREATE TABLE license_validations (
  id SERIAL PRIMARY KEY,
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  validated_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  hardware_id VARCHAR(255),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_validations_license ON license_validations(license_id);
CREATE INDEX idx_validations_date ON license_validations(validated_at DESC);

-- Table des activations (historique)
CREATE TABLE license_activations (
  id SERIAL PRIMARY KEY,
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  hardware_id VARCHAR(255) NOT NULL,
  activated_at TIMESTAMP DEFAULT NOW(),
  deactivated_at TIMESTAMP,
  device_info JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'active'
);

-- Vue pour statistiques
CREATE VIEW license_stats AS
SELECT 
  plan,
  status,
  COUNT(*) as count,
  SUM(CASE WHEN activated_at IS NOT NULL THEN 1 ELSE 0 END) as activated_count,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400) as avg_age_days
FROM licenses
GROUP BY plan, status;
```

---

## 🔑 API Endpoints à Créer

### 1. **POST /api/licenses/generate**
Générer une nouvelle license (admin)

```javascript
// license-server/routes/licenses.js

router.post('/generate', requireAdmin, async (req, res) => {
  const { email, plan, expiresInDays } = req.body;
  
  // Valider
  if (!email || !plan) {
    return res.status(400).json({ error: 'Email et plan requis' });
  }
  
  // Générer clé unique
  const licenseKey = generateLicenseKey();
  
  // Calculer expiration
  const expiresAt = plan === 'lifetime' 
    ? null 
    : new Date(Date.now() + (expiresInDays || 30) * 24 * 60 * 60 * 1000);
  
  // Insérer en DB
  const { data, error } = await supabase
    .from('licenses')
    .insert({
      license_key: licenseKey,
      email,
      plan,
      status: 'pending',
      expires_at: expiresAt
    })
    .select()
    .single();
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  // Envoyer email
  await sendLicenseEmail(email, licenseKey);
  
  res.json({
    success: true,
    license: {
      key: licenseKey,
      email,
      plan,
      expires_at: expiresAt
    }
  });
});
```

---

### 2. **POST /api/licenses/activate**
Activer une license sur une machine

```javascript
// license-server/routes/activation.js

router.post('/activate', async (req, res) => {
  const { license_key, hardware_id, device_info } = req.body;
  
  // Valider input
  if (!license_key || !hardware_id) {
    return res.status(400).json({ 
      success: false,
      error: 'License key et hardware ID requis' 
    });
  }
  
  // Récupérer license
  const { data: license, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', license_key)
    .single();
  
  if (error || !license) {
    return res.status(404).json({ 
      success: false,
      error: 'License non trouvée' 
    });
  }
  
  // Vérifier statut
  if (license.status === 'expired') {
    return res.status(403).json({ 
      success: false,
      error: 'License expirée' 
    });
  }
  
  if (license.status === 'suspended') {
    return res.status(403).json({ 
      success: false,
      error: 'License suspendue' 
    });
  }
  
  // Vérifier nombre d'activations
  if (license.current_activations >= license.max_activations) {
    // Vérifier si déjà activé sur cette machine
    const { data: existing } = await supabase
      .from('license_activations')
      .select('*')
      .eq('license_id', license.id)
      .eq('hardware_id', hardware_id)
      .is('deactivated_at', null)
      .single();
    
    if (!existing) {
      return res.status(403).json({ 
        success: false,
        error: 'Nombre maximum d\'activations atteint' 
      });
    }
  }
  
  // Activer
  const { error: activationError } = await supabase
    .from('license_activations')
    .insert({
      license_id: license.id,
      hardware_id,
      device_info: device_info || {}
    });
  
  if (activationError) {
    return res.status(500).json({ 
      success: false,
      error: activationError.message 
    });
  }
  
  // Mettre à jour license
  await supabase
    .from('licenses')
    .update({
      hardware_id,
      status: 'active',
      activated_at: new Date().toISOString(),
      current_activations: license.current_activations + 1
    })
    .eq('id', license.id);
  
  res.json({
    success: true,
    message: 'License activée avec succès',
    license: {
      plan: license.plan,
      expires_at: license.expires_at,
      activated_at: new Date().toISOString()
    }
  });
});
```

---

### 3. **POST /api/licenses/validate**
Valider une license (appelé au démarrage app)

```javascript
router.post('/validate', async (req, res) => {
  const { license_key, hardware_id } = req.body;
  
  if (!license_key || !hardware_id) {
    return res.status(400).json({ 
      valid: false,
      error: 'License key et hardware ID requis' 
    });
  }
  
  // Récupérer license
  const { data: license } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', license_key)
    .single();
  
  if (!license) {
    await logValidation(null, false, 'License non trouvée');
    return res.json({ valid: false, error: 'License invalide' });
  }
  
  // Vérifier hardware_id
  if (license.hardware_id && license.hardware_id !== hardware_id) {
    await logValidation(license.id, false, 'Hardware ID mismatch');
    return res.json({ valid: false, error: 'License liée à une autre machine' });
  }
  
  // Vérifier expiration
  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    await supabase
      .from('licenses')
      .update({ status: 'expired' })
      .eq('id', license.id);
    
    await logValidation(license.id, false, 'License expirée');
    return res.json({ valid: false, error: 'License expirée' });
  }
  
  // Vérifier statut
  if (license.status !== 'active') {
    await logValidation(license.id, false, `Statut: ${license.status}`);
    return res.json({ valid: false, error: `License ${license.status}` });
  }
  
  // Tout OK
  await supabase
    .from('licenses')
    .update({ last_validated_at: new Date().toISOString() })
    .eq('id', license.id);
  
  await logValidation(license.id, true);
  
  res.json({
    valid: true,
    license: {
      plan: license.plan,
      expires_at: license.expires_at,
      email: license.email
    }
  });
});

async function logValidation(licenseId, success, errorMessage = null) {
  if (licenseId) {
    await supabase
      .from('license_validations')
      .insert({
        license_id: licenseId,
        success,
        error_message: errorMessage
      });
  }
}
```

---

### 4. **POST /api/licenses/deactivate**
Désactiver une license (changement de machine)

```javascript
router.post('/deactivate', async (req, res) => {
  const { license_key, hardware_id } = req.body;
  
  // Récupérer license
  const { data: license } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', license_key)
    .single();
  
  if (!license) {
    return res.status(404).json({ 
      success: false,
      error: 'License non trouvée' 
    });
  }
  
  // Désactiver l'activation
  await supabase
    .from('license_activations')
    .update({ 
      deactivated_at: new Date().toISOString(),
      status: 'deactivated'
    })
    .eq('license_id', license.id)
    .eq('hardware_id', hardware_id)
    .is('deactivated_at', null);
  
  // Mettre à jour compteur
  await supabase
    .from('licenses')
    .update({
      current_activations: Math.max(0, license.current_activations - 1),
      hardware_id: null
    })
    .eq('id', license.id);
  
  res.json({
    success: true,
    message: 'License désactivée, vous pouvez l\'activer sur une nouvelle machine'
  });
});
```

---

### 5. **GET /api/licenses/status/:licenseKey**
Obtenir le statut d'une license

```javascript
router.get('/status/:licenseKey', async (req, res) => {
  const { licenseKey } = req.params;
  
  const { data: license } = await supabase
    .from('licenses')
    .select(`
      *,
      activations:license_activations(
        hardware_id,
        activated_at,
        deactivated_at,
        device_info
      )
    `)
    .eq('license_key', licenseKey)
    .single();
  
  if (!license) {
    return res.status(404).json({ error: 'License non trouvée' });
  }
  
  res.json({
    license: {
      key: license.license_key,
      email: license.email,
      plan: license.plan,
      status: license.status,
      created_at: license.created_at,
      activated_at: license.activated_at,
      expires_at: license.expires_at,
      activations: license.activations.filter(a => !a.deactivated_at),
      max_activations: license.max_activations
    }
  });
});
```

---

## 🔐 Génération de Clés

**Fichier:** `license-server/services/keyGenerator.js`

```javascript
import crypto from 'crypto';

/**
 * Génère une clé de license unique
 * Format: MGFL-XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey() {
  const prefix = 'MGFL'; // MagFlow
  const segments = [];
  
  // Générer 4 segments de 4 caractères
  for (let i = 0; i < 4; i++) {
    const segment = crypto
      .randomBytes(2)
      .toString('hex')
      .toUpperCase();
    segments.push(segment);
  }
  
  return `${prefix}-${segments.join('-')}`;
  // Exemple: MGFL-A3F2-8D4C-9E1B-7F6A
}

/**
 * Valide le format d'une clé de license
 */
export function validateLicenseKeyFormat(key) {
  const pattern = /^MGFL-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/;
  return pattern.test(key);
}

/**
 * Génère un checksum pour validation offline
 */
export function generateChecksum(licenseKey, hardwareId) {
  const data = `${licenseKey}:${hardwareId}`;
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
    .substring(0, 16);
}
```

---

## 🖥️ Validation Hardware ID

**Fichier:** `license-server/services/hardwareValidator.js`

```javascript
import crypto from 'crypto';

/**
 * Génère un hardware ID unique basé sur les infos machine
 * À implémenter côté client (Electron)
 */
export function generateHardwareId(deviceInfo) {
  // deviceInfo contient: uuid, cpu, mac, hostname
  const fingerprint = `${deviceInfo.uuid}-${deviceInfo.cpu}-${deviceInfo.mac}`;
  
  return crypto
    .createHash('sha256')
    .update(fingerprint)
    .digest('hex');
}

/**
 * Valide qu'un hardware ID est valide
 */
export function validateHardwareId(hardwareId) {
  // Doit être un hash SHA256 (64 caractères hex)
  const pattern = /^[0-9a-f]{64}$/;
  return pattern.test(hardwareId);
}

/**
 * Compare deux hardware IDs
 */
export function compareHardwareIds(id1, id2) {
  if (!id1 || !id2) return false;
  return id1.toLowerCase() === id2.toLowerCase();
}
```

---

## 💳 Intégration Stripe (Bonus)

**Fichier:** `license-server/services/stripeService.js`

```javascript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Créer une session de paiement
 */
export async function createCheckoutSession(email, plan) {
  const prices = {
    monthly: process.env.STRIPE_PRICE_MONTHLY,
    annual: process.env.STRIPE_PRICE_ANNUAL,
    lifetime: process.env.STRIPE_PRICE_LIFETIME
  };
  
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    payment_method_types: ['card'],
    line_items: [{
      price: prices[plan],
      quantity: 1
    }],
    mode: plan === 'lifetime' ? 'payment' : 'subscription',
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing`
  });
  
  return session;
}

/**
 * Webhook Stripe (nouveau paiement)
 */
export async function handleStripeWebhook(event) {
  switch (event.type) {
    case 'checkout.session.completed':
      // Générer et envoyer license
      const session = event.data.object;
      await generateAndSendLicense(
        session.customer_email,
        session.metadata.plan
      );
      break;
      
    case 'customer.subscription.deleted':
      // Désactiver license
      const subscription = event.data.object;
      await deactivateLicense(subscription.id);
      break;
  }
}
```

---

## 🧪 Tests à Créer

**Fichier:** `license-server/tests/licenses.test.js`

```javascript
import { describe, it, expect } from 'vitest';
import { generateLicenseKey, validateLicenseKeyFormat } from '../services/keyGenerator.js';

describe('License Key Generation', () => {
  it('génère une clé au bon format', () => {
    const key = generateLicenseKey();
    expect(key).toMatch(/^MGFL-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
  });
  
  it('génère des clés uniques', () => {
    const keys = new Set();
    for (let i = 0; i < 1000; i++) {
      keys.add(generateLicenseKey());
    }
    expect(keys.size).toBe(1000);
  });
  
  it('valide le format correctement', () => {
    expect(validateLicenseKeyFormat('MGFL-A3F2-8D4C-9E1B-7F6A')).toBe(true);
    expect(validateLicenseKeyFormat('INVALID-KEY')).toBe(false);
  });
});

describe('License Activation', () => {
  it('active une license valide', async () => {
    // Test avec API
  });
  
  it('rejette une license expirée', async () => {
    // Test avec API
  });
  
  it('limite le nombre d\'activations', async () => {
    // Test avec API
  });
});
```

---

## 📦 package.json

```json
{
  "name": "magflow-license-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.4",
    "express": "^4.21.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "stripe": "^14.0.0",
    "helmet": "^7.0.0",
    "express-rate-limit": "^7.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.7",
    "vitest": "^2.1.4",
    "supertest": "^7.0.0"
  }
}
```

---

## 🔧 Configuration

**Fichier:** `.env.example`

```bash
# Port
PORT=3002

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_ANNUAL=price_...
STRIPE_PRICE_LIFETIME=price_...

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Admin Auth (simple pour v1)
ADMIN_API_KEY=your_admin_key_here

# Email (SendGrid ou autre)
EMAIL_API_KEY=your_email_key
EMAIL_FROM=licenses@magflow.app
```

---

## ✅ Checklist de Réalisation

### Jour 1 (Mer)
- [ ] Créer projet `license-server/`
- [ ] Setup Express + Supabase
- [ ] Créer schéma DB (schema.sql)
- [ ] Implémenter keyGenerator.js
- [ ] Implémenter hardwareValidator.js
- [ ] Tests unitaires génération clés

### Jour 2 (Jeu)
- [ ] Route POST /api/licenses/generate
- [ ] Route POST /api/licenses/activate
- [ ] Route POST /api/licenses/validate
- [ ] Route POST /api/licenses/deactivate
- [ ] Route GET /api/licenses/status/:key
- [ ] Tests API

### Jour 3 (Ven)
- [ ] Intégration Stripe (checkout)
- [ ] Webhook Stripe
- [ ] Rate limiting
- [ ] Logging
- [ ] Documentation API
- [ ] Tests complets

### Jour 4 (Lun) - Bonus
- [ ] Dashboard admin (liste licenses)
- [ ] Statistiques
- [ ] Export CSV
- [ ] Email automatique

---

## 🧪 Tests Manuels

```bash
# 1. Démarrer le serveur
cd license-server
npm install
npm run dev

# 2. Générer une license
curl -X POST http://localhost:3002/api/licenses/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -d '{"email":"test@example.com","plan":"monthly"}'

# 3. Activer
curl -X POST http://localhost:3002/api/licenses/activate \
  -H "Content-Type: application/json" \
  -d '{
    "license_key":"MGFL-A3F2-8D4C-9E1B-7F6A",
    "hardware_id":"abc123"
  }'

# 4. Valider
curl -X POST http://localhost:3002/api/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{
    "license_key":"MGFL-A3F2-8D4C-9E1B-7F6A",
    "hardware_id":"abc123"
  }'

# 5. Statut
curl http://localhost:3002/api/licenses/status/MGFL-A3F2-8D4C-9E1B-7F6A
```

---

## 🎯 Critères de Succès

- [ ] API license server fonctionnelle (5 routes)
- [ ] Base de données configurée (3 tables)
- [ ] Génération clés unique
- [ ] Validation hardware ID
- [ ] Tests passent (>80% coverage)
- [ ] Documentation API complète
- [ ] Prêt pour intégration Stripe

---

## 📚 Ressources

- [Stripe Checkout](https://stripe.com/docs/checkout)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Express Rate Limiting](https://www.npmjs.com/package/express-rate-limit)

---

## 🔄 Intégration Future (Semaine 4)

Une fois ton travail terminé, on intégrera le license server avec:
- L'app Electron (validation au démarrage)
- Le frontend (page activation)
- Stripe (paiements)

Mais pour l'instant, tu es **100% indépendant** !

---

**Bon dev ! C'est un projet cool et bien délimité ! 🚀**
