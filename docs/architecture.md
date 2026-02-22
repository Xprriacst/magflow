# MagFlow System Architecture v2.0

**Document Version:** 2.0.0
**Last Updated:** 2026-01-09
**Architect:** Winston
**Status:** Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [System Components](#system-components)
4. [Database Architecture](#database-architecture)
5. [API Architecture](#api-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Authentication & Authorization](#authentication--authorization)
8. [Payment Integration](#payment-integration)
9. [Security Architecture](#security-architecture)
10. [Deployment Architecture](#deployment-architecture)
11. [System Flows](#system-flows)
12. [Scalability & Performance](#scalability--performance)
13. [Migration Strategy](#migration-strategy)

---

## Executive Summary

MagFlow v2.0 transforms the application from a single-user prototype into a multi-tenant SaaS platform with a freemium business model. This architecture supports:

- **Multi-user authentication** via Supabase Auth
- **Freemium model** (5 generations/month free, unlimited for Pro)
- **Stripe payment integration** for subscriptions
- **Admin panel** for user management
- **Data isolation** via Row Level Security (RLS)
- **Backward compatibility** with existing InDesign automation

**Key Principles:**
- Minimize changes to existing working code
- Security by default (RLS, JWT, API keys)
- Scalability to 100+ users
- Time-to-market focused (4-week implementation)

---

## Architecture Overview

### Current Architecture (v1.0)

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│                  (localhost:5173 / Netlify)                 │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS REST API
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                 Node.js Express Backend                     │
│                  (localhost:3001 / Render)                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   OpenAI     │  │   Supabase   │  │    Flask     │   │
│  │   Service    │  │   Client     │  │   Service    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────┬────────────────┬───────────────────┬────────────┘
          │                │                   │
          ↓                ↓                   ↓
   ┌──────────┐    ┌──────────┐        ┌──────────┐
   │  OpenAI  │    │ Supabase │        │  Flask   │
   │ GPT-4o   │    │PostgreSQL│        │   API    │
   └──────────┘    └──────────┘        └─────┬────┘
                                              │
                           ┌──────────────────┴───────┐
                           │                          │
                           ↓                          ↓
                   ┌───────────────┐        ┌─────────────┐
                   │Electron Agent │        │  InDesign   │
                   │  (Optional)   │────────│  (Local)    │
                   └───────────────┘        └─────────────┘
```

**Limitations v1.0:**
- No user authentication
- No usage limits
- No payment system
- No admin capabilities
- Single-user only

---

### Target Architecture (v2.0)

```
┌───────────────────────────────────────────────────────────────────┐
│                      React Frontend (SPA)                         │
│                    Vite + React 18 + Redux Toolkit                │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Auth Pages   │  │ User Pages   │  │ Admin Panel  │         │
│  │ (Login/      │  │ (Dashboard,  │  │ (User Mgmt,  │         │
│  │  Signup)     │  │  Create,     │  │  Templates)  │         │
│  │              │  │  Templates)  │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
│  Auth Context (Supabase Auth) | Usage Tracking | Stripe Client  │
└────────────────────────┬──────────────────────────────────────┬──┘
                         │ JWT Bearer Token                     │
                         │ REST API Calls                       │
                         ↓                                      │
┌─────────────────────────────────────────────────────────────────┐
│              Node.js Express Backend (Port 3001)                │
│                                                                 │
│  ┌────────────────── Middleware Stack ──────────────────────┐ │
│  │  1. CORS                                                  │ │
│  │  2. Authentication (JWT validation)                       │ │
│  │  3. Usage Limit Check (freemium enforcement)             │ │
│  │  4. Admin Role Check (for admin routes)                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────── Routes ─────────┐                                  │
│  │ /api/auth/*              │  ← Auth (login, signup)         │
│  │ /api/user/*              │  ← User profile, usage stats    │
│  │ /api/content/*           │  ← Content analysis (OpenAI)    │
│  │ /api/templates/*         │  ← Template management          │
│  │ /api/magazine/*          │  ← Magazine generation          │
│  │ /api/stripe/*            │  ← Payment processing           │
│  │ /api/admin/*             │  ← Admin operations (RLS)       │
│  └──────────────────────────┘                                  │
│                                                                 │
│  ┌───────── Services ──────────┐                               │
│  │ openaiService.js            │  ← GPT-4o analysis           │
│  │ stripeService.js            │  ← Payment & subscriptions   │
│  │ usageService.js             │  ← Usage tracking & limits   │
│  │ flaskService.js             │  ← InDesign automation       │
│  └─────────────────────────────┘                               │
└──────┬────────────┬────────────┬──────────────┬────────────────┘
       │            │            │              │
       ↓            ↓            ↓              ↓
┌──────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐
│  OpenAI  │  │  Stripe  │  │  Flask  │  │ Supabase │
│  GPT-4o  │  │   API    │  │   API   │  │PostgreSQL│
└──────────┘  └──────────┘  └────┬────┘  └─────┬────┘
                                  │             │
                                  ↓             │
                          ┌────────────┐        │
                          │  InDesign  │        │
                          │  (Local/   │        │
                          │   Agent)   │        │
                          └────────────┘        │
                                                │
        ┌───────────────────────────────────────┘
        │
        ↓
┌─────────────────────────────────────────────────┐
│           Supabase Services                     │
│                                                 │
│  ┌────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │    Auth    │  │  PostgreSQL │  │ Storage │ │
│  │  (JWT)     │  │   (RLS)     │  │ (Files) │ │
│  └────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────┘
```

**New Features v2.0:**
- ✅ JWT-based authentication
- ✅ Row Level Security (data isolation)
- ✅ Usage tracking & limits
- ✅ Stripe subscription management
- ✅ Admin panel with full user management
- ✅ Multi-tenant support

---

## System Components

### Frontend (React SPA)

**Technology Stack:**
- React 18.2
- Vite 5.0 (build tool)
- Redux Toolkit (state management)
- React Router v6 (routing)
- Tailwind CSS (styling)
- Axios (HTTP client)
- Supabase JS SDK (auth)

**Key Components:**

| Component | Purpose | Routes |
|-----------|---------|--------|
| **Auth Module** | Login, Signup, Password Reset | `/login`, `/signup` |
| **Dashboard** | Home page with usage stats | `/` |
| **Content Creator** | Magazine generation interface | `/create` |
| **Template Gallery** | Browse user templates | `/templates` |
| **Account Settings** | Profile & subscription management | `/account` |
| **Upgrade Page** | Pricing & Stripe checkout | `/upgrade` |
| **Admin Panel** | User & template management | `/admin` (role-restricted) |
| **Generation History** | Past magazine downloads | `/history` |

**State Management:**

```javascript
Redux Store Structure:
{
  auth: {
    user: { id, email, role, subscription_tier },
    isAuthenticated: boolean,
    loading: boolean
  },
  usage: {
    used: number,
    limit: number,
    plan: 'free' | 'pro',
    resetDate: Date
  },
  templates: {
    items: Template[],
    selected: Template | null
  },
  generations: {
    history: Generation[],
    current: Generation | null,
    status: 'idle' | 'processing' | 'completed' | 'error'
  }
}
```

---

### Backend (Node.js/Express)

**Technology Stack:**
- Node.js 20.x
- Express.js 4.x
- Supabase JS SDK (database + auth)
- Stripe Node SDK
- OpenAI SDK
- Socket.io (WebSocket for Agent)
- Winston (logging)

**Middleware Stack:**

```javascript
// Request flow through middleware
Request
  → CORS middleware
  → JSON body parser
  → Morgan (logging)
  → requireAuth (JWT validation) ← NEW
  → checkUsageLimit (freemium) ← NEW
  → Route handler
  → Error handler
  → Response
```

**New Middleware:**

1. **requireAuth** (`middleware/auth.js`)
   - Validates JWT from `Authorization: Bearer <token>`
   - Extracts user_id and attaches to `req.user`
   - Returns 401 if invalid/missing

2. **checkUsageLimit** (`middleware/usage.js`)
   - Checks if user has remaining generations
   - Free users: limited to 5/month
   - Pro users: unlimited (-1 limit)
   - Returns 403 if limit reached

3. **requireAdmin** (`middleware/admin.js`)
   - Checks if `req.user.role === 'admin'`
   - Returns 403 if not admin

**New Services:**

```javascript
// backend/services/stripeService.js
class StripeService {
  createCheckoutSession(userId, priceId)
  handleWebhook(event)
  getCustomerPortalUrl(customerId)
  syncSubscriptionStatus(subscriptionId)
}

// backend/services/usageService.js
class UsageService {
  getUserUsage(userId)
  canUserGenerate(userId)
  incrementUsage(userId, action)
  resetMonthlyUsage() // Cron job
}
```

---

### Database (Supabase PostgreSQL)

**Schema Overview:**

```
auth.users (Supabase managed)
    ↓ 1:1
profiles (application data)
    ↓ 1:N
├── subscriptions (Stripe data)
├── usage_logs (audit trail)
├── indesign_templates (user templates)
└── magazine_generations (generation history)
```

**Tables:**

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profiles | `id`, `email`, `subscription_tier`, `monthly_limit`, `role` |
| `subscriptions` | Stripe subscription data | `stripe_subscription_id`, `status`, `current_period_end` |
| `usage_logs` | Audit trail | `action`, `metadata`, `created_at` |
| `indesign_templates` | User templates | `user_id`, `name`, `file_path`, `visibility` |
| `magazine_generations` | Generation history | `user_id`, `template_id`, `status`, `output_file_url` |

**Row Level Security (RLS):**

All tables have RLS enabled with policies:
- Users can CRUD their own data (`user_id = auth.uid()`)
- Admins can read/update all data (`role = 'admin'`)
- Service role bypasses RLS (backend operations)

See [database.md](./database.md) for detailed schema.

---

## Database Architecture

### Entity Relationship Diagram

```
┌──────────────────────┐
│    auth.users        │ (Supabase managed)
│  ─────────────────── │
│  id (UUID) PK        │
│  email               │
│  encrypted_password  │
└──────────┬───────────┘
           │ 1:1
           ↓
┌──────────────────────────────────────┐
│         profiles                     │
│  ─────────────────────────────────── │
│  id (UUID) PK, FK → auth.users       │
│  email                               │
│  company_name                        │
│  subscription_tier (free|pro)        │
│  subscription_status                 │
│  stripe_customer_id                  │
│  stripe_subscription_id              │
│  monthly_generations_used            │
│  monthly_limit (5 or -1)             │
│  usage_reset_date                    │
│  role (user|admin)                   │
│  created_at, updated_at              │
└────┬─────────────────────────────────┘
     │ 1:N
     ├──────────────────────────────────┐
     │                                  │
     ↓                                  ↓
┌─────────────────────┐     ┌──────────────────────┐
│  subscriptions      │     │    usage_logs        │
│  ─────────────────  │     │  ─────────────────── │
│  id (UUID) PK       │     │  id (UUID) PK        │
│  user_id FK         │     │  user_id FK          │
│  stripe_sub_id      │     │  action (enum)       │
│  plan               │     │  metadata (JSON)     │
│  status             │     │  ip_address          │
│  period_start/end   │     │  created_at          │
│  canceled_at        │     └──────────────────────┘
└─────────────────────┘
     │
     ↓
┌──────────────────────────────────┐
│    indesign_templates            │
│  ─────────────────────────────── │
│  id (UUID) PK                    │
│  user_id (UUID) FK → profiles    │
│  name                            │
│  description                     │
│  file_path                       │
│  thumbnail_url                   │
│  layout_structure (JSON)         │
│  visibility (private|public)     │
│  created_at                      │
└───────┬──────────────────────────┘
        │ 1:N
        ↓
┌──────────────────────────────────┐
│   magazine_generations           │
│  ─────────────────────────────── │
│  id (UUID) PK                    │
│  user_id (UUID) FK → profiles    │
│  template_id FK → templates      │
│  content_data (JSON)             │
│  status (processing|completed)   │
│  output_file_url                 │
│  created_at                      │
└──────────────────────────────────┘
```

### Key Relationships

1. **auth.users ← profiles** (1:1)
   - Trigger automatically creates profile on signup
   - Cascade delete when user deleted

2. **profiles ← subscriptions** (1:N)
   - User can have multiple subscription records (history)
   - Current active subscription determined by status

3. **profiles ← indesign_templates** (1:N)
   - Each template belongs to one user
   - RLS ensures users only see their templates

4. **profiles ← magazine_generations** (1:N)
   - Each generation belongs to one user
   - RLS ensures users only see their generations

5. **indesign_templates ← magazine_generations** (1:N)
   - Each generation uses one template

### Indexes

Performance-critical indexes:

```sql
-- User lookups
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Template filtering
CREATE INDEX idx_indesign_templates_user_id ON indesign_templates(user_id);

-- Generation history
CREATE INDEX idx_magazine_generations_user_id ON magazine_generations(user_id);
CREATE INDEX idx_magazine_generations_created_at ON magazine_generations(created_at DESC);

-- Usage logs
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);
```

---

## API Architecture

### API Endpoints

#### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | Public | Create new account |
| POST | `/api/auth/login` | Public | Login with email/password |
| POST | `/api/auth/logout` | Required | Logout (clear session) |
| POST | `/api/auth/reset-password` | Public | Request password reset |

#### User Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/user/profile` | Required | Get user profile |
| PATCH | `/api/user/profile` | Required | Update profile |
| GET | `/api/user/usage` | Required | Get usage stats |

#### Content Analysis

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/content/analyze` | Required | Analyze content with OpenAI |
| POST | `/api/content/recommend-templates` | Required | Get template recommendations |

#### Templates

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/templates` | Required | List user templates |
| GET | `/api/templates/:id` | Required | Get template details |
| POST | `/api/templates` | Required | Upload new template |
| DELETE | `/api/templates/:id` | Required | Delete template |

#### Magazine Generation

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/magazine/generate` | Required + Usage | Start generation |
| GET | `/api/magazine/status/:id` | Required | Get generation status |
| GET | `/api/magazine/history` | Required | Get generation history |

#### Stripe Integration

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/stripe/create-checkout` | Required | Create checkout session |
| POST | `/api/stripe/webhook` | Stripe Signature | Receive Stripe events |
| GET | `/api/stripe/portal` | Required | Get customer portal URL |

#### Admin Panel

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/users/:id` | Admin | Get user details |
| PATCH | `/api/admin/users/:id` | Admin | Update user (change plan, etc.) |
| POST | `/api/admin/templates` | Admin | Upload template for user |
| GET | `/api/admin/stats` | Admin | Get global stats |

### Authentication Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. POST /api/auth/login
     │    { email, password }
     ↓
┌──────────────────┐
│  Backend         │
│  (auth.js route) │
└────┬─────────────┘
     │
     │ 2. Call Supabase Auth
     ↓
┌─────────────────┐
│  Supabase Auth  │
└────┬────────────┘
     │
     │ 3. Return JWT + user data
     ↓
┌──────────────────┐
│  Backend         │
│  Returns to      │
│  client:         │
│  {               │
│    user: {...},  │
│    session: {    │
│      access_token│ ← JWT
│      refresh_token
│    }             │
│  }               │
└────┬─────────────┘
     │
     │ 4. Store in localStorage
     ↓
┌──────────┐
│  Client  │
│  (Redux) │
└──────────┘
```

**Subsequent Requests:**

```
Client
  → axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`
  → GET /api/templates

Backend
  → requireAuth middleware validates JWT
  → Extracts user_id
  → Attaches req.user
  → Route handler uses req.user.id
  → Query: SELECT * FROM templates WHERE user_id = req.user.id
```

### Usage Limit Flow

```
Client: POST /api/magazine/generate
    ↓
Backend: requireAuth middleware
    ↓ (req.user = { id, email, role, subscription_tier })
Backend: checkUsageLimit middleware
    ↓
usageService.canUserGenerate(req.user.id)
    ↓
Query DB: SELECT monthly_generations_used, monthly_limit
          FROM profiles WHERE id = ?
    ↓
If free user (limit = 5):
  - used < 5 → Allow
  - used >= 5 → Return 403 { error: "Limit reached", upgrade: true }
If pro user (limit = -1):
  - Always allow
    ↓
Route handler: Proceed with generation
    ↓
usageService.incrementUsage(req.user.id, 'generation')
    ↓
UPDATE profiles SET monthly_generations_used = used + 1
INSERT INTO usage_logs (user_id, action) VALUES (?, 'generation')
```

---

## Frontend Architecture

### Component Structure

```
src/
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   ├── Dashboard.jsx
│   ├── smart-content-creator/
│   │   └── index.jsx (modified for usage check)
│   ├── template-gallery/
│   │   └── index.jsx (filtered by user)
│   ├── account/
│   │   ├── Settings.jsx
│   │   └── History.jsx
│   ├── upgrade/
│   │   ├── Pricing.jsx
│   │   ├── Success.jsx
│   │   └── Cancel.jsx
│   └── admin/
│       └── Dashboard.jsx
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.jsx
│   │   ├── PublicRoute.jsx
│   │   └── AdminRoute.jsx
│   ├── UsageBadge.jsx
│   ├── UpgradeModal.jsx
│   └── [existing components]
├── contexts/
│   └── AuthContext.jsx
├── hooks/
│   ├── useAuth.js
│   └── useUsage.js
├── store/
│   ├── store.js
│   ├── authSlice.js
│   ├── usageSlice.js
│   └── [existing slices]
├── services/
│   ├── api.js (axios instance)
│   ├── authService.js
│   ├── stripeService.js
│   └── [existing services]
└── App.jsx
```

### Routing

```jsx
// App.jsx
<AuthProvider>
  <Router>
    {/* Public Routes */}
    <PublicRoute path="/login" component={Login} />
    <PublicRoute path="/signup" component={Signup} />

    {/* Protected Routes (require auth) */}
    <ProtectedRoute path="/" component={Dashboard} />
    <ProtectedRoute path="/create" component={SmartContentCreator} />
    <ProtectedRoute path="/templates" component={TemplateGallery} />
    <ProtectedRoute path="/account" component={AccountSettings} />
    <ProtectedRoute path="/history" component={GenerationHistory} />
    <ProtectedRoute path="/upgrade" component={PricingPage} />

    {/* Admin Routes (require admin role) */}
    <AdminRoute path="/admin" component={AdminDashboard} />

    {/* Stripe Redirect Routes */}
    <Route path="/upgrade/success" component={UpgradeSuccess} />
    <Route path="/upgrade/cancel" component={UpgradeCancel} />
  </Router>
</AuthProvider>
```

### State Management

**Auth State (Redux):**

```javascript
// authSlice.js
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  },
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    }
  }
});
```

**Usage State (Redux):**

```javascript
// usageSlice.js
const usageSlice = createSlice({
  name: 'usage',
  initialState: {
    used: 0,
    limit: 5,
    plan: 'free',
    resetDate: null
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUsage.fulfilled, (state, action) => {
      state.used = action.payload.used;
      state.limit = action.payload.limit;
      state.plan = action.payload.plan;
      state.resetDate = action.payload.resetDate;
    });
  }
});
```

---

## Authentication & Authorization

### JWT Flow

1. **Login:**
   - User submits email/password
   - Backend calls Supabase Auth
   - Returns JWT (access_token + refresh_token)
   - Frontend stores in localStorage + Redux

2. **API Requests:**
   - Axios interceptor adds `Authorization: Bearer ${jwt}`
   - Backend validates JWT with Supabase
   - Extracts user_id and attaches to `req.user`

3. **Token Refresh:**
   - Refresh token used to get new access token
   - Handled automatically by Supabase SDK
   - On 401 error, frontend redirects to login

### Row Level Security (RLS)

**How RLS Works:**

```sql
-- Example: indesign_templates table
-- Policy: Users can only read their own templates

CREATE POLICY "Users can read own templates"
  ON indesign_templates
  FOR SELECT
  USING (auth.uid() = user_id);
```

**At Query Time:**

```sql
-- Frontend/Backend makes query:
SELECT * FROM indesign_templates;

-- PostgreSQL automatically adds WHERE clause:
SELECT * FROM indesign_templates
WHERE user_id = 'current-user-uuid';
```

**Benefits:**
- Security at database level (even if backend bypassed)
- No accidental data leaks
- Simplified backend code (no manual filtering)

### Admin Authorization

**Role Check:**

```javascript
// middleware/admin.js
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Usage in routes:
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  // Only admins reach here
  const users = await getAllUsers();
  res.json(users);
});
```

**RLS Override for Admin:**

```sql
-- Admin policy: Can read all templates
CREATE POLICY "Admins can read all templates"
  ON indesign_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## Payment Integration

### Stripe Architecture

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. Click "Upgrade to Pro"
     ↓
┌───────────────────────┐
│  POST /api/stripe/    │
│  create-checkout      │
└────┬──────────────────┘
     │ 2. Create Checkout Session
     ↓
┌────────────────┐
│  Stripe API    │
│  (checkout URL)│
└────┬───────────┘
     │ 3. Redirect user to Stripe
     ↓
┌────────────────┐
│  Stripe Hosted │ ← User enters card info
│  Checkout      │
└────┬───────────┘
     │ 4. Payment success
     ├────────────────────┐
     │                    │
     ↓                    ↓
┌─────────────┐    ┌──────────────────┐
│  Redirect   │    │  Stripe Webhook  │
│  to success │    │  POST /api/stripe│
│  page       │    │  /webhook        │
└─────────────┘    └────┬─────────────┘
                        │ 5. Event: checkout.session.completed
                        ↓
                   ┌──────────────────┐
                   │  Backend Handler │
                   │  - Get customer  │
                   │  - Update user   │
                   │    plan to 'pro' │
                   │  - Set limit=-1  │
                   └──────────────────┘
```

### Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate Pro plan, set limit to -1 |
| `customer.subscription.updated` | Sync status changes (pause, resume) |
| `customer.subscription.deleted` | Downgrade to free, set limit to 5 |
| `invoice.payment_failed` | Mark subscription as past_due |

### Stripe Service

```javascript
// backend/services/stripeService.js
class StripeService {
  async createCheckoutSession(userId) {
    const user = await getUser(userId);

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
        quantity: 1
      }],
      success_url: `${process.env.FRONTEND_URL}/upgrade/success`,
      cancel_url: `${process.env.FRONTEND_URL}/upgrade/cancel`,
      metadata: { user_id: userId }
    });

    return session.url;
  }

  async handleWebhook(event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.activateProPlan(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.downgradeToFree(event.data.object);
        break;
      // ... other events
    }
  }

  async activateProPlan(session) {
    const userId = session.metadata.user_id;
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'pro',
        monthly_limit: -1,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription
      })
      .eq('id', userId);

    // Insert subscription record
    await supabase.from('subscriptions').insert({
      user_id: userId,
      stripe_subscription_id: session.subscription,
      plan: 'pro_monthly',
      status: 'active'
    });
  }
}
```

---

## Security Architecture

### Security Layers

1. **Transport Security**
   - HTTPS only (enforced)
   - TLS 1.2+ required

2. **Authentication**
   - JWT tokens (Supabase Auth)
   - PBKDF2 password hashing (Supabase managed)
   - Refresh token rotation

3. **Authorization**
   - Role-based access (user, admin)
   - Row Level Security (RLS)
   - Middleware validation

4. **API Security**
   - CORS whitelist (only frontend domain)
   - Rate limiting (10 req/min per IP)
   - Request validation (schema validation)

5. **Data Security**
   - Encryption at rest (Supabase)
   - Encryption in transit (HTTPS)
   - Sensitive data masked in logs

6. **Secrets Management**
   - Environment variables only
   - Never in code/git
   - Rotation every 90 days

### Threat Mitigation

| Threat | Mitigation |
|--------|------------|
| **SQL Injection** | Parameterized queries (Supabase SDK) |
| **XSS** | React auto-escaping, Content Security Policy |
| **CSRF** | SameSite cookies, JWT (not cookies) |
| **Brute Force** | Rate limiting, Supabase account lockout |
| **Data Leakage** | RLS policies, API key rotation |
| **Payment Fraud** | Stripe Radar, webhook signature validation |

---

## Deployment Architecture

### Infrastructure

```
┌─────────────────────────────────────────────────┐
│               Cloudflare CDN                    │
│          (Optional: DNS + SSL + DDoS)           │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ↓                         ↓
┌───────────────┐         ┌──────────────────┐
│   Frontend    │         │     Backend      │
│   (Netlify)   │         │   (Render.com)   │
│               │         │                  │
│  - React SPA  │         │  - Node.js API   │
│  - Auto build │         │  - Auto deploy   │
│  - SSL cert   │         │  - Health checks │
│  - Rollback   │         │  - Logs          │
└───────────────┘         └────────┬─────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ↓                          ↓                          ↓
┌───────────────┐         ┌──────────────┐         ┌──────────────┐
│   Supabase    │         │   Stripe     │         │   OpenAI     │
│  (Managed)    │         │   (SaaS)     │         │   (SaaS)     │
│               │         │              │         │              │
│  - PostgreSQL │         │  - Payments  │         │  - GPT-4o    │
│  - Auth       │         │  - Webhooks  │         │  - Analysis  │
│  - Storage    │         │              │         │              │
└───────────────┘         └──────────────┘         └──────────────┘
```

### Environment Variables

**Frontend (.env):**

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_API_URL=https://magflow-backend.onrender.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

**Backend (.env):**

```bash
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx... # Service role key (admin access)

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# Flask API (if separate)
FLASK_API_URL=https://magflow-flask.onrender.com

# Frontend URL (for CORS)
FRONTEND_URL=https://magflow.com
```

### Deployment Checklist

- [ ] Create Supabase project (production)
- [ ] Run `supabase-schema-v2.sql` in SQL Editor
- [ ] Create admin user via Auth dashboard
- [ ] Run migration `001_add_multiuser.sql`
- [ ] Verify RLS policies enabled
- [ ] Deploy backend to Render.com
- [ ] Configure environment variables
- [ ] Test webhook endpoint: `POST /api/stripe/webhook`
- [ ] Add webhook in Stripe dashboard
- [ ] Deploy frontend to Netlify
- [ ] Configure DNS (if custom domain)
- [ ] Test end-to-end flow (signup → upgrade → generate)
- [ ] Set up monitoring (Sentry, Render logs)
- [ ] Document rollback procedure

---

## System Flows

### User Signup Flow

```
User visits /signup
    ↓
Fills email, password, company name
    ↓
Submit form
    ↓
Frontend: POST /api/auth/signup
    ↓
Backend: Call Supabase Auth
    ↓
Supabase: Create auth.users record
    ↓
Trigger: on_auth_user_created
    ↓
Insert into profiles table:
  - id = auth.users.id
  - email
  - role = 'user'
  - subscription_tier = 'free'
  - monthly_limit = 5
    ↓
Return JWT to client
    ↓
Frontend: Store JWT in localStorage
           Redirect to Dashboard
    ↓
Dashboard: Show "Welcome! You have 5 free generations"
```

### Magazine Generation Flow (with Limits)

```
User clicks "Generate Magazine"
    ↓
Frontend: Check if limit reached (from Redux)
    ↓
If limit reached:
  - Show UpgradeModal
  - Stop here
Else:
  - POST /api/magazine/generate
    ↓
Backend: requireAuth middleware
    ↓ (req.user extracted from JWT)
Backend: checkUsageLimit middleware
    ↓
Query: SELECT monthly_generations_used, monthly_limit
       FROM profiles WHERE id = req.user.id
    ↓
If used >= limit (and not pro):
  - Return 403 { error: "Limit reached" }
Else:
  - Proceed to generation
    ↓
usageService.incrementUsage(req.user.id)
    ↓
UPDATE profiles SET monthly_generations_used = used + 1
INSERT INTO usage_logs (user_id, action) VALUES (?, 'generation')
    ↓
Call Flask API or Electron Agent
    ↓
Generate InDesign file
    ↓
Upload to Supabase Storage
    ↓
INSERT INTO magazine_generations (user_id, output_file_url, status)
    ↓
Return generation_id to frontend
    ↓
Frontend: Poll /api/magazine/status/:id
    ↓
When completed: Show download link
```

### Upgrade to Pro Flow

```
User clicks "Upgrade to Pro"
    ↓
Frontend: POST /api/stripe/create-checkout
    ↓
Backend: stripeService.createCheckoutSession(req.user.id)
    ↓
Stripe API: Create checkout session
    ↓
Return checkout URL to frontend
    ↓
Frontend: Redirect to Stripe Hosted Checkout
    ↓
User enters card info, confirms
    ↓
Stripe: Process payment
    ↓ (Success)
Stripe: Send webhook to backend
    ↓
POST /api/stripe/webhook
    ↓
Backend: Verify webhook signature
    ↓
Event: checkout.session.completed
    ↓
stripeService.activateProPlan(session)
    ↓
UPDATE profiles SET
  subscription_tier = 'pro',
  monthly_limit = -1,
  stripe_customer_id = session.customer,
  stripe_subscription_id = session.subscription
WHERE id = user_id
    ↓
INSERT INTO subscriptions (user_id, stripe_subscription_id, status='active')
    ↓
(Meanwhile, Stripe redirects user to success page)
    ↓
Frontend: /upgrade/success
    ↓
"Payment successful! You now have unlimited generations."
    ↓
User clicks "Go to Dashboard"
    ↓
Dashboard: Shows "Plan Pro - Unlimited" badge
```

---

## Scalability & Performance

### Current Capacity

- **Users:** Optimized for 10-100 concurrent users
- **Database:** Supabase (auto-scaling up to 1M rows)
- **API:** Single Node.js instance (Render.com)
- **InDesign:** Limited by local/Agent execution (1-2 concurrent)

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time (p95) | < 500ms | ~200ms |
| InDesign Generation | < 60s | ~45s |
| Database Query (p95) | < 100ms | ~50ms |
| Page Load (FCP) | < 2s | ~1.5s |

### Scaling Strategy

**Phase 1 (0-100 users):**
- Single backend instance
- Supabase free tier
- No caching

**Phase 2 (100-1000 users):**
- Add Redis cache (template metadata, usage stats)
- Upgrade Supabase to Pro tier
- BullMQ queue for InDesign jobs (load balancing)
- Multiple Electron Agents (pool)

**Phase 3 (1000+ users):**
- Horizontal scaling (multiple backend instances)
- Load balancer (Render.com auto)
- CDN for generated files (Cloudflare)
- Cloud InDesign Server (Adobe)

### Bottlenecks

1. **InDesign Generation** (biggest bottleneck)
   - Solution: Agent pool + BullMQ queue
   - Alternative: Cloud InDesign Server

2. **Database Queries**
   - Solution: Redis cache for read-heavy data
   - Indexes already optimized

3. **OpenAI API**
   - Solution: Cache analysis results (same content = same analysis)
   - Rate limit buffer

---

## Migration Strategy

### Phase 1: Preparation (Week 0)

- [ ] Backup production database
- [ ] Create staging environment
- [ ] Test schema v2 on staging
- [ ] Test migration script on staging
- [ ] Validate RLS policies work correctly

### Phase 2: Schema Migration (Week 1, Day 1)

- [ ] Create admin user in Supabase Auth
- [ ] Run `supabase-schema-v2.sql` in production
- [ ] Run `001_add_multiuser.sql` with admin email
- [ ] Verify data integrity (no orphaned records)
- [ ] Test RLS: Admin can see all, user can see only own

### Phase 3: Backend Deployment (Week 1-2)

- [ ] Deploy backend v2 to Render.com
- [ ] Configure all environment variables
- [ ] Test API endpoints with Postman
- [ ] Verify Stripe webhook receives events
- [ ] Monitor error logs for 24h

### Phase 4: Frontend Deployment (Week 2-3)

- [ ] Deploy frontend v2 to Netlify
- [ ] Test signup flow end-to-end
- [ ] Test generation with usage limits
- [ ] Test upgrade to Pro via Stripe
- [ ] Test admin panel

### Phase 5: Validation & Monitoring (Week 4)

- [ ] Invite 5 beta users to test
- [ ] Monitor error rates, performance
- [ ] Fix critical bugs
- [ ] Document known issues
- [ ] Plan next iteration

### Rollback Plan

If critical issues occur:

1. **Database Rollback:**
   ```sql
   -- Run rollback script in 001_add_multiuser.sql
   -- Restores v1.0 schema (single-user)
   ```

2. **Backend Rollback:**
   - Revert to previous Render.com deployment
   - Change environment variable to v1 database

3. **Frontend Rollback:**
   - Rollback Netlify deployment to previous version

**Rollback Time:** ~15 minutes

---

## Conclusion

This architecture provides:

✅ **Multi-tenant SaaS** with data isolation
✅ **Freemium business model** with Stripe
✅ **Admin capabilities** for user management
✅ **Backward compatible** with existing InDesign automation
✅ **Scalable** to 100+ users initially, 1000+ with optimizations
✅ **Secure** with JWT, RLS, and defense in depth
✅ **Production ready** in 4 weeks

For detailed implementation, see:
- [PRD (Product Requirements)](./prd.md)
- [Database Schema](./database.md)
- Backend API code in `backend/`
- Frontend code in `src/`

---

**Next Steps:** Begin Sprint 1 (Stories 1.1-1.3) - Database Schema & Auth Middleware

---

*Document maintained by Winston (Architect)*
*Last reviewed: 2026-01-09*
