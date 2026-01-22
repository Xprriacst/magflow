# MagFlow Database Documentation

**Schema Version:** 2.0.0
**Last Updated:** 2026-01-09
**Database:** Supabase PostgreSQL

---

## Quick Reference

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profiles & subscription data | `id`, `email`, `subscription_tier`, `monthly_limit`, `role` |
| `subscriptions` | Stripe subscription history | `stripe_subscription_id`, `status`, `current_period_end` |
| `usage_logs` | Audit trail of all actions | `user_id`, `action`, `metadata`, `created_at` |
| `indesign_templates` | User templates | `user_id`, `name`, `file_path`, `visibility` |
| `magazine_generations` | Generation history | `user_id`, `template_id`, `status`, `output_file_url` |

---

## Entity Relationship Diagram

```
auth.users (Supabase)
    │
    │ 1:1
    ↓
profiles
    │
    ├── 1:N → subscriptions
    ├── 1:N → usage_logs
    ├── 1:N → indesign_templates
    │              │
    │              │ 1:N
    │              ↓
    └── 1:N → magazine_generations
```

---

## Table: `profiles`

Extends Supabase `auth.users` with application-specific data.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, FK → auth.users | User ID (same as auth) |
| `email` | TEXT | NOT NULL, UNIQUE | User email |
| `company_name` | TEXT | NULLABLE | Company/publication name |
| `subscription_tier` | TEXT | NOT NULL, DEFAULT 'free' | 'free' or 'pro' |
| `subscription_status` | TEXT | NOT NULL, DEFAULT 'active' | 'active', 'cancelled', 'expired' |
| `stripe_customer_id` | TEXT | UNIQUE, NULLABLE | Stripe customer ID |
| `stripe_subscription_id` | TEXT | NULLABLE | Stripe subscription ID |
| `monthly_generations_used` | INTEGER | NOT NULL, DEFAULT 0 | Current month usage |
| `monthly_limit` | INTEGER | NOT NULL, DEFAULT 5 | 5 for free, -1 for unlimited |
| `usage_reset_date` | DATE | NOT NULL | Date when usage resets |
| `role` | TEXT | NOT NULL, DEFAULT 'user' | 'user' or 'admin' |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Account creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update |
| `last_login_at` | TIMESTAMPTZ | NULLABLE | Last login timestamp |

**Indexes:**
- `idx_profiles_email` on `(email)`
- `idx_profiles_stripe_customer_id` on `(stripe_customer_id)`
- `idx_profiles_role` on `(role)`
- `idx_profiles_subscription_tier` on `(subscription_tier)`

**RLS Policies:**
- Users can read/update their own profile
- Admins can read/update all profiles

**Example Queries:**

```sql
-- Get user profile with usage stats
SELECT
  id,
  email,
  subscription_tier,
  monthly_generations_used,
  monthly_limit,
  (monthly_limit - monthly_generations_used) AS remaining
FROM profiles
WHERE id = 'user-uuid';

-- Check if user can generate
SELECT
  CASE
    WHEN monthly_limit = -1 THEN TRUE  -- Pro user, unlimited
    WHEN monthly_generations_used < monthly_limit THEN TRUE
    ELSE FALSE
  END AS can_generate
FROM profiles
WHERE id = 'user-uuid';
```

---

## Table: `subscriptions`

Tracks Stripe subscription data and status changes.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Subscription record ID |
| `user_id` | UUID | NOT NULL, FK → profiles | Owner user |
| `stripe_subscription_id` | TEXT | NOT NULL, UNIQUE | Stripe subscription ID |
| `stripe_customer_id` | TEXT | NOT NULL | Stripe customer ID |
| `stripe_price_id` | TEXT | NOT NULL | Stripe price ID |
| `plan` | TEXT | NOT NULL | 'pro_monthly' or 'pro_annual' |
| `status` | TEXT | NOT NULL | 'active', 'canceled', 'past_due', 'trialing', 'incomplete' |
| `current_period_start` | TIMESTAMPTZ | NOT NULL | Billing period start |
| `current_period_end` | TIMESTAMPTZ | NOT NULL | Billing period end |
| `cancel_at_period_end` | BOOLEAN | NOT NULL, DEFAULT FALSE | Will cancel at end |
| `canceled_at` | TIMESTAMPTZ | NULLABLE | Cancellation timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update |

**Indexes:**
- `idx_subscriptions_user_id` on `(user_id)`
- `idx_subscriptions_stripe_subscription_id` on `(stripe_subscription_id)`
- `idx_subscriptions_status` on `(status)`

**RLS Policies:**
- Users can read their own subscriptions
- Admins can read all subscriptions

**Example Queries:**

```sql
-- Get user's active subscription
SELECT
  stripe_subscription_id,
  plan,
  status,
  current_period_end
FROM subscriptions
WHERE user_id = 'user-uuid'
  AND status = 'active'
ORDER BY created_at DESC
LIMIT 1;

-- Check if subscription will cancel
SELECT cancel_at_period_end, current_period_end
FROM subscriptions
WHERE user_id = 'user-uuid' AND status = 'active';
```

---

## Table: `usage_logs`

Audit trail of all user actions for analytics and debugging.

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Log entry ID |
| `user_id` | UUID | NOT NULL, FK → profiles | User who performed action |
| `action` | TEXT | NOT NULL | Action type (enum) |
| `metadata` | JSONB | NULLABLE | Action-specific data |
| `ip_address` | INET | NULLABLE | User IP address |
| `user_agent` | TEXT | NULLABLE | Browser/client info |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Timestamp |

**Action Types:**
- `generation` - Magazine generation
- `template_upload` - Template uploaded
- `template_delete` - Template deleted
- `login` - User logged in
- `signup` - User signed up
- `upgrade` - Upgraded to Pro
- `downgrade` - Downgraded to Free
- `admin_action` - Admin performed action

**Indexes:**
- `idx_usage_logs_user_id` on `(user_id)`
- `idx_usage_logs_action` on `(action)`
- `idx_usage_logs_created_at` on `(created_at DESC)`
- `idx_usage_logs_metadata_gin` on `(metadata)` using GIN

**RLS Policies:**
- Users can read their own logs
- Admins can read all logs

**Example Queries:**

```sql
-- Get user's generation history (last 30 days)
SELECT created_at, metadata->>'generation_id' AS generation_id
FROM usage_logs
WHERE user_id = 'user-uuid'
  AND action = 'generation'
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Count generations per user (admin)
SELECT user_id, COUNT(*) AS total_generations
FROM usage_logs
WHERE action = 'generation'
GROUP BY user_id
ORDER BY total_generations DESC;
```

---

## Table: `indesign_templates`

User-owned InDesign templates (modified from v1.0).

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Template ID |
| `user_id` | UUID | NOT NULL, FK → profiles | Owner user |
| `name` | TEXT | NOT NULL | Template name |
| `description` | TEXT | NULLABLE | Template description |
| `file_path` | TEXT | NOT NULL | Path to .indt file |
| `thumbnail_url` | TEXT | NULLABLE | Preview image URL |
| `layout_structure` | JSONB | NULLABLE | Template metadata (sections, images) |
| `visibility` | TEXT | NOT NULL, DEFAULT 'private' | 'private' or 'public' |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Upload date |

**Indexes:**
- `idx_indesign_templates_user_id` on `(user_id)`

**RLS Policies:**
- Users can CRUD their own templates
- Admins can CRUD all templates

**Example Queries:**

```sql
-- Get user's templates
SELECT id, name, thumbnail_url, created_at
FROM indesign_templates
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;

-- Get template with full details
SELECT *
FROM indesign_templates
WHERE id = 'template-uuid' AND user_id = 'user-uuid';
```

---

## Table: `magazine_generations`

History of all magazine generations (modified from v1.0).

**Schema:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Generation ID |
| `user_id` | UUID | NOT NULL, FK → profiles | Owner user |
| `template_id` | UUID | NOT NULL, FK → indesign_templates | Template used |
| `content_data` | JSONB | NOT NULL | Input content (text, images) |
| `status` | TEXT | NOT NULL | 'processing', 'completed', 'error' |
| `output_file_url` | TEXT | NULLABLE | Generated .indd file URL |
| `error_message` | TEXT | NULLABLE | Error details if failed |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Generation start |

**Indexes:**
- `idx_magazine_generations_user_id` on `(user_id)`
- `idx_magazine_generations_created_at` on `(created_at DESC)`

**RLS Policies:**
- Users can read/insert/update their own generations
- Admins can read all generations

**Example Queries:**

```sql
-- Get user's generation history
SELECT
  g.id,
  g.created_at,
  g.status,
  g.output_file_url,
  t.name AS template_name
FROM magazine_generations g
JOIN indesign_templates t ON g.template_id = t.id
WHERE g.user_id = 'user-uuid'
ORDER BY g.created_at DESC
LIMIT 20;

-- Get generation status
SELECT status, output_file_url, error_message
FROM magazine_generations
WHERE id = 'generation-uuid' AND user_id = 'user-uuid';
```

---

## Functions & Triggers

### Function: `handle_new_user()`

Automatically creates a `profiles` entry when a user signs up via Supabase Auth.

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

**Behavior:**
- Inserts row into `profiles` with `id = auth.users.id`
- Sets default `role = 'user'`, `subscription_tier = 'free'`, `monthly_limit = 5`

---

### Function: `handle_updated_at()`

Updates `updated_at` timestamp on row modification.

```sql
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
```

**Applied to:** `profiles`, `subscriptions`

---

### Function: `reset_monthly_usage()`

Resets `monthly_generations_used` to 0 for all users on the 1st of each month.

**Usage:**
```sql
-- Call manually or via cron job
SELECT reset_monthly_usage();
```

**Recommended:** Set up Supabase cron job or backend cron (node-cron) to run monthly.

---

## Row Level Security (RLS)

All tables have RLS enabled. Policies ensure users can only access their own data, while admins have full access.

### Example Policy (Templates)

```sql
-- Users can read their own templates
CREATE POLICY "Users can read own templates"
  ON indesign_templates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all templates
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

**How it works:**
- `auth.uid()` returns the currently authenticated user's UUID (from JWT)
- PostgreSQL automatically adds WHERE clause to enforce policy
- Service role key bypasses RLS (used by backend for admin operations)

---

## Common Queries

### Check User Usage Limits

```sql
SELECT
  email,
  subscription_tier,
  monthly_generations_used,
  monthly_limit,
  CASE
    WHEN monthly_limit = -1 THEN 'Unlimited'
    ELSE (monthly_limit - monthly_generations_used)::TEXT
  END AS remaining
FROM profiles
WHERE id = 'user-uuid';
```

### Get User Generation Stats (Admin)

```sql
SELECT
  p.email,
  p.subscription_tier,
  COUNT(mg.id) AS total_generations,
  COUNT(mg.id) FILTER (WHERE mg.created_at > NOW() - INTERVAL '30 days') AS last_30_days
FROM profiles p
LEFT JOIN magazine_generations mg ON p.id = mg.user_id
GROUP BY p.id, p.email, p.subscription_tier
ORDER BY total_generations DESC;
```

### Find Users Near Limit (for Marketing)

```sql
SELECT email, monthly_generations_used, monthly_limit
FROM profiles
WHERE subscription_tier = 'free'
  AND monthly_generations_used >= 4  -- Close to limit
  AND monthly_limit = 5;
```

### Stripe Subscription Status

```sql
SELECT
  p.email,
  s.plan,
  s.status,
  s.current_period_end,
  s.cancel_at_period_end
FROM profiles p
JOIN subscriptions s ON p.id = s.user_id
WHERE s.status IN ('active', 'past_due')
ORDER BY s.current_period_end ASC;
```

---

## Migration from v1.0 to v2.0

See `backend/migrations/001_add_multiuser.sql` for complete migration script.

**Summary:**
1. Add `user_id` column to `indesign_templates` and `magazine_generations`
2. Create new tables: `profiles`, `subscriptions`, `usage_logs`
3. Migrate existing data to admin user
4. Enable RLS policies
5. Set `user_id` columns to NOT NULL

**Rollback:** Included in migration file (commented out)

---

## Performance Considerations

### Indexes

All foreign keys and commonly queried columns are indexed:
- User lookups: `profiles(email)`, `profiles(stripe_customer_id)`
- Template filtering: `indesign_templates(user_id)`
- Generation history: `magazine_generations(user_id, created_at DESC)`
- Usage logs: `usage_logs(user_id, action, created_at DESC)`

### Query Optimization

**Good:**
```sql
-- Uses index on user_id
SELECT * FROM indesign_templates WHERE user_id = 'uuid';
```

**Bad:**
```sql
-- Full table scan
SELECT * FROM indesign_templates WHERE name LIKE '%magazine%';
```

**Solution for search:** Add GIN index if needed:
```sql
CREATE INDEX idx_templates_name_gin ON indesign_templates USING GIN (to_tsvector('english', name));
```

---

## Backup & Recovery

### Manual Backup

```bash
# Via Supabase dashboard
# Settings → Database → Create backup

# Or via CLI
supabase db dump -f backup.sql
```

### Automated Backups

Supabase automatically backs up databases:
- **Free tier:** Daily backups, 7 days retention
- **Pro tier:** Daily backups, 30 days retention + PITR (Point-in-Time Recovery)

### Restore from Backup

```bash
# Via SQL Editor
-- Paste backup.sql content

# Or via CLI
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

---

## Monitoring

### Key Metrics to Track

1. **Database Size:**
   ```sql
   SELECT pg_size_pretty(pg_database_size('postgres'));
   ```

2. **Table Sizes:**
   ```sql
   SELECT
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

3. **Active Connections:**
   ```sql
   SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'postgres';
   ```

4. **Slow Queries:** (via Supabase Dashboard → Database → Query Performance)

---

## Security Best Practices

1. **Never expose `service_role` key** to frontend
   - Use `anon` key in frontend
   - `service_role` only in backend (bypasses RLS)

2. **Always use RLS policies**
   - Don't rely on backend filtering alone
   - RLS = defense in depth

3. **Validate input in backend**
   - Even with RLS, validate data before insert/update

4. **Rotate secrets regularly**
   - Supabase keys every 90 days
   - Regenerate via dashboard

5. **Monitor for anomalies**
   - Unusual query patterns
   - Sudden usage spikes

---

## Troubleshooting

### Issue: RLS blocking legitimate queries

**Symptom:** User can't see their own data

**Solution:**
```sql
-- Check if RLS is enabled
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'profiles';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Verify JWT contains correct user_id
SELECT auth.uid();  -- Should return user's UUID
```

### Issue: Migration fails with orphaned records

**Symptom:** `001_add_multiuser.sql` reports orphaned templates/generations

**Solution:**
```sql
-- Find orphaned records
SELECT * FROM indesign_templates WHERE user_id IS NULL;

-- Manually assign to admin
UPDATE indesign_templates
SET user_id = 'admin-uuid'
WHERE user_id IS NULL;
```

### Issue: Usage not resetting monthly

**Symptom:** Users still seeing old usage counts

**Solution:**
```sql
-- Manually reset
UPDATE profiles
SET
  monthly_generations_used = 0,
  usage_reset_date = DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month');

-- Set up cron job (backend/cron.js)
cron.schedule('0 0 1 * *', async () => {
  await supabase.rpc('reset_monthly_usage');
});
```

---

## Reference Links

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Schema SQL File](../backend/supabase-schema-v2.sql)
- [Migration Script](../backend/migrations/001_add_multiuser.sql)

---

*Last updated: 2026-01-09 by Winston (Architect)*
