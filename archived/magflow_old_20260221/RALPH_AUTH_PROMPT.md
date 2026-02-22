# 🔐 RALPH LOOP - AUTHENTIFICATION SUPABASE

**Objectif :** Implémenter l'authentification complète pour MagFlow  
**Durée estimée :** 3-5 jours  
**Priorité :** P0 (Bloquant commercialisation)

---

## 📋 PROMPT RALPH LOOP

Copier-coller ce prompt dans Claude Code avec la commande `/ralph-loop` :

```bash
/ralph-loop "Complete Supabase authentication system for MagFlow production.

PHASE 1: Backend Authentication
Tasks:
- Implement Supabase Auth in backend/routes/auth.js
- Add endpoints:
  * POST /api/auth/register (email, password, name)
  * POST /api/auth/login (email, password)
  * POST /api/auth/logout
  * POST /api/auth/refresh-token
  * GET /api/auth/me (get current user)
  * POST /api/auth/reset-password (email)
  * POST /api/auth/update-password (token, new password)
- Create middleware backend/middleware/verifyToken.js:
  * Extract JWT from Authorization header
  * Verify token with Supabase
  * Attach user to req.user
  * Return 401 if invalid/expired
- Protect routes in backend/server.js:
  * /api/magazine/* (all methods)
  * /api/templates/upload* (POST)
  * /api/upload/* (POST)
- Add rate limiting middleware (express-rate-limit):
  * 100 requests per 15min per IP
  * 5 login attempts per 15min per IP
- Add password validation (min 8 chars, 1 uppercase, 1 number)
- Add email validation (valid format)
- Write unit tests in backend/tests/auth.test.js (coverage >80%)

PHASE 2: Frontend Integration
Tasks:
- Install @supabase/supabase-js in frontend
- Create src/contexts/AuthContext.jsx:
  * Provide: user, session, loading, login, logout, register
  * Handle token refresh automatically
  * Persist session in localStorage
- Update src/pages/auth/login/index.jsx:
  * Add email/password form (React Hook Form)
  * Call AuthContext.login()
  * Show errors (toast notifications)
  * Redirect to /dashboard on success
  * Add 'Forgot password?' link
- Update src/pages/auth/register/index.jsx:
  * Add email/password/name form
  * Validate password strength (show indicator)
  * Call AuthContext.register()
  * Show errors
  * Redirect to /dashboard on success
- Create src/components/PrivateRoute.jsx:
  * Check if user authenticated
  * Redirect to /login if not
  * Show loading spinner while checking
- Update src/Routes.jsx:
  * Wrap protected routes with PrivateRoute
  * Routes: /dashboard, /smart-content-creator, /template-gallery, /admin/*
- Create src/pages/profile/index.jsx:
  * Show user info (name, email, plan)
  * Add logout button
  * Add change password form
- Update src/services/api.js:
  * Add Authorization header to all requests
  * Handle 401 errors (redirect to login)
  * Retry with refreshed token
- Write E2E tests in e2e/auth.spec.js:
  * Test registration flow
  * Test login flow
  * Test logout
  * Test protected routes redirect
  * Test password reset

PHASE 3: Database Security (Supabase)
Tasks:
- Enable Row Level Security on tables:
  * indesign_templates
  * magazine_generations
- Add user_id column to magazine_generations:
  * ALTER TABLE magazine_generations ADD COLUMN user_id UUID REFERENCES auth.users(id)
  * Create index on user_id
- Create RLS policies:
  * indesign_templates:
    - SELECT: Public (everyone can read)
    - INSERT/UPDATE/DELETE: Authenticated users only
  * magazine_generations:
    - SELECT: Users see only their own (user_id = auth.uid())
    - INSERT: Authenticated users (set user_id = auth.uid())
    - UPDATE/DELETE: Users can only modify their own
- Create user_profiles table:
  CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    quota_limit INTEGER DEFAULT 5,
    quota_used INTEGER DEFAULT 0,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT,
    subscription_end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )
- Enable RLS on user_profiles:
  * SELECT: Users see only their own
  * UPDATE: Users can update only their own
- Create trigger to create user_profile on auth.users insert
- Test RLS policies (try to access other users' data)

PHASE 4: Security Hardening
Tasks:
- Remove VITE_OPENAI_API_KEY from frontend .env
- Move all OpenAI calls to backend:
  * Update backend/routes/content.js to use server-side OpenAI key
  * Remove src/services/contentAnalysisService.js OpenAI calls
- Update CORS in backend/server.js:
  * Whitelist only: http://localhost:5173 (dev), https://app.magflow.app (prod)
  * Remove wildcard '*'
- Add helmet.js security headers:
  * npm install helmet
  * app.use(helmet())
- Add express-validator for input sanitization:
  * Sanitize email, password, name inputs
  * Prevent SQL injection
  * Prevent XSS attacks
- Add CSRF protection (csurf):
  * Generate CSRF tokens
  * Validate on POST/PUT/DELETE
- Hash passwords with bcrypt (if not using Supabase Auth)
- Add security headers:
  * X-Content-Type-Options: nosniff
  * X-Frame-Options: DENY
  * X-XSS-Protection: 1; mode=block
  * Strict-Transport-Security: max-age=31536000
- Test security:
  * Try SQL injection
  * Try XSS
  * Try CSRF
  * Verify no API keys in frontend bundle

PHASE 5: Quota Management
Tasks:
- Create backend/middleware/checkQuota.js:
  * Query user_profiles.quota_used and quota_limit
  * Return 402 Payment Required if quota_used >= quota_limit
  * Increment quota_used on successful generation
- Add checkQuota middleware to POST /api/magazine/generate
- Update backend/routes/magazine.js:
  * After successful generation, increment quota_used
  * Return quota info in response: { quotaUsed: X, quotaLimit: Y }
- Create cron job to reset quotas monthly:
  * UPDATE user_profiles SET quota_used = 0 WHERE plan = 'free' OR plan = 'pro'
  * Run on 1st of each month
- Update frontend to show quota:
  * Display in dashboard: 'X/Y generations this month'
  * Show progress bar
  * Show warning at 80% usage
  * Block generation at 100% (show upgrade CTA)
- Test quota enforcement:
  * Generate until quota reached
  * Verify 402 error
  * Verify frontend shows upgrade message

PHASE 6: Testing & Documentation
Tasks:
- Write unit tests (Vitest):
  * backend/tests/auth.test.js (all endpoints)
  * backend/tests/middleware/verifyToken.test.js
  * backend/tests/middleware/checkQuota.test.js
  * Target coverage >80%
- Write E2E tests (Playwright):
  * e2e/auth.spec.js (registration, login, logout, protected routes)
  * e2e/quota.spec.js (quota enforcement, upgrade flow)
  * Target coverage >80%
- Update documentation:
  * Document API endpoints (Swagger/OpenAPI format)
  * Document authentication flow (diagram)
  * Document RLS policies
  * Update README.md with auth setup instructions
- Create migration guide:
  * SQL scripts to run
  * Environment variables to add
  * Frontend changes needed

COMPLETION CRITERIA (ALL MUST BE MET):
1. All auth endpoints working (tested with Postman/curl)
2. Protected routes require valid JWT (401 if not authenticated)
3. RLS enabled on all tables (tested - users can't see others' data)
4. No API keys exposed in frontend (verified in browser DevTools)
5. All tests passing (unit + E2E coverage >80%)
6. No console errors in browser
7. No errors in backend logs
8. Quota enforcement working (tested - blocks at limit)
9. Security headers present (verified with securityheaders.com)
10. Documentation updated (API docs, README)
11. Frontend login/register flows working (tested manually)
12. Token refresh working (tested - no logout after 1 hour)
13. Password reset working (tested - email sent, password changed)
14. Rate limiting working (tested - blocks after 5 failed logins)
15. Input validation working (tested - rejects invalid emails/passwords)

DEBUGGING GUIDELINES:
If stuck after 15 iterations:
- Document what's blocking progress (specific error messages)
- List completed tasks vs remaining tasks
- Provide error logs (backend console, browser console, Supabase logs)
- Suggest alternative approaches or manual steps
- Check common issues:
  * Supabase URL/keys correct?
  * CORS configured properly?
  * RLS policies correct syntax?
  * JWT token format correct?
  * Environment variables loaded?

IMPORTANT NOTES:
- Use Supabase Auth (don't implement custom auth from scratch)
- Test each phase before moving to next
- Run tests frequently (npm test)
- Check Supabase dashboard for RLS policy errors
- Use Postman to test API endpoints
- Check browser DevTools Network tab for auth errors
- Commit after each working phase (git commit)

Output <promise>AUTH_COMPLETE</promise> when ALL completion criteria are met and verified." --completion-promise "AUTH_COMPLETE" --max-iterations 30
```

---

## 🚀 INSTRUCTIONS D'EXÉCUTION

### 1. Préparer l'Environnement

```bash
# Se placer dans le projet
cd /Users/alexandreerrasti/magflow0312/magflow

# Vérifier que les services sont arrêtés
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5003 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Créer une branche pour l'auth
git checkout -b feature/authentication

# Installer les dépendances si nécessaire
cd backend && npm install
cd .. && npm install
```

### 2. Vérifier Supabase

```bash
# Vérifier que les clés Supabase sont configurées
cat backend/.env | grep SUPABASE
cat .env | grep SUPABASE

# Si manquantes, les ajouter depuis https://wxtrhxvyjfsqgphboqwo.supabase.co
```

### 3. Lancer Ralph Loop

Dans Claude Code, exécuter :

```bash
/ralph-loop "Complete Supabase authentication system for MagFlow production.
[... copier tout le prompt ci-dessus ...]
" --completion-promise "AUTH_COMPLETE" --max-iterations 30
```

### 4. Suivre la Progression

Ralph Loop va itérer automatiquement. Surveiller :
- Logs backend (terminal)
- Logs frontend (terminal)
- Tests (npm test)
- Commits Git (git log)

### 5. Vérification Manuelle

Après `AUTH_COMPLETE`, tester manuellement :

```bash
# 1. Démarrer les services
cd backend && npm run dev &
cd .. && npm run dev &

# 2. Tester l'API
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'

curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# 3. Tester le frontend
open http://localhost:5173/login
# Essayer de se connecter

# 4. Vérifier RLS
# Aller dans Supabase Dashboard > Authentication > Policies
# Vérifier que les policies sont actives

# 5. Lancer les tests
cd backend && npm test
npm run test:e2e
```

---

## ✅ CHECKLIST DE VALIDATION

Après `AUTH_COMPLETE`, vérifier :

### Backend
- [ ] Endpoint `/api/auth/register` fonctionne
- [ ] Endpoint `/api/auth/login` fonctionne
- [ ] Endpoint `/api/auth/logout` fonctionne
- [ ] Endpoint `/api/auth/me` fonctionne
- [ ] Middleware `verifyToken` protège les routes
- [ ] Rate limiting actif (5 tentatives max)
- [ ] Tests unitaires passent (>80% coverage)

### Frontend
- [ ] Page `/login` fonctionne
- [ ] Page `/register` fonctionne
- [ ] `AuthContext` fournit user/session
- [ ] Routes protégées redirigent vers `/login`
- [ ] Token refresh automatique
- [ ] Logout fonctionne
- [ ] Tests E2E passent

### Sécurité
- [ ] RLS activé sur toutes les tables
- [ ] Pas de clés API dans le bundle frontend
- [ ] CORS configuré (pas de wildcard)
- [ ] Headers de sécurité présents
- [ ] Input validation active
- [ ] SQL injection impossible

### Quota
- [ ] Quota affiché dans dashboard
- [ ] Génération bloquée à 100%
- [ ] Quota incrémenté après génération
- [ ] Message d'upgrade affiché

### Documentation
- [ ] API docs à jour
- [ ] README mis à jour
- [ ] Diagramme d'authentification créé
- [ ] Migration SQL documentée

---

## 🐛 PROBLÈMES COURANTS

### Erreur: "Invalid JWT"
```bash
# Vérifier les clés Supabase
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Vérifier le format du token
# Doit être: "Bearer eyJhbGc..."
```

### Erreur: "CORS blocked"
```bash
# Vérifier backend/server.js
# CORS doit inclure http://localhost:5173
```

### Erreur: "RLS policy violation"
```bash
# Aller dans Supabase Dashboard
# SQL Editor > Exécuter:
SELECT * FROM pg_policies WHERE tablename = 'magazine_generations';

# Vérifier la syntaxe des policies
```

### Tests échouent
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install

# Relancer les tests
npm test -- --run
```

---

## 📊 MÉTRIQUES DE SUCCÈS

À la fin de l'implémentation :

- **Endpoints créés :** 7
- **Middleware créés :** 2
- **Tables modifiées :** 2
- **Policies RLS :** 6+
- **Tests unitaires :** 15+
- **Tests E2E :** 10+
- **Coverage :** >80%
- **Temps estimé :** 3-5 jours

---

## 🎯 PROCHAINES ÉTAPES

Après `AUTH_COMPLETE` :

1. **Merger la branche**
   ```bash
   git checkout main
   git merge feature/authentication
   git push origin main
   ```

2. **Passer au Prompt 2 : Supabase Storage**
   - Voir `ROADMAP_COMMERCIALISATION.md`

3. **Tester en production**
   - Déployer sur Render/Netlify
   - Vérifier que l'auth fonctionne

---

**Prêt à lancer ? Copier le prompt Ralph Loop et exécuter `/ralph-loop` dans Claude Code !** 🚀
