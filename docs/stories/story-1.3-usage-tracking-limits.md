# Story 1.3: Usage Tracking & Limits Backend

**Epic:** Multi-User SaaS Freemium Transformation
**Story ID:** 1.3
**Priority:** P0 (Critical)
**Status:** Draft
**Estimate:** 1.5 days
**Dependencies:** Story 1.2 (Auth middleware provides user_id)

---

## Story

**As a** backend developer,
**I want** to implement usage tracking and monthly limit enforcement,
**so that** free users are limited to 5 generations/month and Pro users have unlimited access.

---

## Acceptance Criteria

### AC1: Usage Service Created
- [ ] File `backend/services/usageService.js` exists with functions:
  - `getUserUsage(userId)` - Returns current month count
  - `canUserGenerate(userId)` - Checks if under limit
  - `incrementUsage(userId, action)` - Logs generation
  - `resetMonthlyUsage()` - Cron job function
- [ ] All functions tested and working

### AC2: Usage Middleware Created
- [ ] File `backend/middleware/usage.js` exists
- [ ] Checks usage before `/api/magazine/generate` endpoint
- [ ] Returns 403 with clear message if limit reached
- [ ] Suggests upgrade to Pro in error response
- [ ] Pro users bypass limit check (monthly_limit = -1)

### AC3: User Usage Endpoint
- [ ] Route `GET /api/user/usage` returns:
  ```json
  {
    "used": 3,
    "limit": 5,
    "plan": "free",
    "resetDate": "2026-02-01"
  }
  ```
- [ ] Authenticated users can check their own usage
- [ ] Response accurate and real-time

### AC4: Monthly Reset Cron Job
- [ ] Cron job configured (node-cron)
- [ ] Runs on 1st of each month at 00:00
- [ ] Calls `resetMonthlyUsage()` function
- [ ] Updates all users: `monthly_generations_used = 0`
- [ ] Logs execution to usage_logs

---

## Tasks

### Task 1: Create Usage Service
- [ ] Create file `backend/services/usageService.js`
- [ ] Import Supabase client

**Function: getUserUsage(userId)**
- [ ] Query profiles table: `SELECT monthly_generations_used, monthly_limit, subscription_tier, usage_reset_date`
- [ ] Return object with usage stats
- [ ] Handle errors (user not found)

**Function: canUserGenerate(userId)**
- [ ] Call `getUserUsage(userId)`
- [ ] If `monthly_limit === -1` (Pro): return `true`
- [ ] If `monthly_generations_used < monthly_limit`: return `true`
- [ ] Else: return `false`

**Function: incrementUsage(userId, action = 'generation')**
- [ ] Update profiles: `monthly_generations_used = monthly_generations_used + 1`
- [ ] Insert into usage_logs: `(user_id, action, metadata, created_at)`
- [ ] Return updated usage count

**Function: resetMonthlyUsage()**
- [ ] Update all profiles: `monthly_generations_used = 0, usage_reset_date = next month`
- [ ] WHERE `usage_reset_date <= CURRENT_DATE`
- [ ] Log reset event to usage_logs
- [ ] Return count of users reset

**Subtasks:**
- [ ] Add error handling for each function
- [ ] Add logging for debugging
- [ ] Export all functions from usageService.js

### Task 2: Create Usage Middleware
- [ ] Create file `backend/middleware/usage.js`
- [ ] Import usageService

**Function: checkUsageLimit(req, res, next)**
- [ ] Get userId from `req.user.id` (set by auth middleware)
- [ ] Call `usageService.canUserGenerate(userId)`
- [ ] If `true`: call `next()` to proceed
- [ ] If `false`: return 403 with error:
  ```json
  {
    "error": "Usage limit reached",
    "message": "You've used all 5 free generations this month.",
    "upgrade": true,
    "upgradeUrl": "/upgrade"
  }
  ```

**Subtasks:**
- [ ] Handle edge cases (userId missing, service error)
- [ ] Log limit enforcement events
- [ ] Export checkUsageLimit

### Task 3: Apply Middleware to Magazine Generation
- [ ] Open `backend/server.js`
- [ ] Import `checkUsageLimit` from `./middleware/usage.js`
- [ ] Apply ONLY to `/api/magazine/generate` endpoint:
  ```javascript
  app.post('/api/magazine/generate', requireAuth, checkUsageLimit, magazineController.generate);
  ```
- [ ] Test that middleware runs after auth, before handler

**Subtasks:**
- [ ] Verify middleware order (auth → usage → handler)
- [ ] Test free user blocked after 5 generations
- [ ] Test pro user not blocked

### Task 4: Create User Usage Endpoint
- [ ] Create or open `backend/routes/user.js`
- [ ] Import usageService

**Route: GET /api/user/usage**
- [ ] Require authentication (requireAuth middleware)
- [ ] Get userId from `req.user.id`
- [ ] Call `usageService.getUserUsage(userId)`
- [ ] Return formatted response with usage stats
- [ ] Handle errors (user not found)

**Subtasks:**
- [ ] Add route to server.js: `app.use('/api/user', requireAuth, userRoutes);`
- [ ] Test endpoint with valid JWT
- [ ] Verify response format matches AC3

### Task 5: Increment Usage on Generation
- [ ] Open `backend/routes/magazine.js` (or controller)
- [ ] Find the generation endpoint handler
- [ ] After successful generation start, call:
  ```javascript
  await usageService.incrementUsage(req.user.id, 'generation');
  ```
- [ ] Place AFTER generation initiated (not before, to avoid charging for failed attempts)
- [ ] Handle errors (don't fail generation if logging fails)

**Subtasks:**
- [ ] Determine best placement (after queue job started? after completion?)
- [ ] Add error handling (log error but don't block generation)
- [ ] Test that usage increments correctly

### Task 6: Setup Monthly Reset Cron Job
- [ ] Install `node-cron`: `npm install node-cron`
- [ ] Create file `backend/cron/resetUsage.js`
- [ ] Import cron and usageService
- [ ] Schedule job:
  ```javascript
  cron.schedule('0 0 1 * *', async () => {
    console.log('Running monthly usage reset...');
    const count = await usageService.resetMonthlyUsage();
    console.log(`Reset usage for ${count} users`);
  });
  ```
- [ ] Import and start cron in `backend/server.js`

**Subtasks:**
- [ ] Test cron job manually (change schedule to `* * * * *` for every minute)
- [ ] Verify resets all users correctly
- [ ] Restore correct schedule: `0 0 1 * *` (midnight on 1st of month)
- [ ] Add logging to usage_logs table

### Task 7: Write Tests
- [ ] Create `backend/tests/services/usageService.test.js`
- [ ] Test: `getUserUsage()` returns correct stats
- [ ] Test: `canUserGenerate()` returns true if under limit
- [ ] Test: `canUserGenerate()` returns false if at/over limit
- [ ] Test: `canUserGenerate()` returns true for pro users (limit = -1)
- [ ] Test: `incrementUsage()` increases count by 1
- [ ] Test: `resetMonthlyUsage()` sets all users to 0

- [ ] Create `backend/tests/middleware/usage.test.js`
- [ ] Test: `checkUsageLimit` calls next() if under limit
- [ ] Test: `checkUsageLimit` returns 403 if limit reached
- [ ] Test: `checkUsageLimit` allows pro users through

---

## Integration Verification

### IV1: Free User Blocked After 5th Generation
**Test:** Create free user, generate 5 magazines, attempt 6th
- [ ] Generations 1-5 succeed (200 OK)
- [ ] Generation 6 returns 403 with clear error message
- [ ] Usage count accurate in database

### IV2: Pro User Not Blocked
**Test:** Create pro user, generate 10 magazines
- [ ] All 10 generations succeed
- [ ] No limit enforcement
- [ ] Usage logged but not blocked

### IV3: Usage Counter Accurate
**Test:** Check race conditions with concurrent requests
- [ ] Make 3 concurrent generation requests
- [ ] Verify usage count increments correctly (no race condition)
- [ ] Use database transactions if needed

---

## Dev Notes

### Context from Architecture
- Freemium model: 5 gen/month free, unlimited for pro
- `monthly_limit` in profiles table: 5 for free, -1 for unlimited
- Usage tracked in `usage_logs` table (audit trail)
- Reset happens automatically on 1st of each month

### Technical Decisions
- Middleware pattern for reusability
- Service layer for business logic separation
- Cron job for monthly reset (could also use Supabase functions)
- Increment AFTER generation starts (not before, to avoid charging for failed attempts)

### Execution Order
1. Create usageService.js with all functions
2. Create usage.js middleware
3. Apply middleware to magazine generation endpoint
4. Create user usage endpoint
5. Add incrementUsage() call to generation flow
6. Setup cron job
7. Write and run tests

### Edge Cases to Handle
- What if user is exactly at limit (used = 5, limit = 5)?
- What if cron job fails to run? (Manual reset procedure)
- What if generation fails after incrementing usage? (Acceptable, logged in usage_logs)

### Environment Variables
- None new (uses existing Supabase config)

---

## Testing

### Unit Tests
- [ ] `usageService.test.js`: All service functions
- [ ] `usage.middleware.test.js`: Middleware logic

### Integration Tests
- [ ] Test: Free user lifecycle (signup → 5 gens → blocked → upgrade → unlimited)
- [ ] Test: Cron job resets usage correctly
- [ ] Test: Concurrent requests don't cause race conditions

### Acceptance Tests
- [ ] Manual test: Create free user, generate until blocked
- [ ] Manual test: Check GET /api/user/usage returns correct data
- [ ] Manual test: Upgrade user to pro, verify unlimited access

---

## Dev Agent Record

### Tasks Completed
- [ ] Task 1: Create Usage Service
- [ ] Task 2: Create Usage Middleware
- [ ] Task 3: Apply Middleware to Magazine Generation
- [ ] Task 4: Create User Usage Endpoint
- [ ] Task 5: Increment Usage on Generation
- [ ] Task 6: Setup Monthly Reset Cron Job
- [ ] Task 7: Write Tests

### Agent Model Used
- Not started yet

### Debug Log References
- None yet

### Completion Notes
- None yet

### File List
*Will be populated by dev agent during implementation*

**Expected files:**
- `backend/services/usageService.js` (NEW)
- `backend/middleware/usage.js` (NEW)
- `backend/routes/user.js` (NEW or MODIFIED)
- `backend/routes/magazine.js` (MODIFIED - add incrementUsage call)
- `backend/cron/resetUsage.js` (NEW)
- `backend/server.js` (MODIFIED - apply middleware, start cron)
- `backend/tests/services/usageService.test.js` (NEW)
- `backend/tests/middleware/usage.test.js` (NEW)
- `package.json` (MODIFIED - add node-cron dependency)

### Change Log
- 2026-01-09: Story created by John (PM) from PRD Story 1.3

---

## Blockers
- None (Story 1.2 must be completed first)

---

## References
- [PRD Section 5: Story 1.3](../prd.md#story-13-usage-tracking--limits-backend)
- [Architecture Doc: API Architecture](../architecture.md#api-architecture)
- [Database Doc: profiles table](../database.md#table-profiles)

---

**Ready for Development:** ✅ (depends on Story 1.2 completion)
