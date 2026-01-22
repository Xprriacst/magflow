# Story 1.2: Backend Auth Middleware

**Epic:** Multi-User SaaS Freemium Transformation
**Story ID:** 1.2
**Priority:** P0 (Critical)
**Status:** Draft
**Estimate:** 1 day
**Dependencies:** Story 1.1 (DB schema with profiles table)

---

## Story

**As a** backend developer,
**I want** to implement JWT authentication middleware using Supabase Auth,
**so that** all API endpoints are protected and user identity is validated.

---

## Acceptance Criteria

### AC1: Auth Middleware Created
- [ ] File `backend/middleware/auth.js` exists
- [ ] Validates JWT token from `Authorization: Bearer <token>` header
- [ ] Extracts user_id from token payload
- [ ] Attaches `req.user` object for downstream use
- [ ] Returns 401 with clear error if invalid/missing token

### AC2: Middleware Applied to Routes
- [ ] All existing routes protected with `requireAuth`:
  - `/api/content/*` (content analysis)
  - `/api/templates/*` (template management)
  - `/api/magazine/*` (magazine generation)
- [ ] Middleware applied before route handlers
- [ ] Health endpoint `/health` remains public (no auth)

### AC3: Auth Routes Created
- [ ] File `backend/routes/auth.js` exists
- [ ] Route: `POST /api/auth/signup` (proxy to Supabase)
- [ ] Route: `POST /api/auth/login` (proxy to Supabase)
- [ ] Route: `POST /api/auth/logout` (clear session)
- [ ] Error handling with user-friendly messages

### AC4: Error Handling
- [ ] 401 errors properly formatted: `{ error: "Unauthorized", message: "..." }`
- [ ] Frontend can parse and display errors
- [ ] No sensitive info leaked in error messages

---

## Tasks

### Task 1: Create Auth Middleware
- [ ] Create file `backend/middleware/auth.js`
- [ ] Import Supabase client with service key
- [ ] Implement `requireAuth(req, res, next)` function
- [ ] Extract token from `Authorization: Bearer <token>` header
- [ ] Validate token with `supabase.auth.getUser(token)`
- [ ] If valid: attach `req.user = { id, email, role, ... }` and call `next()`
- [ ] If invalid: return `res.status(401).json({ error: "Unauthorized" })`

**Subtasks:**
- [ ] Handle missing Authorization header
- [ ] Handle malformed token (not "Bearer ...")
- [ ] Handle expired token (Supabase returns error)
- [ ] Handle invalid token signature
- [ ] Fetch user profile from `profiles` table (get role, subscription_tier)
- [ ] Attach full user object to `req.user`

### Task 2: Apply Middleware to Existing Routes
- [ ] Open `backend/server.js`
- [ ] Import `requireAuth` from `./middleware/auth.js`
- [ ] Apply to content routes: `app.use('/api/content', requireAuth, contentRoutes)`
- [ ] Apply to template routes: `app.use('/api/templates', requireAuth, templateRoutes)`
- [ ] Apply to magazine routes: `app.use('/api/magazine', requireAuth, magazineRoutes)`
- [ ] Keep `/health` public (no middleware)

**Subtasks:**
- [ ] Verify route order (middleware before routes)
- [ ] Test that unauthenticated requests return 401
- [ ] Test that authenticated requests work

### Task 3: Create Auth Routes
- [ ] Create file `backend/routes/auth.js`
- [ ] Import Express Router
- [ ] Import Supabase client

**Route: POST /api/auth/signup**
- [ ] Accept `{ email, password, company_name }` from request body
- [ ] Call `supabase.auth.signUp({ email, password })`
- [ ] Return JWT + user data to client
- [ ] Handle errors (email already exists, weak password)

**Route: POST /api/auth/login**
- [ ] Accept `{ email, password }` from request body
- [ ] Call `supabase.auth.signInWithPassword({ email, password })`
- [ ] Return JWT + user data to client
- [ ] Handle errors (invalid credentials)

**Route: POST /api/auth/logout**
- [ ] Accept JWT from header (requireAuth middleware)
- [ ] Call `supabase.auth.signOut()`
- [ ] Return success message
- [ ] Handle errors

**Subtasks:**
- [ ] Add input validation (email format, password min length)
- [ ] Add rate limiting (prevent brute force)
- [ ] Log auth events to usage_logs table

### Task 4: Update Existing Routes to Use req.user
- [ ] Open `backend/routes/magazine.js`
- [ ] Replace hardcoded user data with `req.user.id`
- [ ] Example: `const userId = req.user.id;`
- [ ] Open `backend/routes/templates.js`
- [ ] Filter templates by `user_id = req.user.id`
- [ ] Open `backend/routes/content.js`
- [ ] Use `req.user.id` for logging/analytics

**Subtasks:**
- [ ] Search for all places that need user context
- [ ] Replace with `req.user`
- [ ] Test that users only see their own data

### Task 5: Write Tests
- [ ] Create `backend/tests/middleware/auth.test.js`
- [ ] Test: Valid JWT → req.user attached, next() called
- [ ] Test: Missing Authorization header → 401
- [ ] Test: Invalid JWT → 401
- [ ] Test: Expired JWT → 401
- [ ] Create `backend/tests/routes/auth.test.js`
- [ ] Test: POST /api/auth/signup with valid data → 201 + JWT
- [ ] Test: POST /api/auth/login with valid credentials → 200 + JWT
- [ ] Test: POST /api/auth/login with invalid credentials → 401

---

## Integration Verification

### IV1: Existing Playwright Tests Updated
**Test:** Update e2e tests to include authentication
- [ ] Add test helper to login and get JWT
- [ ] Update all test requests to include Authorization header
- [ ] Tests still pass after auth middleware added

### IV2: Health Endpoint Remains Public
**Test:** GET /health without auth header
- [ ] Returns 200 OK
- [ ] No authentication required

### IV3: Protected Endpoints Return 401
**Test:** GET /api/templates without auth header
- [ ] Returns 401 Unauthorized
- [ ] Error message clear and actionable

---

## Dev Notes

### Context from Architecture
- Supabase Auth uses JWT (JSON Web Tokens)
- Frontend will send token in `Authorization: Bearer <token>` header
- Backend validates token with Supabase SDK
- User profile data fetched from `profiles` table (created in Story 1.1)

### Technical Decisions
- Use Supabase service key in backend (not anon key)
- Middleware extracts user_id and role for authorization
- All routes except /health and /api/auth/* require auth
- Rate limiting on auth endpoints (prevent brute force)

### Execution Order
1. Create middleware/auth.js
2. Create routes/auth.js
3. Apply middleware to existing routes in server.js
4. Update existing routes to use req.user
5. Write and run tests
6. Update e2e tests with auth

### Dependencies
- `@supabase/supabase-js` (already installed)
- `express-rate-limit` (install for rate limiting)

### Environment Variables Needed
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...  # Service role key (not anon key!)
```

---

## Testing

### Unit Tests
- [ ] `auth.test.js`: Middleware with valid/invalid tokens
- [ ] `auth.routes.test.js`: Signup/login/logout endpoints

### Integration Tests
- [ ] Test: Signup → Profile auto-created (via trigger from Story 1.1)
- [ ] Test: Login → JWT returned, can access protected endpoint
- [ ] Test: Invalid JWT → All protected endpoints return 401

### Acceptance Tests
- [ ] Manual test: Signup via Postman → Get JWT
- [ ] Manual test: Use JWT to GET /api/templates → Success
- [ ] Manual test: GET /api/templates without JWT → 401

---

## Dev Agent Record

### Tasks Completed
- [ ] Task 1: Create Auth Middleware
- [ ] Task 2: Apply Middleware to Existing Routes
- [ ] Task 3: Create Auth Routes
- [ ] Task 4: Update Existing Routes to Use req.user
- [ ] Task 5: Write Tests

### Agent Model Used
- Not started yet

### Debug Log References
- None yet

### Completion Notes
- None yet

### File List
*Will be populated by dev agent during implementation*

**Expected files:**
- `backend/middleware/auth.js` (NEW)
- `backend/routes/auth.js` (NEW)
- `backend/server.js` (MODIFIED - apply middleware)
- `backend/routes/magazine.js` (MODIFIED - use req.user)
- `backend/routes/templates.js` (MODIFIED - use req.user)
- `backend/routes/content.js` (MODIFIED - use req.user)
- `backend/tests/middleware/auth.test.js` (NEW)
- `backend/tests/routes/auth.test.js` (NEW)

### Change Log
- 2026-01-09: Story created by John (PM) from PRD Story 1.2

---

## Blockers
- None (Story 1.1 must be completed first)

---

## References
- [PRD Section 5: Story 1.2](../prd.md#story-12-backend-auth-middleware)
- [Architecture Doc: Authentication & Authorization](../architecture.md#authentication--authorization)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

---

**Ready for Development:** ✅ (depends on Story 1.1 completion)
