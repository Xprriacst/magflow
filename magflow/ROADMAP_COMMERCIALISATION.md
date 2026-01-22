# 🚀 ROADMAP COMMERCIALISATION - MagFlow

**Objectif :** Transformer MagFlow en produit commercialisable  
**Date :** 20 Janvier 2026  
**Statut Actuel :** 80% complété → **Cible : 100% Production Ready**

---

## 📊 ANALYSE DES GAPS CRITIQUES

### ❌ Bloquants Commercialisation (MUST HAVE)

| Gap | Impact Business | Priorité | Effort |
|-----|----------------|----------|--------|
| **Authentification** | 🔴 Critique - Pas de gestion utilisateurs | P0 | 3-5j |
| **Sécurité API** | 🔴 Critique - Clés exposées | P0 | 2-3j |
| **Supabase Storage** | 🔴 Critique - Images non persistées | P0 | 2-3j |
| **Gestion Erreurs** | 🟡 Important - UX dégradée | P1 | 1-2j |
| **Tests E2E** | 🟡 Important - Pas de garantie qualité | P1 | 3-4j |
| **Déploiement** | 🔴 Critique - Pas accessible en ligne | P0 | 2-3j |
| **Monitoring** | 🟡 Important - Pas de visibilité production | P1 | 1-2j |
| **Documentation** | 🟢 Nice to have - Onboarding utilisateurs | P2 | 2-3j |

**Total estimé :** 16-25 jours de développement

---

## 🎯 FONCTIONNALITÉS CRITIQUES À FINALISER

### 1. 🔐 AUTHENTIFICATION & SÉCURITÉ (P0)

#### État Actuel
- ⚠️ Routes auth créées mais non fonctionnelles
- ❌ Pas de gestion de sessions
- ❌ Clé OpenAI exposée côté frontend
- ❌ Pas de protection des routes sensibles

#### Objectifs
- ✅ Supabase Auth intégré (email/password + OAuth Google)
- ✅ JWT tokens avec refresh
- ✅ Protected routes (middleware)
- ✅ Row Level Security (RLS) activé
- ✅ User profiles (nom, email, plan, quota)
- ✅ Rate limiting par utilisateur

#### Critères d'Acceptation
- [ ] Login/Register fonctionnels
- [ ] Sessions persistantes
- [ ] Routes protégées (/api/magazine/*, /api/templates/*)
- [ ] Pas de clés API exposées
- [ ] RLS activé sur toutes les tables
- [ ] Tests auth (coverage >80%)

---

### 2. 📦 SUPABASE STORAGE (P0)

#### État Actuel
- ❌ Images stockées via URLs externes
- ❌ Pas de contrôle sur les ressources
- ❌ Liens peuvent se casser

#### Objectifs
- ✅ Bucket `magazine-images` créé
- ✅ Upload endpoint `/api/upload/image`
- ✅ URLs signées (expiration 1h)
- ✅ Validation (MIME, taille max 10MB)
- ✅ Compression automatique (80% qualité)
- ✅ Nettoyage images anciennes (>30j)

#### Critères d'Acceptation
- [ ] Upload images fonctionnel
- [ ] Images accessibles via URLs signées
- [ ] Validation fichiers robuste
- [ ] Compression automatique
- [ ] Cron job nettoyage configuré
- [ ] Tests upload (coverage >80%)

---

### 3. 🚨 GESTION D'ERREURS & UX (P1)

#### État Actuel
- ❌ Erreurs API non affichées
- ❌ Pas de feedback utilisateur
- ❌ Timeout génération non géré

#### Objectifs
- ✅ Toast notifications (succès/erreur)
- ✅ Loading states partout
- ✅ Error boundaries React
- ✅ Retry automatique (3 tentatives)
- ✅ Messages d'erreur explicites
- ✅ Logs structurés (Winston)

#### Critères d'Acceptation
- [ ] Toutes les erreurs affichées
- [ ] Loading indicators présents
- [ ] Retry automatique sur échecs réseau
- [ ] Messages utilisateur clairs
- [ ] Logs centralisés
- [ ] Tests erreurs (coverage >70%)

---

### 4. 🧪 TESTS E2E COMPLETS (P1)

#### État Actuel
- ⚠️ Playwright configuré
- ❌ Seulement 3 tests basiques
- ❌ Coverage <30%

#### Objectifs
- ✅ Tests workflow complet (10+ scénarios)
- ✅ Tests authentification
- ✅ Tests upload templates
- ✅ Tests génération avec erreurs
- ✅ Tests responsive
- ✅ CI/CD intégré

#### Critères d'Acceptation
- [ ] >20 tests E2E
- [ ] Coverage >80%
- [ ] Tests passent en CI
- [ ] Temps exécution <5min
- [ ] Screenshots sur échecs
- [ ] Rapports HTML générés

---

### 5. 🌐 DÉPLOIEMENT PRODUCTION (P0)

#### État Actuel
- ❌ Tout en local
- ❌ Pas d'environnement de production

#### Objectifs

**Backend (Render/Railway)**
- ✅ Déployé sur Render/Railway
- ✅ Variables env production
- ✅ HTTPS/SSL
- ✅ Rate limiting (100 req/min)
- ✅ Logs structurés
- ✅ Health checks

**Frontend (Netlify/Vercel)**
- ✅ Déployé sur Netlify
- ✅ Build optimisé (<1MB)
- ✅ CDN activé
- ✅ Analytics (Plausible/Umami)
- ✅ Domaine custom

**Flask (VPS dédié)**
- ✅ Serveur avec InDesign
- ✅ Queue Redis pour jobs
- ✅ Auto-restart (PM2/systemd)
- ✅ Backups quotidiens

#### Critères d'Acceptation
- [ ] App accessible publiquement
- [ ] HTTPS partout
- [ ] Temps réponse <200ms
- [ ] Uptime >99%
- [ ] Backups automatiques
- [ ] Rollback possible

---

### 6. 📊 MONITORING & OBSERVABILITÉ (P1)

#### État Actuel
- ❌ Pas de monitoring
- ❌ Pas de logs centralisés
- ❌ Pas d'alertes

#### Objectifs
- ✅ Sentry (error tracking)
- ✅ Logs structurés (Winston → Logtail)
- ✅ Métriques (Prometheus/Grafana)
- ✅ Uptime monitoring (UptimeRobot)
- ✅ Alertes Slack/Email
- ✅ Dashboard admin

#### Critères d'Acceptation
- [ ] Erreurs trackées dans Sentry
- [ ] Logs centralisés et searchables
- [ ] Dashboard métriques temps réel
- [ ] Alertes configurées
- [ ] Rapports hebdomadaires
- [ ] SLA >99% uptime

---

### 7. 💳 SYSTÈME DE PAIEMENT (P0 - Commercialisation)

#### État Actuel
- ❌ Pas de système de paiement
- ❌ Pas de plans/quotas

#### Objectifs
- ✅ Stripe intégré
- ✅ 3 plans (Free, Pro, Enterprise)
- ✅ Quotas par plan (générations/mois)
- ✅ Webhooks Stripe
- ✅ Gestion abonnements
- ✅ Facturation automatique

#### Plans Proposés
```
FREE (0€/mois)
- 5 générations/mois
- 3 templates
- Support email

PRO (29€/mois)
- 100 générations/mois
- Tous les templates
- Upload templates custom
- Support prioritaire

ENTERPRISE (Sur devis)
- Générations illimitées
- Templates custom illimités
- Desktop Agent
- Support dédié
- SLA 99.9%
```

#### Critères d'Acceptation
- [ ] Stripe configuré
- [ ] Plans créés
- [ ] Quotas appliqués
- [ ] Webhooks fonctionnels
- [ ] Page pricing
- [ ] Tests paiement (Stripe test mode)

---

### 8. 📱 DESKTOP AGENT (P1 - Différenciateur)

#### État Actuel
- ✅ WebSocket backend configuré
- ❌ App Electron pas créée

#### Objectifs
- ✅ App Electron (macOS/Windows)
- ✅ Connexion WebSocket au backend
- ✅ Queue de jobs locale
- ✅ Communication InDesign local
- ✅ Interface monitoring
- ✅ Auto-update

#### Critères d'Acceptation
- [ ] App Electron fonctionnelle
- [ ] Connexion backend stable
- [ ] Jobs traités localement
- [ ] InDesign local utilisé
- [ ] Interface utilisateur claire
- [ ] Auto-update configuré

---

### 9. 📚 DOCUMENTATION UTILISATEUR (P2)

#### État Actuel
- ⚠️ Documentation technique OK
- ❌ Pas de guide utilisateur

#### Objectifs
- ✅ Guide démarrage rapide
- ✅ Tutoriels vidéo (3-5min)
- ✅ FAQ complète
- ✅ Documentation API
- ✅ Changelog public
- ✅ Blog/Use cases

#### Critères d'Acceptation
- [ ] Guide utilisateur complet
- [ ] 5+ tutoriels vidéo
- [ ] FAQ >20 questions
- [ ] API docs (Swagger/OpenAPI)
- [ ] Changelog à jour
- [ ] 3+ articles blog

---

## 🔄 PROMPTS RALPH LOOP

### 🔐 Prompt 1: Authentification Complète

```bash
/ralph-loop "Complete Supabase authentication system for MagFlow production.

PHASE 1: Backend Authentication
- Implement Supabase Auth in backend/routes/auth.js
- Add endpoints: /register, /login, /logout, /refresh-token, /me
- Create JWT validation middleware (verifyToken)
- Protect routes: /api/magazine/*, /api/templates/upload*, /api/upload/*
- Add user session management
- Implement rate limiting (100 req/min per user)
- Add password reset flow
- Write unit tests (coverage >80%)

PHASE 2: Frontend Integration
- Update src/pages/auth/login with Supabase Auth
- Update src/pages/auth/register with validation
- Add AuthContext (React Context)
- Implement protected routes (PrivateRoute component)
- Add user profile page
- Handle token refresh automatically
- Add logout functionality
- Write E2E tests for auth flows

PHASE 3: Database Security
- Enable Row Level Security (RLS) on all tables
- Create policies:
  * indesign_templates: Public read, authenticated write
  * magazine_generations: Users see only their own
- Add user_id column to magazine_generations
- Create user_profiles table (id, email, name, plan, quota_used, quota_limit)
- Add triggers for quota management

PHASE 4: Security Hardening
- Remove OpenAI key from frontend (.env)
- Move all OpenAI calls to backend
- Add CORS whitelist (production domains only)
- Implement CSRF protection
- Add helmet.js security headers
- Sanitize all user inputs
- Add SQL injection protection

COMPLETION CRITERIA:
- All auth endpoints working (tested with Postman)
- Protected routes require valid JWT
- RLS enabled and tested
- No API keys exposed in frontend
- All tests passing (unit + E2E coverage >80%)
- No console errors
- Documentation updated (API endpoints, auth flow)

If blocked after 20 iterations:
- Document what's blocking progress
- List completed tasks vs remaining
- Provide error logs
- Suggest alternative approaches

Output <promise>AUTH_COMPLETE</promise> when all criteria met." --completion-promise "AUTH_COMPLETE" --max-iterations 30
```

---

### 📦 Prompt 2: Supabase Storage

```bash
/ralph-loop "Implement Supabase Storage for images in MagFlow.

PHASE 1: Supabase Setup
- Create bucket 'magazine-images' in Supabase
- Configure bucket policies (authenticated users can upload)
- Set max file size: 10MB
- Enable RLS on storage.objects

PHASE 2: Backend Upload Endpoint
- Create route POST /api/upload/image in backend/routes/upload.js
- Add multer middleware for file handling
- Validate file types (MIME: image/jpeg, image/png, image/gif, image/tiff)
- Validate file size (<10MB)
- Compress images (sharp library, 80% quality)
- Upload to Supabase Storage (path: /{userId}/{generationId}/{filename})
- Generate signed URL (expiration: 1 hour)
- Return URL in response
- Add error handling (file too large, invalid type, upload failed)
- Write unit tests (coverage >80%)

PHASE 3: Frontend Integration
- Update src/pages/smart-content-creator/index.jsx
- Replace external URL input with file upload
- Add drag & drop zone for images
- Show upload progress (0-100%)
- Display uploaded image previews
- Handle upload errors (show toast notifications)
- Update magazineAPI.generate() to use Storage URLs
- Write E2E tests for upload flow

PHASE 4: Cleanup & Optimization
- Create cron job to delete images >30 days old
- Add admin endpoint GET /api/admin/storage/stats (total size, file count)
- Implement image optimization (WebP conversion)
- Add CDN caching headers
- Document storage limits in user dashboard

PHASE 5: Migration
- Migrate existing external URLs to Storage (if any)
- Update database schema (add storage_path column)
- Create migration script
- Test with existing generations

COMPLETION CRITERIA:
- Upload endpoint working (tested with Postman)
- Images stored in Supabase Storage
- Signed URLs generated correctly
- Frontend upload functional (drag & drop works)
- Compression working (file size reduced)
- Validation robust (rejects invalid files)
- All tests passing (coverage >80%)
- Cron job configured
- Documentation updated

If blocked after 15 iterations:
- Document blockers
- Show error logs
- List what works vs what doesn't
- Suggest fixes

Output <promise>STORAGE_COMPLETE</promise> when all criteria met." --completion-promise "STORAGE_COMPLETE" --max-iterations 25
```

---

### 🚨 Prompt 3: Gestion d'Erreurs & UX

```bash
/ralph-loop "Implement comprehensive error handling and UX improvements for MagFlow.

PHASE 1: Toast Notifications
- Install react-hot-toast or sonner
- Create ToastProvider in src/App.jsx
- Add toast notifications for:
  * API errors (network, 4xx, 5xx)
  * Success messages (generation complete, upload success)
  * Warning messages (quota limit, slow network)
- Style toasts to match design system
- Add dismiss functionality
- Test all notification types

PHASE 2: Loading States
- Add loading indicators to:
  * Content analysis (skeleton loader)
  * Template recommendation (spinner)
  * Magazine generation (progress bar 0-100%)
  * Image upload (progress percentage)
  * Template upload (progress bar)
- Create reusable Loading component
- Add timeout handling (show error after 30s)
- Disable buttons during loading
- Test all loading states

PHASE 3: Error Boundaries
- Create ErrorBoundary component (React)
- Wrap main routes with ErrorBoundary
- Add fallback UI for crashes
- Log errors to Sentry (if configured)
- Add 'Report Bug' button
- Create custom 404 page
- Create custom 500 page
- Test error boundaries (throw errors manually)

PHASE 4: Retry Logic
- Add automatic retry for failed API calls (3 attempts)
- Implement exponential backoff (1s, 2s, 4s)
- Show retry count to user ('Retrying... (2/3)')
- Add manual retry button on errors
- Handle network offline state
- Test retry logic (simulate network failures)

PHASE 5: Backend Error Handling
- Create centralized error handler middleware
- Return consistent error format:
  {
    success: false,
    error: 'User-friendly message',
    code: 'ERROR_CODE',
    details: {} // Only in dev
  }
- Add error codes (AUTH_FAILED, QUOTA_EXCEEDED, etc.)
- Log errors with Winston (structured logs)
- Add request ID for tracing
- Test all error scenarios

PHASE 6: Validation & Feedback
- Add form validation (React Hook Form)
- Show inline errors (field-level)
- Add helpful error messages ('Email already exists' not 'Error 409')
- Add input constraints (max length, patterns)
- Add confirmation dialogs (delete, logout)
- Test all validation rules

COMPLETION CRITERIA:
- Toast notifications working (all types)
- Loading states present everywhere
- Error boundaries catch crashes
- Retry logic functional (tested)
- Backend errors consistent
- Form validation robust
- All tests passing (coverage >70%)
- No unhandled promise rejections
- No console errors
- User experience smooth

If blocked after 15 iterations:
- Document issues
- Show screenshots of problems
- List completed vs remaining
- Suggest fixes

Output <promise>UX_COMPLETE</promise> when all criteria met." --completion-promise "UX_COMPLETE" --max-iterations 25
```

---

### 🧪 Prompt 4: Tests E2E Complets

```bash
/ralph-loop "Create comprehensive E2E test suite for MagFlow using Playwright.

PHASE 1: Test Infrastructure
- Review playwright.config.js (ensure proper setup)
- Create test helpers in e2e/helpers/:
  * auth.js (login, logout, register helpers)
  * api.js (mock API responses)
  * fixtures.js (test data)
- Set up test database (separate Supabase project or local)
- Configure CI environment variables
- Add test scripts to package.json

PHASE 2: Authentication Tests
Create e2e/auth.spec.js:
- Test user registration (valid, invalid email, weak password)
- Test user login (valid, invalid credentials, remember me)
- Test logout
- Test password reset flow
- Test protected routes (redirect to login)
- Test token refresh
- Test session persistence
- Verify RLS (user can't see other's data)

PHASE 3: Content Analysis Tests
Create e2e/content-analysis.spec.js:
- Test content paste and analysis
- Test analysis results display
- Test error handling (empty content, API error)
- Test loading states
- Test retry on failure
- Verify extracted structure (titre, chapo, sections)

PHASE 4: Template Tests
Create e2e/templates.spec.js:
- Test template gallery display
- Test template filtering (category, style)
- Test template recommendation
- Test template selection
- Test template upload (admin)
- Test template analysis
- Test invalid template upload

PHASE 5: Generation Tests
Create e2e/magazine-generation.spec.js:
- Test full workflow (paste → analyze → select → generate)
- Test image upload
- Test generation with multiple images
- Test generation progress
- Test download .indd file
- Test generation errors (timeout, Flask down)
- Test quota limits (free plan)
- Verify database records created

PHASE 6: Admin Tests
Create e2e/admin.spec.js:
- Test admin dashboard access
- Test template management
- Test user management (if implemented)
- Test analytics/stats
- Test bulk operations

PHASE 7: Responsive & Accessibility
Create e2e/responsive.spec.js:
- Test mobile viewport (375px)
- Test tablet viewport (768px)
- Test desktop viewport (1920px)
- Test keyboard navigation
- Test screen reader compatibility (basic)
- Test color contrast

PHASE 8: Performance Tests
Create e2e/performance.spec.js:
- Test page load times (<3s)
- Test API response times (<500ms)
- Test bundle size (<1MB)
- Test Lighthouse score (>90)

PHASE 9: CI/CD Integration
- Create .github/workflows/e2e-tests.yml
- Run tests on pull requests
- Run tests on main branch
- Generate HTML reports
- Upload screenshots on failures
- Send notifications (Slack/Discord)

COMPLETION CRITERIA:
- >20 E2E tests created
- All tests passing locally
- Tests passing in CI
- Coverage >80% of user flows
- Test execution time <5min
- HTML reports generated
- Screenshots on failures
- Documentation updated (how to run tests)
- No flaky tests (run 3 times, all pass)

If blocked after 20 iterations:
- Document failing tests
- Show error logs/screenshots
- List completed vs remaining
- Suggest fixes or skip flaky tests

Output <promise>TESTS_COMPLETE</promise> when all criteria met." --completion-promise "TESTS_COMPLETE" --max-iterations 35
```

---

### 🌐 Prompt 5: Déploiement Production

```bash
/ralph-loop "Deploy MagFlow to production with full infrastructure.

PHASE 1: Backend Deployment (Render)
- Create Render account
- Create new Web Service (Node.js)
- Connect GitHub repository
- Configure build command: 'cd backend && npm install'
- Configure start command: 'cd backend && npm start'
- Add environment variables:
  * SUPABASE_URL
  * SUPABASE_ANON_KEY
  * SUPABASE_SERVICE_KEY
  * OPENAI_API_KEY
  * FLASK_API_URL (production Flask URL)
  * NODE_ENV=production
  * PORT=3001
- Enable auto-deploy on main branch
- Configure health check: /health
- Set up custom domain (api.magflow.app)
- Test deployment (curl health endpoint)

PHASE 2: Frontend Deployment (Netlify)
- Create Netlify account
- Connect GitHub repository
- Configure build settings:
  * Build command: 'npm run build'
  * Publish directory: 'dist'
  * Node version: 18
- Add environment variables:
  * VITE_SUPABASE_URL
  * VITE_SUPABASE_ANON_KEY
  * VITE_BACKEND_URL (production backend URL)
- Enable auto-deploy on main branch
- Configure redirects (_redirects file for SPA)
- Set up custom domain (app.magflow.app)
- Enable HTTPS
- Configure CDN caching
- Test deployment (visit app.magflow.app)

PHASE 3: Flask Deployment (VPS - DigitalOcean/Hetzner)
- Provision VPS (4GB RAM, 2 vCPU)
- Install Ubuntu 22.04
- Install Adobe InDesign 2026 (macOS) or use existing Mac
- Install Python 3.11
- Install Redis (for job queue)
- Clone repository
- Install dependencies (pip install -r requirements.txt)
- Configure systemd service:
  * Auto-start on boot
  * Auto-restart on crash
  * Logging to /var/log/magflow-flask.log
- Configure nginx reverse proxy (port 5003 → 443)
- Set up SSL certificate (Let's Encrypt)
- Configure firewall (allow 443, 22 only)
- Set up Redis queue for jobs
- Configure daily backups (output/ folder)
- Test deployment (curl https://flask.magflow.app/health)

PHASE 4: Database & Storage
- Verify Supabase production project
- Run migrations (supabase-schema.sql)
- Insert initial templates
- Configure backups (daily, 30 days retention)
- Enable RLS on all tables
- Create read replicas (if needed)
- Test database connection from backend

PHASE 5: Monitoring & Alerts
- Set up Sentry (error tracking)
  * Backend project
  * Frontend project
  * Flask project
- Configure UptimeRobot (uptime monitoring)
  * Backend health check (every 5min)
  * Frontend health check (every 5min)
  * Flask health check (every 5min)
- Set up alerts (email + Slack)
- Configure log aggregation (Logtail/Papertrail)
- Create Grafana dashboard (optional)

PHASE 6: CI/CD Pipeline
- Create .github/workflows/deploy.yml
- On push to main:
  * Run tests (unit + E2E)
  * Build frontend
  * Deploy to Netlify (automatic)
  * Deploy backend to Render (automatic)
  * Deploy Flask (manual trigger or SSH)
  * Run smoke tests
  * Send notification (Slack)
- On pull request:
  * Run tests only
  * Deploy to preview environment (Netlify)

PHASE 7: Security Hardening
- Enable rate limiting (100 req/min per IP)
- Add helmet.js security headers
- Configure CORS (whitelist production domains)
- Enable HTTPS everywhere
- Add CSP headers
- Disable directory listing
- Hide server version
- Add DDoS protection (Cloudflare)

PHASE 8: Performance Optimization
- Enable gzip compression
- Add CDN caching (Cloudflare)
- Optimize images (WebP)
- Minify JS/CSS
- Enable HTTP/2
- Add service worker (PWA)
- Optimize database queries (indexes)
- Add Redis caching (templates, users)

PHASE 9: Documentation & Runbooks
- Create DEPLOYMENT.md (deployment guide)
- Create RUNBOOK.md (incident response)
- Document rollback procedure
- Document scaling procedure
- Create architecture diagram
- Document environment variables
- Create troubleshooting guide

COMPLETION CRITERIA:
- Backend deployed and accessible (https://api.magflow.app)
- Frontend deployed and accessible (https://app.magflow.app)
- Flask deployed and accessible (https://flask.magflow.app)
- All services healthy (green status)
- HTTPS enabled everywhere
- Monitoring configured (Sentry, UptimeRobot)
- CI/CD pipeline working (tests + deploy)
- Backups configured
- Documentation complete
- Smoke tests passing
- No errors in production logs

If blocked after 25 iterations:
- Document deployment issues
- Show error logs
- List completed vs remaining
- Suggest manual steps if automation fails

Output <promise>DEPLOY_COMPLETE</promise> when all criteria met." --completion-promise "DEPLOY_COMPLETE" --max-iterations 40
```

---

### 💳 Prompt 6: Système de Paiement Stripe

```bash
/ralph-loop "Implement Stripe payment system with subscription plans for MagFlow.

PHASE 1: Stripe Setup
- Create Stripe account
- Install stripe npm package (backend)
- Install @stripe/stripe-js (frontend)
- Configure Stripe API keys (test mode first)
- Create products in Stripe Dashboard:
  * FREE (0€/month, 5 generations)
  * PRO (29€/month, 100 generations)
  * ENTERPRISE (custom pricing)
- Create prices for each product
- Set up webhook endpoint

PHASE 2: Backend Stripe Integration
Create backend/routes/stripe.js:
- POST /api/stripe/create-checkout-session
  * Create Stripe checkout session
  * Include plan metadata
  * Return session URL
- POST /api/stripe/webhook (Stripe webhooks)
  * Handle checkout.session.completed
  * Handle customer.subscription.created
  * Handle customer.subscription.updated
  * Handle customer.subscription.deleted
  * Handle invoice.payment_succeeded
  * Handle invoice.payment_failed
- GET /api/stripe/portal-session
  * Create customer portal session
  * Return portal URL
- Verify webhook signatures
- Write unit tests

PHASE 3: Database Schema
Update Supabase schema:
- Add columns to user_profiles:
  * stripe_customer_id (TEXT)
  * stripe_subscription_id (TEXT)
  * plan (TEXT) -- 'free', 'pro', 'enterprise'
  * quota_limit (INTEGER)
  * quota_used (INTEGER)
  * subscription_status (TEXT) -- 'active', 'canceled', 'past_due'
  * subscription_end_date (TIMESTAMP)
- Create subscriptions table:
  * id (UUID)
  * user_id (UUID FK)
  * stripe_subscription_id (TEXT)
  * plan (TEXT)
  * status (TEXT)
  * current_period_start (TIMESTAMP)
  * current_period_end (TIMESTAMP)
  * cancel_at_period_end (BOOLEAN)
- Add triggers for quota management

PHASE 4: Quota Management
Create backend/middleware/checkQuota.js:
- Check user's quota before generation
- Return 402 Payment Required if quota exceeded
- Increment quota_used on successful generation
- Reset quota_used monthly (cron job)
- Add quota info to API responses
- Write unit tests

PHASE 5: Frontend Pricing Page
Create src/pages/pricing/index.jsx:
- Display 3 plans (FREE, PRO, ENTERPRISE)
- Show features comparison table
- Add 'Subscribe' buttons
- Redirect to Stripe Checkout
- Handle success/cancel redirects
- Show current plan in user dashboard
- Add 'Manage Subscription' button (Stripe portal)
- Add quota usage indicator (progress bar)

PHASE 6: Subscription Management
Update src/pages/dashboard/index.jsx:
- Show current plan
- Show quota usage (X/100 generations)
- Show subscription status
- Add 'Upgrade' button (if free)
- Add 'Manage Subscription' button (Stripe portal)
- Show next billing date
- Show payment history

PHASE 7: Webhook Handling
Implement webhook handlers:
- checkout.session.completed:
  * Create user_profile if not exists
  * Update stripe_customer_id
  * Update stripe_subscription_id
  * Set plan to selected plan
  * Set quota_limit based on plan
  * Send welcome email
- customer.subscription.updated:
  * Update plan
  * Update quota_limit
  * Update subscription_status
  * Send email notification
- customer.subscription.deleted:
  * Set plan to 'free'
  * Set quota_limit to 5
  * Update subscription_status to 'canceled'
  * Send cancellation email
- invoice.payment_failed:
  * Update subscription_status to 'past_due'
  * Send payment failed email

PHASE 8: Testing
- Test checkout flow (test mode)
- Test subscription creation
- Test quota enforcement
- Test quota reset
- Test subscription cancellation
- Test payment failure
- Test webhook delivery
- Write E2E tests for payment flow

PHASE 9: Production Setup
- Switch to Stripe live mode
- Update API keys
- Configure webhook endpoint (production URL)
- Test with real payment (refund after)
- Set up fraud detection
- Configure email receipts
- Add terms of service
- Add privacy policy

COMPLETION CRITERIA:
- Stripe integrated (test mode working)
- 3 plans configured
- Checkout flow functional
- Webhooks handling all events
- Quota enforcement working
- Pricing page live
- Dashboard shows subscription info
- All tests passing
- Production ready (live mode tested)
- Documentation complete

If blocked after 20 iterations:
- Document Stripe errors
- Show webhook logs
- List completed vs remaining
- Suggest manual Stripe Dashboard config

Output <promise>STRIPE_COMPLETE</promise> when all criteria met." --completion-promise "STRIPE_COMPLETE" --max-iterations 30
```

---

### 📱 Prompt 7: Desktop Agent (Electron)

```bash
/ralph-loop "Create Desktop Agent Electron app for MagFlow local InDesign processing.

PHASE 1: Electron Setup
- Create new directory: desktop-agent/
- Initialize npm project
- Install dependencies:
  * electron
  * electron-builder (packaging)
  * socket.io-client
  * electron-store (settings)
  * electron-updater (auto-update)
- Create main.js (Electron main process)
- Create preload.js (IPC bridge)
- Create renderer/ (React UI)
- Configure electron-builder (build config)

PHASE 2: Main Process
Create desktop-agent/main.js:
- Create main window (800x600)
- Set up IPC handlers
- Implement system tray icon
- Add auto-launch on startup (optional)
- Handle app lifecycle (quit, minimize)
- Implement auto-updater
- Add logging (electron-log)

PHASE 3: WebSocket Connection
Create desktop-agent/services/websocket.js:
- Connect to backend WebSocket (wss://api.magflow.app)
- Implement reconnection logic (exponential backoff)
- Handle events:
  * agent:register (send agent info)
  * job:new (receive generation jobs)
  * job:status (send progress updates)
  * job:complete (send results)
- Add connection status indicator
- Handle authentication (JWT token)

PHASE 4: Job Queue
Create desktop-agent/services/jobQueue.js:
- Implement local job queue (FIFO)
- Store jobs in electron-store
- Process jobs sequentially
- Retry failed jobs (3 attempts)
- Track job status (pending, processing, completed, failed)
- Persist queue across restarts

PHASE 5: InDesign Integration
Create desktop-agent/services/indesign.js:
- Detect InDesign installation (macOS/Windows)
- Execute JSX scripts via AppleScript (macOS) or COM (Windows)
- Pass job data to InDesign (config.json)
- Monitor script execution
- Capture script output/errors
- Handle InDesign crashes
- Implement timeout (5min per job)

PHASE 6: UI (React)
Create desktop-agent/renderer/:
- Login screen (authenticate with backend)
- Dashboard:
  * Connection status (connected/disconnected)
  * Job queue (pending, processing, completed)
  * Job details (template, titre, status)
  * Progress indicator
  * Logs viewer
- Settings:
  * Backend URL
  * InDesign path
  * Auto-launch
  * Notifications
- About page (version, license)

PHASE 7: Notifications
- Show system notifications on:
  * New job received
  * Job completed
  * Job failed
  * Connection lost
- Add sound alerts (optional)
- Add badge count (pending jobs)

PHASE 8: Auto-Update
- Configure electron-updater
- Check for updates on startup
- Download updates in background
- Prompt user to restart
- Implement rollback on failure

PHASE 9: Packaging & Distribution
- Build for macOS (DMG, .app)
- Build for Windows (NSIS installer, .exe)
- Code signing (macOS: Apple Developer, Windows: Authenticode)
- Create auto-update server (GitHub Releases)
- Test installation on clean machines
- Create user guide (screenshots)

PHASE 10: Testing
- Test WebSocket connection
- Test job processing
- Test InDesign integration
- Test auto-update
- Test on macOS (Intel + Apple Silicon)
- Test on Windows 10/11
- Test reconnection logic
- Test queue persistence

COMPLETION CRITERIA:
- Electron app builds successfully
- WebSocket connection stable
- Jobs processed correctly
- InDesign integration working
- UI functional and responsive
- Auto-update working
- Packaged for macOS and Windows
- Code signed
- Tested on clean machines
- Documentation complete
- No crashes or memory leaks

If blocked after 25 iterations:
- Document build errors
- Show logs (main process, renderer)
- List completed vs remaining
- Suggest platform-specific fixes

Output <promise>AGENT_COMPLETE</promise> when all criteria met." --completion-promise "AGENT_COMPLETE" --max-iterations 35
```

---

## 📅 PLANNING DE FINALISATION

### Sprint 1 (Semaine 1) - Fondations Sécurité
**Durée :** 5 jours  
**Objectif :** Sécuriser l'application

- [ ] Jour 1-2: Authentification (Prompt 1)
- [ ] Jour 3: Supabase Storage (Prompt 2)
- [ ] Jour 4: Gestion d'erreurs (Prompt 3)
- [ ] Jour 5: Tests & Review

**Livrables :**
- Auth fonctionnelle
- Images stockées
- UX améliorée

---

### Sprint 2 (Semaine 2) - Qualité & Tests
**Durée :** 5 jours  
**Objectif :** Garantir la qualité

- [ ] Jour 1-3: Tests E2E complets (Prompt 4)
- [ ] Jour 4: Corrections bugs
- [ ] Jour 5: Review & optimisations

**Livrables :**
- >20 tests E2E
- Coverage >80%
- CI/CD configuré

---

### Sprint 3 (Semaine 3) - Déploiement
**Durée :** 5 jours  
**Objectif :** Mise en production

- [ ] Jour 1-2: Déploiement infra (Prompt 5)
- [ ] Jour 3: Monitoring & alertes
- [ ] Jour 4: Tests production
- [ ] Jour 5: Documentation

**Livrables :**
- App en production
- Monitoring actif
- Documentation complète

---

### Sprint 4 (Semaine 4) - Monétisation
**Durée :** 5 jours  
**Objectif :** Système de paiement

- [ ] Jour 1-3: Stripe integration (Prompt 6)
- [ ] Jour 4: Page pricing
- [ ] Jour 5: Tests paiement

**Livrables :**
- Stripe fonctionnel
- 3 plans actifs
- Quotas appliqués

---

### Sprint 5 (Semaine 5) - Desktop Agent
**Durée :** 5 jours  
**Objectif :** Différenciateur produit

- [ ] Jour 1-4: Desktop Agent (Prompt 7)
- [ ] Jour 5: Tests & packaging

**Livrables :**
- App Electron fonctionnelle
- Installeurs macOS/Windows

---

### Sprint 6 (Semaine 6) - Polish & Launch
**Durée :** 5 jours  
**Objectif :** Préparation lancement

- [ ] Jour 1: Documentation utilisateur
- [ ] Jour 2: Tutoriels vidéo
- [ ] Jour 3: Marketing (landing page, blog)
- [ ] Jour 4: Tests utilisateurs beta
- [ ] Jour 5: Launch 🚀

**Livrables :**
- Documentation complète
- 5 tutoriels vidéo
- Landing page
- Beta testeurs

---

## 🎯 CRITÈRES DE COMMERCIALISATION

### Must Have (Bloquants) ✅

- [x] Authentification fonctionnelle
- [x] Paiements Stripe intégrés
- [x] Quotas par plan appliqués
- [x] Déployé en production (HTTPS)
- [x] Monitoring actif (Sentry, UptimeRobot)
- [x] Tests E2E >80% coverage
- [x] Documentation utilisateur
- [x] Pas de bugs critiques
- [x] Performance acceptable (<3s load)
- [x] Sécurité validée (pas de clés exposées)

### Should Have (Important) 🔄

- [ ] Desktop Agent fonctionnel
- [ ] Supabase Storage pour images
- [ ] Gestion d'erreurs complète
- [ ] Tutoriels vidéo (3-5)
- [ ] FAQ complète
- [ ] Support email configuré
- [ ] Analytics (Plausible/Umami)
- [ ] Blog avec use cases

### Nice to Have (Bonus) 💡

- [ ] Prévisualisation PDF
- [ ] Templates marketplace
- [ ] Multi-langues (i18n)
- [ ] Mobile app
- [ ] Intégration Figma
- [ ] IA générative pour images
- [ ] Collaboration temps réel

---

## 💰 ESTIMATION COÛTS

### Développement
- **Temps total :** 30 jours (6 semaines)
- **Coût développeur :** 500€/jour
- **Total développement :** 15,000€

### Infrastructure (Mensuel)
- **Render (Backend) :** 25€/mois
- **Netlify (Frontend) :** 0€ (gratuit)
- **VPS Flask (Hetzner) :** 20€/mois
- **Supabase Pro :** 25€/mois
- **Sentry :** 26€/mois
- **Domaines :** 20€/an
- **Total mensuel :** ~100€/mois

### Services Tiers
- **Stripe :** 1.4% + 0.25€ par transaction
- **OpenAI API :** ~0.01€ par analyse
- **Stockage images :** Inclus Supabase

### ROI Estimé
- **Prix PRO :** 29€/mois
- **Objectif :** 50 clients PRO (1,450€/mois)
- **Marge nette :** ~1,350€/mois
- **Break-even :** 11 mois

---

## 🚀 STRATÉGIE DE LANCEMENT

### Phase 1: Beta Privée (Semaine 1-2)
- Inviter 10-20 beta testeurs
- Collecter feedback
- Corriger bugs critiques
- Itérer sur UX

### Phase 2: Beta Publique (Semaine 3-4)
- Ouvrir inscriptions (plan FREE)
- Marketing (Product Hunt, Reddit, Twitter)
- Créer contenu (blog, vidéos)
- Support actif (Discord/Slack)

### Phase 3: Launch Officiel (Semaine 5-6)
- Activer plans payants (PRO, ENTERPRISE)
- Campagne marketing (ads, influenceurs)
- Communiqué de presse
- Partenariats (agences, éditeurs)

### Phase 4: Croissance (Mois 2-6)
- Optimiser conversion (A/B tests)
- Ajouter fonctionnalités demandées
- Développer Desktop Agent
- Expansion internationale

---

## 📊 KPIs À SUIVRE

### Acquisition
- Visiteurs uniques/mois
- Inscriptions/mois
- Taux de conversion (visiteur → inscription)
- Sources de trafic

### Engagement
- Générations/utilisateur/mois
- Temps moyen par session
- Taux de rétention (D7, D30)
- Templates les plus utilisés

### Monétisation
- MRR (Monthly Recurring Revenue)
- Taux de conversion (FREE → PRO)
- Churn rate
- LTV (Lifetime Value)

### Technique
- Uptime (objectif >99%)
- Temps de génération moyen
- Taux d'erreur
- Performance (Lighthouse score)

---

## ✅ CHECKLIST FINALE

### Avant Lancement
- [ ] Tous les prompts Ralph Loop exécutés
- [ ] Tous les tests passent (unit + E2E)
- [ ] App déployée en production
- [ ] Monitoring configuré
- [ ] Stripe en mode live
- [ ] Documentation complète
- [ ] Tutoriels vidéo créés
- [ ] Landing page live
- [ ] Support email configuré
- [ ] Conditions d'utilisation + Politique de confidentialité
- [ ] RGPD compliant
- [ ] Beta testeurs satisfaits (>8/10)
- [ ] Pas de bugs critiques
- [ ] Performance validée
- [ ] Sécurité auditée

### Post-Lancement
- [ ] Monitoring quotidien
- [ ] Support utilisateurs réactif (<24h)
- [ ] Corrections bugs rapides
- [ ] Itérations basées sur feedback
- [ ] Marketing continu
- [ ] Développement nouvelles features

---

**Total estimé pour commercialisation :** 6 semaines de développement intensif avec Ralph Loop

**Prochaine étape :** Exécuter les prompts Ralph Loop dans l'ordre de priorité (Auth → Storage → UX → Tests → Deploy → Stripe → Agent)
