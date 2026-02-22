# 🚀 EXECUTE MIGRATION NOW - Step by Step

**Admin User Already Created:** ✅
- Email: alexandre.errasti@gmail.com
- UUID: 37683d7a-3d7f-4a0d-869f-37126ae7cdfe
- Password: (check your Supabase Auth dashboard)

---

## ⚡ Quick Start (5 minutes)

### STEP 1: Open Supabase SQL Editor

1. Go to: https://wxtrhxvyjfsqgphboqwo.supabase.co
2. Click **SQL Editor** in the left sidebar
3. Click **New query**

---

### STEP 2: Execute Schema v2 (Create Tables + RLS)

**Copy/Paste this file into SQL Editor:**

```
backend/supabase-schema-v2.sql
```

**How to copy:**
```bash
# Open the file in your editor or run:
cat backend/supabase-schema-v2.sql | pbcopy
```

Then:
1. Paste the entire content into SQL Editor
2. Click **RUN** (bottom right)
3. Wait 5-10 seconds
4. ✅ You should see "Success. No rows returned"

**What this does:**
- Creates `profiles`, `subscriptions`, `usage_logs` tables
- Adds `user_id` column to `indesign_templates` and `magazine_generations`
- Enables RLS on all tables
- Creates RLS policies
- Creates triggers for auto-profile creation

---

### STEP 3: Execute Migration (Migrate Data)

**Copy/Paste this file into SQL Editor:**

```
backend/migrations/001_add_multiuser_READY.sql
```

**This file already has your email set to:** `alexandre.errasti@gmail.com` ✅

**How to copy:**
```bash
# Open the file or run:
cat backend/migrations/001_add_multiuser_READY.sql | pbcopy
```

Then:
1. Click **New query** in SQL Editor
2. Paste the entire content
3. Click **RUN**
4. Wait for execution
5. ✅ Read the output - you should see:

```
========================================
MagFlow Migration 001: Multi-User Setup
========================================

Starting pre-migration checks...
Found 5 existing templates
Found 128 existing generations
IMPORTANT: Existing data will be migrated to admin user

STEP 1: Creating admin user profile...
Found admin user: alexandre.errasti@gmail.com (UUID: 37683d7a-3d7f-4a0d-869f-37126ae7cdfe)
✓ Admin profile created/updated

STEP 2: Migrating existing templates...
✓ Migrated 5 templates to admin user

STEP 3: Migrating existing magazine generations...
✓ Migrated 128 generations to admin user

STEP 4: Verifying data integrity...
  Orphaned templates: 0
  Orphaned generations: 0
  Admin templates: 5
  Admin generations: 128
✓ Data integrity verified

STEP 5: Enforcing NOT NULL constraints...
✓ NOT NULL constraints applied

STEP 6: Verifying RLS is enabled...
  profiles RLS: t
  indesign_templates RLS: t
  magazine_generations RLS: t
✓ RLS enabled on all tables

========================================
Migration Complete!
========================================

Database Summary:
  Total users: 1
  Total templates: 5
  Total generations: 128

Admin User: alexandre.errasti@gmail.com

Next Steps:
  1. Test login with admin account
  2. Create a test user via signup page
  3. Verify test user can only see their own data
  4. Verify admin can see all data
  5. Test generation with usage limits

Migration 001 completed successfully!
```

---

## ✅ Verification (Optional but Recommended)

After both scripts execute successfully, run this verification query:

```sql
-- Check profiles
SELECT id, email, role, subscription_tier, monthly_limit
FROM public.profiles;

-- Check templates have user_id
SELECT COUNT(*) as total, COUNT(user_id) as with_user_id
FROM public.indesign_templates;

-- Check RLS is enabled
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'subscriptions', 'usage_logs', 'indesign_templates', 'magazine_generations')
ORDER BY tablename;
```

**Expected Results:**
- 1 profile for alexandre.errasti@gmail.com
- All templates have user_id
- RLS enabled = true on all tables

---

## 🎉 Done!

Once both scripts execute successfully:

1. ✅ Database migrated to v2.0
2. ✅ Multi-user support enabled
3. ✅ RLS policies active
4. ✅ Admin user profile created
5. ✅ All existing data belongs to admin user

---

## ⚠️ Troubleshooting

### Error: "relation profiles already exists"
**Solution:** Schema v2 already executed. Skip STEP 2, go to STEP 3.

### Error: "column user_id already exists"
**Solution:** Schema v2 already executed. Skip STEP 2, go to STEP 3.

### Error: "Admin user not found with email"
**Solution:** Check that admin user exists in Authentication → Users with exact email: alexandre.errasti@gmail.com

---

## 📞 Need Help?

If you encounter errors:
1. Copy the exact error message
2. Check which STEP failed
3. Look at the Troubleshooting section above
4. Ask me for help with the specific error

---

**Created:** 2026-01-10
**Admin Email:** alexandre.errasti@gmail.com
**Admin UUID:** 37683d7a-3d7f-4a0d-869f-37126ae7cdfe
