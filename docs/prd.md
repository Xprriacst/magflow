# MagFlow Brownfield Enhancement PRD

**Session Date:** 2026-01-09
**Facilitator:** Product Manager John
**Participant:** Alexandre Errasti

---

## Executive Summary

**Topic:** Multi-User SaaS Freemium Transformation

**Session Goals:** Transform MagFlow from a single-user prototype into a commercializable SaaS with freemium model, Stripe integration, and admin panel.

**Project Version:** 1.0.0-beta → 2.0.0

**Total Stories:** 14 stories spanning 4 sprints (~4 weeks)

**Key Themes Identified:**
- Multi-user authentication and data isolation
- Freemium business model with usage limits
- Payment processing via Stripe
- Admin tooling for user management
- Backward compatibility with existing architecture

---

# Section 1: Intro Project Analysis and Context

## Analysis Source

**IDE-based fresh analysis completed** + Comprehensive existing documentation available

Key documents analyzed:
- START_HERE.md - Setup et corrections
- PROJECT_STATUS.md - État actuel (80% complété)
- ROADMAP_V1_STRATEGIE.md - Vision produit
- Exploration technique complète du code (Mary + Winston)

## Existing Project Overview

### Current Project State

**MagFlow** est une application SaaS permettant aux éditeurs de presse d'automatiser la mise en page de leurs magazines via InDesign.

**Architecture actuelle:**
```
React Web App (Vite + Supabase Auth)
    ↓ HTTPS
Node.js Backend (Express + OpenAI GPT-4o)
    ↓
├─→ Flask API (Python ExtendScript)
│       ↓
│   InDesign (Cloud/Local)
│
└─→ Electron Desktop Agent (WebSocket)
        ↓
    InDesign (Local Machine)
```

**Statut:** 80% fonctionnel
- ✅ Backend API complet (8 endpoints)
- ✅ Analyse IA (OpenAI GPT-4o)
- ✅ 3 templates InDesign
- ✅ Génération de magazines testée
- 🔄 Frontend en cours d'intégration
- ⏳ Pas de système auth multi-user
- ⏳ Pas de monétisation (Stripe)
- ⏳ Pas d'admin panel

## Available Documentation Analysis

**Using existing project analysis:**
- ✅ Tech Stack Documentation
- ✅ Source Tree/Architecture
- ✅ API Documentation
- ✅ External API Documentation
- ✅ Technical Debt Documentation

All key technical documentation exists from previous development sessions.

## Enhancement Scope Definition

### Enhancement Type
- ☑️ New Feature Addition
- ☑️ Integration with New Systems

### Enhancement Description

Transformation de l'application d'un prototype single-user vers un SaaS multi-tenant avec freemium model, incluant:
- Système d'authentification multi-utilisateur (Supabase Auth)
- Intégration paiement Stripe (freemium → pro)
- Admin panel pour gestion users et templates
- Templates privés par utilisateur
- Usage tracking et limits mensuels

### Impact Assessment
☑️ **Significant Impact** (substantial existing code changes + new modules)

## Goals and Background Context

### Goals
- Transformer MagFlow en SaaS commercialisable avec modèle freemium
- Permettre à chaque éditeur d'avoir son compte individuel avec templates privés
- Générer des revenus via Stripe (5 générations/mois gratuit, puis abonnement payant)
- Offrir un admin panel pour gérer les utilisateurs et configurer leurs templates
- Maintenir time-to-market rapide (architecture optimisée existante conservée)

### Background Context

MagFlow fonctionne actuellement comme POC sans gestion d'utilisateurs ni monétisation. Pour commercialiser le produit auprès d'éditeurs de presse, il est critique d'ajouter:

1. Auth sécurisée pour protéger les contenus éditoriaux sensibles
2. Modèle freemium pour acquisition client (essai gratuit → conversion payante)
3. Admin dashboard pour support client et configuration personnalisée
4. Isolation des données (templates et générations privés par user)

Cette enhancement s'inscrit dans l'architecture technique optimisée recommandée par Winston (simplification Agent Electron, ajout BullMQ, élimination Flask redondant).

## Change Log

| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|---------|
| Initial PRD | 2026-01-09 | 0.1 | Création PRD brownfield pour enhancement freemium + multi-user | John (PM) |

---

# Section 2: Requirements

## Functional Requirements

**FR1:** Le système doit permettre à un utilisateur de créer un compte individuel avec email/mot de passe via Supabase Auth

**FR2:** Chaque utilisateur doit pouvoir uploader et gérer ses propres templates InDesign privés (non visibles par les autres utilisateurs)

**FR3:** Le système doit implémenter un modèle freemium avec limite de 5 générations/mois pour les utilisateurs gratuits

**FR4:** Les utilisateurs doivent pouvoir upgrader vers un plan Pro (générations illimitées) via Stripe Checkout

**FR5:** Le système doit tracker automatiquement le nombre de générations mensuelles par utilisateur et bloquer après la limite (utilisateurs free)

**FR6:** Un admin panel doit permettre à l'administrateur (vous) de:
  - Voir la liste de tous les utilisateurs avec leurs statistiques (plan, générations utilisées, date d'inscription)
  - Configurer/uploader des templates pour un utilisateur spécifique
  - Modifier manuellement le plan d'un utilisateur (free ↔ pro)
  - Voir l'historique des générations par utilisateur

**FR7:** Le système doit synchroniser automatiquement le statut d'abonnement Stripe via webhooks (activation, renouvellement, annulation)

**FR8:** Les templates et générations doivent être isolés par utilisateur (Row Level Security Supabase)

**FR9:** L'application doit afficher clairement à l'utilisateur son usage mensuel (ex: "3/5 générations utilisées ce mois")

**FR10:** Le système doit réinitialiser automatiquement le compteur de générations le 1er de chaque mois

**FR11:** L'authentification existante doit être remplacée par Supabase Auth avec sessions persistantes

**FR12:** Le backend doit valider que l'utilisateur a le droit de générer avant d'appeler InDesign (check limite + abonnement actif)

## Non-Functional Requirements

**NFR1:** Le système doit maintenir les performances actuelles de génération InDesign (~45s) malgré l'ajout des vérifications auth/usage

**NFR2:** Les données utilisateur (emails, paiements, contenus) doivent être stockées de manière sécurisée avec encryption at rest (Supabase)

**NFR3:** L'admin panel doit charger la liste des utilisateurs en moins de 2 secondes (avec pagination si >100 users)

**NFR4:** Le système doit gérer la montée en charge jusqu'à 100 utilisateurs simultanés sans dégradation (objectif court terme)

**NFR5:** Les webhooks Stripe doivent être idempotents (retry-safe) pour éviter les doubles facturation/activation

**NFR6:** Le code doit maintenir la structure existante du projet (pas de refonte complète) pour minimiser le time-to-market

**NFR7:** Toutes les API keys (Stripe, OpenAI, Supabase) doivent rester en variables d'environnement (jamais en dur)

**NFR8:** Le système doit logger tous les événements critiques (inscription, paiement, génération, erreurs) pour debugging

**NFR9:** L'interface utilisateur doit rester responsive et fonctionner sur desktop (priorité) et tablettes

**NFR10:** Le schéma de base de données doit supporter la migration depuis les données existantes sans perte

## Compatibility Requirements

**CR1: API Compatibility** - Les endpoints existants (`/api/content/analyze`, `/api/templates`, `/api/magazine/generate`) doivent continuer à fonctionner avec ajout de l'authentification (pas de breaking changes pour les tests existants)

**CR2: Database Schema Compatibility** - Les tables existantes (`indesign_templates`, `magazine_generations`) doivent être étendues (ajout colonnes `user_id`) mais pas supprimées, pour permettre migration des données de test existantes

**CR3: UI/UX Consistency** - Les pages existantes (SmartContentCreator, TemplateGallery, ProcessingStatus) doivent conserver leur design Tailwind actuel, avec ajout seamless des éléments auth/usage tracking

**CR4: Integration Compatibility** - L'intégration InDesign existante (Flask API + Electron Agent) doit rester inchangée côté génération, seule la couche orchestration backend est modifiée pour ajouter les vérifications

---

# Section 3: User Interface Enhancement Goals

## Integration with Existing UI

MagFlow utilise actuellement:
- **Design System:** Tailwind CSS avec composants custom
- **Navigation:** Pages distinctes (Dashboard, SmartContentCreator, TemplateGallery, ProcessingStatus)
- **State Management:** Redux Toolkit
- **Style:** Interface moderne, épurée, focus éditorial

**Principes d'intégration:**
1. **Cohérence visuelle:** Tous les nouveaux composants (login, usage badge, admin panel) utiliseront les mêmes classes Tailwind et palette de couleurs existante
2. **Navigation fluide:** Ajout de routes protégées via React Router avec redirection automatique si non authentifié
3. **Composants réutilisables:** Création de composants auth réutilisables (`<ProtectedRoute>`, `<UsageBadge>`, `<UpgradePrompt>`)
4. **Progressive enhancement:** Les utilisateurs existants (s'il y en a) verront une migration guidée vers le nouveau système auth

## Modified/New Screens and Views

### Écrans Nouveaux

**Login/Signup Page** (`/login`, `/signup`)
- Formulaire email/password avec validation
- Lien "Mot de passe oublié"
- Indication plan gratuit (5 générations/mois)
- Design épuré, centré, avec illustration éditoriale

**Admin Dashboard** (`/admin`)
- **Restricted:** Accessible uniquement avec role='admin' en DB
- **Sections:**
  - Users List (table avec: email, plan, générations ce mois, date inscription)
  - User Detail Modal (stats détaillées + historique générations)
  - Template Upload pour user spécifique
  - Actions: Change plan, Reset quota, View logs
- **Design:** Table responsive avec filtres/recherche

**Account Settings** (`/account`)
- Profile info (email, company name)
- Current plan avec usage mensuel
- Bouton "Upgrade to Pro" (si free)
- Bouton "Manage Subscription" (si pro) → Stripe Portal
- Historique des générations

**Upgrade/Pricing Page** (`/upgrade`)
- Comparaison Free vs Pro
- Bouton Stripe Checkout
- FAQ pricing

### Écrans Modifiés

**Dashboard** (page d'accueil après login)
- **Ajout:** Banner en haut avec usage mensuel
  - Exemple: "✅ 3/5 générations utilisées ce mois" (free)
  - Exemple: "🚀 Plan Pro - Générations illimitées" (pro)
- **Ajout:** Si proche de la limite (4/5), afficher CTA "Upgrade to Pro"

**SmartContentCreator** (page de création)
- **Ajout:** Vérification avant génération
  - Si limite atteinte → Modal "Limite atteinte, upgrade to Pro?"
  - Si OK → Procéder normalement
- **Ajout:** Badge discret "X générations restantes ce mois" dans header

**TemplateGallery** (sélection template)
- **Modification:** Afficher uniquement les templates de l'utilisateur connecté
- **Ajout:** Bouton "Upload your template" (pour utilisateurs avancés)
- **Maintien:** Design grid actuel préservé

**Navigation/Header** (global)
- **Ajout:** Dropdown user menu (en haut à droite)
  - Mon compte
  - Mes générations
  - Upgrade to Pro (si free)
  - Admin (si role admin)
  - Logout
- **Ajout:** Usage badge visible globalement (optionnel)

## UI Consistency Requirements

**UC1:** Tous les formulaires (login, signup, admin) doivent utiliser les mêmes composants de form validation que les formulaires existants (react-hook-form si présent, ou validation manuelle cohérente)

**UC2:** Les modals (upgrade prompt, limite atteinte, admin actions) doivent utiliser le même système de modal que l'application existante (vérifier si HeadlessUI ou autre lib est utilisée)

**UC3:** Les couleurs de status doivent être cohérentes:
- Free plan → Couleur neutre (gray/blue)
- Pro plan → Couleur premium (gold/purple)
- Limite proche → Warning (orange)
- Limite atteinte → Error (red)

**UC4:** Le loading state pendant vérification auth/Stripe doit utiliser les mêmes spinners/skeletons que les loading states existants (génération InDesign)

**UC5:** Les messages d'erreur (auth failed, payment failed, limite atteinte) doivent suivre le même pattern de toast/notification que les erreurs existantes

**UC6:** L'admin panel, bien que nouveau, doit respecter la hiérarchie typographique et l'espacement du reste de l'app (même font-family, heading sizes, padding/margin)

**UC7:** Responsive: Les nouveaux écrans doivent être mobile-friendly même si l'usage principal est desktop (déjà le cas de l'app existante selon config Tailwind)

---

# Section 4: Technical Constraints and Integration Requirements

## Existing Technology Stack

**Languages:**
- JavaScript/Node.js 20.x (Backend)
- Python 3.9+ (Flask API)
- ExtendScript/JSX (InDesign automation)
- JavaScript ES6+ (Frontend)

**Frameworks:**
- **Frontend:** React 18.2, Vite 5.0, Redux Toolkit, React Router v6
- **Backend:** Express.js 4.x, Socket.io (WebSocket)
- **Desktop:** Electron 28.x (Agent)
- **Python:** Flask 3.x

**Database:**
- Supabase PostgreSQL (hosted)
- Supabase Auth (authentication provider)
- Supabase Storage (file uploads - images)

**Infrastructure:**
- **Hosting:** Render.com (backend + Flask API)
- **Frontend:** Netlify/Vercel
- **Version Control:** Git + GitHub

**External Dependencies:**
- OpenAI API (GPT-4o) - Content analysis
- Stripe API - Payment processing
- Supabase SDK - Database + Auth + Storage
- Adobe InDesign (local installation requise)

**Key Libraries:**
- Tailwind CSS (styling)
- Axios (HTTP client)
- Multer (file uploads)
- BullMQ (queue system - à ajouter)
- electron-store (desktop config)
- electron-updater (auto-update - à ajouter)

## Integration Approach

### Database Integration Strategy

**Approche: Extension progressive du schéma existant**

```sql
-- Tables existantes à étendre:
ALTER TABLE indesign_templates
  ADD COLUMN user_id UUID REFERENCES auth.users(id);

ALTER TABLE magazine_generations
  ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Nouvelles tables:
CREATE TABLE profiles (...)
CREATE TABLE subscriptions (...)
CREATE TABLE usage_logs (...)
```

**Migration:**
1. Créer nouveau schéma v2 avec toutes les tables
2. Migrer données de test existantes vers user admin par défaut
3. Activer Row Level Security (RLS) sur toutes les tables
4. Policies RLS: `user_id = auth.uid()` pour isolation

**Backup:** Export SQL avant migration

### API Integration Strategy

**Approche: Middleware auth + usage validation**

```javascript
// Nouvelle architecture endpoints:
// AVANT: POST /api/magazine/generate (pas d'auth)
// APRÈS: POST /api/magazine/generate (avec middleware auth + usage check)

// Middleware stack:
app.use('/api', [
  requireAuth,        // Vérifie JWT Supabase
  checkUsageLimit,    // Vérifie quota mensuel
  validateSubscription // Vérifie plan actif si nécessaire
]);
```

**Endpoints à ajouter:**
- `POST /api/auth/signup` - Proxy Supabase Auth
- `POST /api/auth/login` - Proxy Supabase Auth
- `GET /api/user/usage` - Stats usage mensuel
- `POST /api/stripe/create-checkout` - Créer session Stripe
- `POST /api/stripe/webhook` - Recevoir events Stripe
- `GET /api/admin/users` - Liste users (admin only)
- `PATCH /api/admin/users/:id` - Modifier user (admin only)

**Compatibilité:** Endpoints existants gardent leur signature, ajout middleware transparent

### Frontend Integration Strategy

**Approche: Protected Routes + Auth Context**

```jsx
// App.jsx structure:
<AuthProvider>
  <Router>
    <PublicRoute path="/login" component={Login} />
    <PublicRoute path="/signup" component={Signup} />

    <ProtectedRoute path="/" component={Dashboard} />
    <ProtectedRoute path="/create" component={SmartContentCreator} />
    <ProtectedRoute path="/templates" component={TemplateGallery} />

    <AdminRoute path="/admin" component={AdminDashboard} />
  </Router>
</AuthProvider>
```

**State Management:**
- Redux slice: `authSlice` (user, session, isAuthenticated)
- Redux slice: `usageSlice` (monthly count, limit, plan)
- Persist avec `redux-persist` dans localStorage

**API Client:**
- Axios interceptor pour injecter JWT dans headers
- Automatic refresh token si 401

### Testing Integration Strategy

**Approche: Tests existants + nouveaux tests auth**

**Tests E2E (Playwright):**
- Ajouter fixture `authenticatedUser` pour tests protégés
- Tester flow complet: signup → create magazine → upgrade → generate illimité
- Mock Stripe en mode test

**Tests Backend (Vitest):**
- Unit tests: middleware auth, usage validation, Stripe webhook handlers
- Integration tests: endpoints avec différents rôles (free, pro, admin)

**Tests Frontend (Vitest + React Testing Library):**
- Protected routes redirect correctement
- Usage badge affiche bon quota
- Upgrade modal apparaît quand limite atteinte

## Code Organization and Standards

**File Structure Approach:**

```
magflow0312/
├── backend/
│   ├── middleware/
│   │   ├── auth.js           # NEW: JWT validation
│   │   ├── usage.js          # NEW: Usage limit check
│   │   └── admin.js          # NEW: Admin role check
│   ├── routes/
│   │   ├── auth.js           # NEW: Auth endpoints
│   │   ├── stripe.js         # NEW: Stripe integration
│   │   ├── admin.js          # NEW: Admin endpoints
│   │   ├── user.js           # NEW: User profile/usage
│   │   └── [existing routes] # MODIFIED: Add middleware
│   ├── services/
│   │   ├── stripeService.js  # NEW: Stripe SDK wrapper
│   │   └── usageService.js   # NEW: Usage tracking logic
│   ├── supabase-schema-v2.sql # NEW: Complete schema
│   └── migrations/
│       └── 001_add_multiuser.sql # NEW: Migration script
│
├── src/
│   ├── contexts/
│   │   └── AuthContext.jsx   # NEW: Auth provider
│   ├── hooks/
│   │   ├── useAuth.js        # NEW: Auth hook
│   │   └── useUsage.js       # NEW: Usage hook
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx     # NEW
│   │   │   └── Signup.jsx    # NEW
│   │   ├── admin/
│   │   │   └── Dashboard.jsx # NEW
│   │   ├── account/
│   │   │   └── Settings.jsx  # NEW
│   │   └── upgrade/
│   │       └── Pricing.jsx   # NEW
│   ├── components/
│   │   ├── ProtectedRoute.jsx # NEW
│   │   ├── UsageBadge.jsx     # NEW
│   │   └── UpgradeModal.jsx   # NEW
│   └── store/
│       ├── authSlice.js       # NEW
│       └── usageSlice.js      # NEW
```

**Naming Conventions:**
- Components: PascalCase (`ProtectedRoute.jsx`)
- Hooks: camelCase with `use` prefix (`useAuth.js`)
- Services: camelCase with `Service` suffix (`stripeService.js`)
- Routes: kebab-case URLs (`/api/stripe/webhook`)
- DB tables: snake_case (`usage_logs`)

**Coding Standards:**
- ESLint + Prettier (config existante préservée)
- Async/await (pas de callbacks)
- Error handling: try/catch avec logger centralisé
- Env variables: `.env` jamais committé, `.env.example` documenté

**Documentation Standards:**
- JSDoc pour fonctions publiques
- README.md par module (backend, frontend, agent)
- API endpoints documentés dans `API.md`
- Schéma DB documenté avec diagrams dans `DATABASE.md`

## Deployment and Operations

**Build Process Integration:**

```json
// package.json scripts (backend)
{
  "start": "node server.js",
  "dev": "nodemon server.js",
  "migrate": "node migrations/run.js",
  "test": "vitest"
}

// package.json scripts (frontend)
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "test": "vitest"
}
```

**Deployment Strategy:**

**Backend (Render.com):**
- Service type: Web Service
- Build command: `cd backend && npm install`
- Start command: `npm start`
- Environment variables:
  ```
  NODE_ENV=production
  SUPABASE_URL=https://...
  SUPABASE_SERVICE_KEY=***
  OPENAI_API_KEY=***
  STRIPE_SECRET_KEY=***
  STRIPE_WEBHOOK_SECRET=***
  FLASK_API_URL=https://magflow-flask.onrender.com
  ```

**Frontend (Netlify):**
- Build command: `npm run build`
- Publish directory: `dist`
- Redirects: `/* /index.html 200` (SPA)
- Environment variables:
  ```
  VITE_SUPABASE_URL=https://...
  VITE_SUPABASE_ANON_KEY=***
  VITE_API_URL=https://magflow-backend.onrender.com
  VITE_STRIPE_PUBLISHABLE_KEY=pk_live_***
  ```

**Flask API (Render.com):**
- Service type: Web Service
- Root directory: `flask-api`
- Build: `pip install -r requirements.txt`
- Start: `gunicorn app:app`

**Database (Supabase):**
- Hosted, pas de déploiement manuel
- Migrations via Dashboard SQL Editor ou CLI

**Monitoring and Logging:**

**Logging:**
- Backend: Winston logger avec niveaux (error, warn, info, debug)
- Logs persistés dans fichiers rotatifs (50MB max)
- Errors critiques → Email/Slack notification (optionnel)

**Monitoring:**
- Render.com metrics (CPU, RAM, response time)
- Supabase dashboard (DB queries, connections)
- Stripe dashboard (payments, webhooks status)
- Custom: `/api/health` endpoint avec status DB + APIs externes

**Metrics to track:**
- Signup conversion rate (visits → signups)
- Free → Pro conversion rate
- Average generations per user
- InDesign generation success rate
- API response times (p50, p95, p99)

**Configuration Management:**

```
Environment Tiers:
├── Development (local)
│   ├── .env.local
│   └── Supabase project: Dev
├── Staging (Render)
│   ├── Environment vars via Dashboard
│   └── Supabase project: Staging
└── Production (Render)
    ├── Environment vars via Dashboard
    └── Supabase project: Production
```

**Secrets rotation:**
- API keys rotation tous les 90 jours
- Stripe webhook secrets après chaque changement
- Database passwords via Supabase auto-rotation

## Risk Assessment and Mitigation

**Technical Risks:**

**T-RISK-1: Stripe webhook reliability**
- **Risk:** Webhooks peuvent échouer (timeout, downtime serveur), causant désync subscription
- **Mitigation:**
  - Implémenter idempotency keys
  - Retry logic côté Stripe (automatique)
  - Fallback: Cron job quotidien qui sync via Stripe API
  - Logging exhaustif des webhook events

**T-RISK-2: Usage limit bypass**
- **Risk:** User contourne limite via manipulation client ou multiples comptes
- **Mitigation:**
  - Validation backend uniquement (jamais confiance frontend)
  - Rate limiting par IP (10 req/min)
  - Monitoring comptes suspects (multiples signups même IP/jour)

**T-RISK-3: Migration données existantes**
- **Risk:** Perte de templates/générations lors migration DB
- **Mitigation:**
  - Backup SQL complet avant migration
  - Migration script avec validation (row count before/after)
  - Rollback plan documenté
  - Test migration sur copie DB d'abord

**Integration Risks:**

**I-RISK-1: Supabase Auth breaking changes**
- **Risk:** Update Supabase SDK casse l'auth
- **Mitigation:**
  - Pin versions exactes dans package.json
  - Tests E2E auth dans CI/CD
  - Lire changelogs avant update

**I-RISK-2: InDesign automation incompatibilité versions**
- **Risk:** Nouveaux users ont InDesign version incompatible avec scripts
- **Mitigation:**
  - Documenter versions supportées (InDesign 2022-2025)
  - Version check dans Agent au démarrage
  - Fallback: Cloud InDesign Server (futur)

**I-RISK-3: OpenAI rate limits dépassés**
- **Risk:** Trop de générations simultanées → 429 errors
- **Mitigation:**
  - BullMQ queue pour lisser les requêtes
  - Retry with exponential backoff
  - Cache analysis results (même contenu = même analyse)

**Deployment Risks:**

**D-RISK-1: Downtime pendant migration DB**
- **Risk:** Users ne peuvent pas utiliser l'app pendant migration
- **Mitigation:**
  - Migration en heures creuses (2-4am)
  - Maintenance page avec ETA
  - Migration < 5 minutes (pratiqué en staging)

**D-RISK-2: Environment variables manquantes en prod**
- **Risk:** Deploy échoue car .env pas configuré
- **Mitigation:**
  - Checklist déploiement avec toutes les vars
  - Script validation: `npm run check-env`
  - CI/CD fails si vars manquantes

**Mitigation Strategies Summary:**

1. **Defense in depth:** Validation backend + rate limiting + monitoring
2. **Graceful degradation:** Si Stripe webhook fail, cron job sync
3. **Rollback ready:** Backups automatiques, scripts de rollback testés
4. **Monitoring proactive:** Alertes sur erreurs critiques
5. **Documentation:** Runbooks pour chaque scenario d'incident

---

# Section 5: Epic and Story Structure

## Epic Approach

**Epic Structure Decision:** **Single comprehensive epic** pour cette enhancement brownfield.

**Rationale:**
Cette enhancement, bien que majeure, représente une transformation cohérente du produit (single-user → multi-user SaaS freemium). Toutes les fonctionnalités sont interdépendantes:
- Auth nécessaire pour usage tracking
- Usage tracking nécessaire pour freemium
- Freemium nécessaire pour Stripe
- Admin panel nécessite tout le reste

Diviser en plusieurs epics créerait des dépendances complexes. Un seul epic permet une livraison coordonnée et testable end-to-end.

---

# Epic 1: Multi-User SaaS Freemium Transformation

**Epic Goal:**
Transformer MagFlow d'un prototype single-user en un SaaS multi-tenant avec modèle freemium, permettant à chaque éditeur de presse de créer un compte, gérer ses templates privés, et upgrader vers un plan Pro via Stripe pour des générations illimitées.

**Integration Requirements:**
- Backward compatibility avec les endpoints API existants (ajout middleware transparent)
- Migration des données de test existantes vers un user admin par défaut
- Préservation de l'architecture InDesign (Flask + Agent) sans modification
- Conservation du design system Tailwind et composants React existants

**Success Criteria:**
- Un nouvel utilisateur peut s'inscrire, créer 5 magazines gratuits, puis upgrader et générer sans limite
- L'admin peut voir tous les users et configurer leurs templates
- Aucune régression sur les fonctionnalités existantes (génération InDesign, analyse IA)
- Déployable en production sous 3-4 semaines

---

## Story 1.1: Database Schema Multi-User

**As a** developer,
**I want** to create the complete multi-user database schema with Row Level Security,
**so that** user data is isolated and the app can support multiple authenticated users.

**Acceptance Criteria:**
1. ✅ File `backend/supabase-schema-v2.sql` créé avec toutes les tables:
   - `profiles` (extends auth.users)
   - `subscriptions` (Stripe data)
   - `usage_logs` (tracking)
   - Modified `indesign_templates` (+ user_id)
   - Modified `magazine_generations` (+ user_id)

2. ✅ Row Level Security (RLS) policies créées:
   - Users can only read/write their own templates
   - Users can only read their own generations
   - Admin role can read all data

3. ✅ Migration script `migrations/001_add_multiuser.sql` créé pour migrer données existantes

4. ✅ Schema documenté dans `DATABASE.md` avec ER diagram

**Integration Verification:**
- **IV1:** Existing test data (if any) migrated to default admin user without loss
- **IV2:** RLS policies tested: User A cannot access User B's templates
- **IV3:** Query performance maintained (<100ms for template list avec user_id filter)

**Dependencies:** None (first story)

**Estimate:** 1 day

---

## Story 1.2: Backend Auth Middleware

**As a** backend developer,
**I want** to implement JWT authentication middleware using Supabase Auth,
**so that** all API endpoints are protected and user identity is validated.

**Acceptance Criteria:**
1. ✅ Middleware `backend/middleware/auth.js` créé:
   - Validates JWT token from `Authorization: Bearer <token>` header
   - Extracts user_id from token
   - Attaches `req.user` object for downstream use
   - Returns 401 if invalid/missing token

2. ✅ Middleware applied to all existing routes:
   ```javascript
   app.use('/api/content', requireAuth, contentRoutes);
   app.use('/api/templates', requireAuth, templateRoutes);
   app.use('/api/magazine', requireAuth, magazineRoutes);
   ```

3. ✅ New auth routes créés (`backend/routes/auth.js`):
   - `POST /api/auth/signup` - Proxy to Supabase
   - `POST /api/auth/login` - Proxy to Supabase
   - `POST /api/auth/logout` - Clear session

4. ✅ Error handling: Clear error messages for auth failures

**Integration Verification:**
- **IV1:** Existing Playwright tests updated to include authentication
- **IV2:** Health endpoint `/health` remains public (no auth required)
- **IV3:** 401 errors properly formatted and handled by frontend

**Dependencies:** Story 1.1 (DB schema with profiles table)

**Estimate:** 1 day

---

## Story 1.3: Usage Tracking & Limits Backend

**As a** backend developer,
**I want** to implement usage tracking and monthly limit enforcement,
**so that** free users are limited to 5 generations/month and Pro users have unlimited access.

**Acceptance Criteria:**
1. ✅ Service `backend/services/usageService.js` créé avec fonctions:
   - `getUserUsage(userId)` - Returns current month count
   - `canUserGenerate(userId)` - Checks if under limit
   - `incrementUsage(userId)` - Logs generation
   - `resetMonthlyUsage()` - Cron job (1er de chaque mois)

2. ✅ Middleware `backend/middleware/usage.js` créé:
   - Checks usage before `/api/magazine/generate`
   - Returns 403 with clear message if limit reached
   - Suggests upgrade to Pro

3. ✅ Endpoint `GET /api/user/usage` returns:
   ```json
   {
     "used": 3,
     "limit": 5,
     "plan": "free",
     "resetDate": "2026-02-01"
   }
   ```

4. ✅ Cron job configured (node-cron) pour reset mensuel

**Integration Verification:**
- **IV1:** Free user blocked after 5th generation with clear error message
- **IV2:** Pro user can generate beyond 5 without issues
- **IV3:** Usage counter accurate (no race conditions with concurrent requests)

**Dependencies:** Story 1.2 (Auth middleware provides user_id)

**Estimate:** 1.5 days

---

## Story 1.4: Stripe Integration Backend

**As a** backend developer,
**I want** to integrate Stripe for payment processing and subscription management,
**so that** users can upgrade to Pro and the system syncs subscription status automatically.

**Acceptance Criteria:**
1. ✅ Service `backend/services/stripeService.js` créé:
   - `createCheckoutSession(userId)` - Creates Stripe Checkout for Pro plan
   - `handleWebhook(event)` - Processes Stripe events
   - `getCustomerPortalUrl(userId)` - For managing subscription

2. ✅ Routes `backend/routes/stripe.js`:
   - `POST /api/stripe/create-checkout` - Returns checkout URL
   - `POST /api/stripe/webhook` - Receives Stripe events (signature verification)
   - `GET /api/stripe/portal` - Returns customer portal URL

3. ✅ Webhook handlers for events:
   - `checkout.session.completed` → Update user to Pro plan
   - `customer.subscription.updated` → Sync status changes
   - `customer.subscription.deleted` → Downgrade to free

4. ✅ Idempotency: Duplicate webhooks handled correctly

5. ✅ Stripe test mode configured with test keys

**Integration Verification:**
- **IV1:** Test payment flow end-to-end in Stripe test mode
- **IV2:** Webhook retries handled (Stripe sends up to 3 times)
- **IV3:** User status synced within 30 seconds of payment

**Dependencies:** Story 1.3 (Usage service needs to check plan)

**Estimate:** 2 days

---

## Story 1.5: Admin Panel Backend

**As an** administrator,
**I want** backend endpoints to manage users and their templates,
**so that** I can provide support and configure custom templates via admin panel.

**Acceptance Criteria:**
1. ✅ Middleware `backend/middleware/admin.js` créé:
   - Checks if `req.user.role === 'admin'`
   - Returns 403 if not admin

2. ✅ Routes `backend/routes/admin.js`:
   - `GET /api/admin/users` - List all users with stats (paginated)
   - `GET /api/admin/users/:id` - User details + generation history
   - `PATCH /api/admin/users/:id` - Update user (change plan, reset quota)
   - `POST /api/admin/templates` - Upload template for specific user
   - `GET /api/admin/stats` - Global stats (total users, free/pro split, generations)

3. ✅ Admin user created in DB with `role='admin'` (votre compte)

4. ✅ Audit logging: All admin actions logged in `usage_logs`

**Integration Verification:**
- **IV1:** Non-admin users receive 403 when accessing admin endpoints
- **IV2:** Admin can successfully modify user plan and see changes reflected immediately
- **IV3:** Template upload for specific user works (appears only in that user's gallery)

**Dependencies:** Story 1.2 (Auth middleware + role check)

**Estimate:** 1.5 days

---

## Story 1.6: Frontend Auth Pages & Context

**As a** user,
**I want** to sign up and log in to MagFlow,
**so that** I can access my private templates and track my usage.

**Acceptance Criteria:**
1. ✅ Auth context `src/contexts/AuthContext.jsx` créé:
   - Provides: `user`, `isAuthenticated`, `login()`, `signup()`, `logout()`
   - Uses Supabase Auth SDK
   - Persists session in localStorage

2. ✅ Pages créées:
   - `src/pages/auth/Login.jsx` - Email/password form
   - `src/pages/auth/Signup.jsx` - Email/password + company name
   - Design: Tailwind, centered, responsive

3. ✅ Components:
   - `src/components/ProtectedRoute.jsx` - Redirects to /login if not authenticated
   - `src/components/PublicRoute.jsx` - Redirects to / if already authenticated

4. ✅ Routes dans `App.jsx`:
   ```jsx
   <PublicRoute path="/login" component={Login} />
   <PublicRoute path="/signup" component={Signup} />
   <ProtectedRoute path="/" component={Dashboard} />
   ```

5. ✅ Form validation: Email format, password min 8 chars

**Integration Verification:**
- **IV1:** Existing pages (Dashboard, SmartContentCreator) now protected and require login
- **IV2:** Login persists across browser refresh
- **IV3:** Logout clears session and redirects to /login

**Dependencies:** Story 1.2 (Backend auth endpoints exist)

**Estimate:** 2 days

---

## Story 1.7: Frontend Usage Tracking UI

**As a** user,
**I want** to see my monthly usage quota in the app,
**so that** I know how many generations I have left and when to upgrade.

**Acceptance Criteria:**
1. ✅ Redux slice `src/store/usageSlice.js`:
   - State: `{ used, limit, plan, resetDate }`
   - Thunk: `fetchUsage()` calls `GET /api/user/usage`

2. ✅ Hook `src/hooks/useUsage.js`:
   - Returns usage data
   - Auto-refreshes after each generation

3. ✅ Component `src/components/UsageBadge.jsx`:
   - Displays "X/5 générations utilisées" (free)
   - Displays "Plan Pro - Illimité" (pro)
   - Color coding: green (ok), orange (4/5), red (5/5)

4. ✅ Integration dans Dashboard header et SmartContentCreator page

5. ✅ Modal `src/components/UpgradeModal.jsx`:
   - Appears when limit reached
   - Explains Pro benefits
   - Button → Stripe Checkout

**Integration Verification:**
- **IV1:** Usage badge updates immediately after generation completes
- **IV2:** Modal blocks generation attempt when limit reached
- **IV3:** After upgrade to Pro, badge switches to "Illimité" without refresh

**Dependencies:** Story 1.3 (Backend usage API), Story 1.6 (Auth context)

**Estimate:** 1.5 days

---

## Story 1.8: Frontend Stripe Integration

**As a** user,
**I want** to upgrade to Pro plan via credit card payment,
**so that** I can generate unlimited magazines.

**Acceptance Criteria:**
1. ✅ Page `src/pages/upgrade/Pricing.jsx`:
   - Comparison Free vs Pro
   - Button "Upgrade to Pro - 29€/mois"
   - Redirects to Stripe Checkout

2. ✅ Service `src/services/stripeService.js`:
   - `createCheckoutSession()` - Calls backend, opens Stripe Checkout
   - `redirectToPortal()` - Opens Stripe Customer Portal

3. ✅ Success/Cancel pages:
   - `src/pages/upgrade/Success.jsx` - "Paiement réussi, accès Pro activé!"
   - `src/pages/upgrade/Cancel.jsx` - "Paiement annulé"

4. ✅ Account Settings page shows:
   - Current plan
   - Button "Manage Subscription" (opens Stripe Portal)

**Integration Verification:**
- **IV1:** Complete payment flow in Stripe test mode (use test card 4242...)
- **IV2:** After payment, user plan updates within 30s (webhook processed)
- **IV3:** User can cancel subscription via Portal, status synced back

**Dependencies:** Story 1.4 (Backend Stripe endpoints), Story 1.7 (Usage UI)

**Estimate:** 1.5 days

---

## Story 1.9: Admin Panel Frontend

**As an** administrator,
**I want** a dashboard to manage users and configure their templates,
**so that** I can provide support and customize user experiences.

**Acceptance Criteria:**
1. ✅ Page `src/pages/admin/Dashboard.jsx`:
   - Table: Users list (email, plan, usage, join date)
   - Search/filter by email or plan
   - Click user → Modal with details

2. ✅ User Detail Modal:
   - Stats: Total generations, current month usage
   - Actions:
     - Change plan (Free ↔ Pro)
     - Reset monthly quota
     - View generation history (list with dates)

3. ✅ Template Upload section:
   - Select user from dropdown
   - Upload .indt file
   - Preview uploaded templates per user

4. ✅ Global Stats widget:
   - Total users
   - Free vs Pro split (pie chart optionnel)
   - Total generations this month

5. ✅ Protected route: Only accessible if `user.role === 'admin'`

**Integration Verification:**
- **IV1:** Admin can change user plan, user sees change immediately on next login
- **IV2:** Template uploaded for User A does not appear in User B's gallery
- **IV3:** Non-admin users redirected to Dashboard if they try `/admin` URL

**Dependencies:** Story 1.5 (Backend admin endpoints), Story 1.6 (Auth context with role)

**Estimate:** 2 days

---

## Story 1.10: Template Isolation & User-Specific Templates

**As a** user,
**I want** to see only my own templates in the gallery,
**so that** my private templates are not visible to other users.

**Acceptance Criteria:**
1. ✅ Backend route `GET /api/templates` modified:
   - Filters by `user_id = req.user.id`
   - Returns only templates owned by authenticated user
   - Admin users see all templates (optional)

2. ✅ Frontend TemplateGallery page:
   - Displays only user's templates
   - Shows empty state if no templates: "Upload your first template"
   - Button "Upload Template" (optionnel pour MVP)

3. ✅ RLS policies enforce isolation at DB level

4. ✅ Migration: Existing test templates assigned to admin user

**Integration Verification:**
- **IV1:** User A logs in, sees only their templates
- **IV2:** User B logs in, sees completely different set
- **IV3:** Direct API call with User A's token cannot access User B's template_id

**Dependencies:** Story 1.1 (DB schema with user_id), Story 1.2 (Auth middleware)

**Estimate:** 0.5 day

---

## Story 1.11: Generation History Per User

**As a** user,
**I want** to see my generation history,
**so that** I can download previous magazines and track my usage over time.

**Acceptance Criteria:**
1. ✅ Backend route `GET /api/magazine/history` modified:
   - Filters by `user_id = req.user.id`
   - Returns only user's generations
   - Ordered by created_at DESC

2. ✅ Frontend page `src/pages/account/History.jsx`:
   - Table: Date, Template used, Status, Download link
   - Pagination (10 per page)
   - Filter by status (completed, error)

3. ✅ Navigation: Link "My Generations" in user dropdown menu

**Integration Verification:**
- **IV1:** User A sees only their generations, not User B's
- **IV2:** Download links work (files accessible)
- **IV3:** History updates immediately after new generation completes

**Dependencies:** Story 1.1 (DB schema), Story 1.2 (Auth), Story 1.6 (Navigation)

**Estimate:** 1 day

---

## Story 1.12: Account Settings Page

**As a** user,
**I want** to manage my account settings,
**so that** I can update my profile and manage my subscription.

**Acceptance Criteria:**
1. ✅ Page `src/pages/account/Settings.jsx`:
   - Sections:
     - Profile (email, company name - read-only for MVP)
     - Current Plan (Free/Pro badge + usage stats)
     - Subscription Management (button to Stripe Portal if Pro)
     - Change Password (link to Supabase reset flow)

2. ✅ Navigation: Link "Account Settings" in user dropdown

3. ✅ If Free plan: Button "Upgrade to Pro" → Pricing page

4. ✅ If Pro plan: Button "Manage Subscription" → Stripe Portal

**Integration Verification:**
- **IV1:** Settings page displays correct current plan
- **IV2:** Stripe Portal link works and shows active subscription
- **IV3:** Password reset flow works (email sent)

**Dependencies:** Story 1.6 (Auth context), Story 1.8 (Stripe integration)

**Estimate:** 1 day

---

## Story 1.13: E2E Testing & Bug Fixes

**As a** QA/developer,
**I want** comprehensive E2E tests for the complete freemium flow,
**so that** we can deploy confidently without regressions.

**Acceptance Criteria:**
1. ✅ Playwright tests créés (`e2e/freemium-flow.spec.js`):
   - Test 1: Signup → Create 5 magazines → Blocked on 6th
   - Test 2: Signup → Upgrade to Pro → Create 10 magazines (no block)
   - Test 3: Admin login → View users → Change plan
   - Test 4: Login persistence across refresh

2. ✅ All existing tests pass (magazine generation, template selection)

3. ✅ Bug triage: List all bugs found during testing

4. ✅ Critical bugs fixed before deployment

5. ✅ Test coverage report generated

**Integration Verification:**
- **IV1:** E2E tests run in CI/CD (GitHub Actions)
- **IV2:** No existing functionality broken (regression tests green)
- **IV3:** All new features covered by tests

**Dependencies:** All previous stories (tests entire system)

**Estimate:** 2 days

---

## Story 1.14: Documentation & Deployment

**As a** developer/user,
**I want** complete documentation and production deployment,
**so that** the system is ready for real users.

**Acceptance Criteria:**
1. ✅ Documentation créée/mise à jour:
   - `README.md` - Updated with auth setup
   - `DATABASE.md` - Schema documentation with diagrams
   - `API.md` - All endpoints documented
   - `DEPLOYMENT.md` - Production deployment guide
   - User guide: "Getting Started with MagFlow"

2. ✅ Environment variables configured in production:
   - Render backend: All Stripe, Supabase, OpenAI keys
   - Netlify frontend: Vite env vars
   - Supabase: RLS enabled, policies active

3. ✅ Production deployment checklist completed:
   - [ ] DB migration run in production
   - [ ] Stripe webhook endpoint configured (production URL)
   - [ ] Admin user created
   - [ ] Smoke tests passed
   - [ ] Monitoring active

4. ✅ Rollback plan documented

**Integration Verification:**
- **IV1:** Production signup flow works end-to-end
- **IV2:** Real Stripe payment processed successfully (use live keys carefully)
- **IV3:** No errors in production logs (first 24h monitoring)

**Dependencies:** Story 1.13 (All tests pass)

**Estimate:** 1.5 days

---

## Story Summary & Timeline

| Story | Description | Estimate | Dependencies |
|-------|-------------|----------|--------------|
| 1.1 | Database Schema Multi-User | 1 day | None |
| 1.2 | Backend Auth Middleware | 1 day | 1.1 |
| 1.3 | Usage Tracking & Limits | 1.5 days | 1.2 |
| 1.4 | Stripe Integration Backend | 2 days | 1.3 |
| 1.5 | Admin Panel Backend | 1.5 days | 1.2 |
| 1.6 | Frontend Auth Pages | 2 days | 1.2 |
| 1.7 | Frontend Usage Tracking UI | 1.5 days | 1.3, 1.6 |
| 1.8 | Frontend Stripe Integration | 1.5 days | 1.4, 1.7 |
| 1.9 | Admin Panel Frontend | 2 days | 1.5, 1.6 |
| 1.10 | Template Isolation | 0.5 day | 1.1, 1.2 |
| 1.11 | Generation History | 1 day | 1.1, 1.2, 1.6 |
| 1.12 | Account Settings Page | 1 day | 1.6, 1.8 |
| 1.13 | E2E Testing & Bug Fixes | 2 days | All |
| 1.14 | Documentation & Deployment | 1.5 days | 1.13 |
| **TOTAL** | | **19.5 days** (~4 semaines) | |

**Sprint Suggestion:**
- **Sprint 1 (Week 1):** Stories 1.1-1.3 (Backend foundation)
- **Sprint 2 (Week 2):** Stories 1.4-1.6 (Payments + Auth UI)
- **Sprint 3 (Week 3):** Stories 1.7-1.12 (Complete features)
- **Sprint 4 (Week 4):** Stories 1.13-1.14 (Testing + Deployment)

---

# Reflection & Follow-up

## What Worked Well
- Comprehensive analysis of existing codebase before planning enhancement
- Clear separation of concerns (backend foundation → frontend consumption)
- Brownfield-specific considerations (backward compatibility, migration strategy)
- Realistic timeline with buffer (19.5 days = ~4 weeks)

## Areas for Further Exploration
- Performance optimization with BullMQ queue system (mentioned by Winston but not detailed in stories)
- Electron Agent simplification (Winston's recommendation - separate epic?)
- Template marketplace features (future enhancement)
- Multi-organization support (if needed for larger clients)

## Recommended Follow-up Techniques
- **Story mapping workshop:** Visualize user journey with stakeholders before Sprint 1
- **Technical spike:** Test Stripe webhook locally before Story 1.4
- **Design review:** Validate UI mockups for admin panel before Story 1.9

## Questions That Emerged
- Should we implement rate limiting per user or global?
- What happens to a user's templates if they downgrade from Pro to Free?
- Should admin be able to impersonate users for support purposes?
- Do we need email verification on signup or can users use the app immediately?

## Next Session Planning
- **Suggested topics:**
  - Database schema detailed design (ER diagrams)
  - Architecture documentation
  - Sprint 1 kickoff planning
- **Recommended timeframe:** Within 1-2 days to maintain momentum
- **Preparation needed:**
  - Review Supabase RLS documentation
  - Set up Stripe test account
  - Create development branch in Git

---

*Session facilitated using the BMAD-METHOD™ brainstorming framework*

---

**Document Version:** 0.1
**Last Updated:** 2026-01-09
**Next Review:** Before Sprint 1 kickoff
