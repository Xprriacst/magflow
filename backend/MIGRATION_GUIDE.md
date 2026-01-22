# MagFlow v1.0 → v2.0 Migration Guide

**Story:** 1.1 - Database Schema Multi-User
**Status:** Ready to Execute
**Estimated Time:** 15-20 minutes

---

## 📋 Pre-Migration Checklist

Before starting, ensure you have:

- [ ] Access to Supabase Dashboard (https://wxtrhxvyjfsqgphboqwo.supabase.co)
- [ ] Database backup created (see Step 1 below)
- [ ] Admin email ready (your email address)
- [ ] 15-20 minutes of uninterrupted time

---

## 🚀 Migration Steps

### Step 1: Create Database Backup

1. Go to **Supabase Dashboard** → **Settings** → **Database**
2. Scroll to **Database Backups**
3. Click **"Download backup"** or verify automatic backup is enabled
4. ✅ **Backup created**

---

### Step 2: Verify Current Schema State

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy/paste the contents of:
   ```
   backend/scripts/verify-schema-detailed.sql
   ```
4. Click **"Run"**
5. **Review the output** to see what exists and what's missing

**Expected Output:**
- ❌ `profiles` MISSING
- ❌ `subscriptions` MISSING
- ❌ `usage_logs` MISSING
- ✅ `indesign_templates` exists
- ✅ `magazine_generations` exists
- ❌ `indesign_templates.user_id` MISSING
- ❌ `magazine_generations.user_id` MISSING
- ❌ RLS DISABLED on all tables

---

### Step 3: Execute Schema v2

1. Still in **SQL Editor**, create a **new query**
2. Copy/paste the ENTIRE contents of:
   ```
   backend/supabase-schema-v2.sql
   ```
3. Click **"Run"** (this will take 5-10 seconds)
4. ✅ **Verify success** - you should see:
   - "Success. No rows returned"
   - No errors in the output

**What this does:**
- ✅ Creates new tables: `profiles`, `subscriptions`, `usage_logs`
- ✅ Adds `user_id` column to `indesign_templates`
- ✅ Adds `user_id` column to `magazine_generations`
- ✅ Adds `visibility` column to `indesign_templates`
- ✅ Enables RLS on all tables
- ✅ Creates RLS policies for multi-user access
- ✅ Creates triggers for auto-profile creation
- ✅ Creates functions for monthly usage reset

---

### Step 4: Create Admin User

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - **Email:** YOUR_ADMIN_EMAIL@example.com (use your real email!)
   - **Password:** Choose a strong password
   - **Auto Confirm User:** ✅ YES (check this box)
4. Click **"Create user"**
5. **Copy the User UUID** (you'll see it in the users list - looks like `a1b2c3d4-...`)
6. ✅ **Admin user created**

---

### Step 5: Prepare Migration Script

1. Open the file: `backend/migrations/001_add_multiuser.sql`
2. **Find and replace** (4 occurrences):
   ```sql
   REPLACE_WITH_YOUR_ADMIN_EMAIL@example.com
   ```
   With your actual admin email from Step 4, for example:
   ```sql
   alexandre@magflow.com
   ```
3. **Save the file**
4. ✅ **Migration script ready**

---

### Step 6: Execute Migration

1. Back in **SQL Editor**, create a **new query**
2. Copy/paste the ENTIRE contents of:
   ```
   backend/migrations/001_add_multiuser.sql
   ```
   (The version you just modified with your email)
3. Click **"Run"**
4. **Read the output carefully** - you should see:

```
========================================
MagFlow Migration 001: Multi-User Setup
========================================

Starting pre-migration checks...
Found X existing templates
Found Y existing generations
IMPORTANT: Existing data will be migrated to admin user

STEP 1: Creating admin user profile...
Found admin user: YOUR_EMAIL (UUID: ...)
✓ Admin profile created/updated

STEP 2: Migrating existing templates...
✓ Migrated X templates to admin user

STEP 3: Migrating existing magazine generations...
✓ Migrated Y generations to admin user

STEP 4: Verifying data integrity...
  Orphaned templates: 0
  Orphaned generations: 0
  Admin templates: X
  Admin generations: Y
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
  Total templates: X
  Total generations: Y

Admin User: YOUR_EMAIL

Next Steps:
  1. Test login with admin account
  2. Create a test user via signup page
  3. Verify test user can only see their own data
  4. Verify admin can see all data
  5. Test generation with usage limits

Migration 001 completed successfully!
```

5. ✅ **Migration complete**

---

### Step 7: Verify Migration Success

1. Run the verification script again:
   ```
   backend/scripts/verify-schema-detailed.sql
   ```
2. **Expected output NOW:**
   - ✅ `profiles` exists
   - ✅ `subscriptions` exists
   - ✅ `usage_logs` exists
   - ✅ `indesign_templates.user_id` exists
   - ✅ `magazine_generations.user_id` exists
   - ✅ RLS ENABLED on all tables
   - ✅ Templates with NULL user_id: 0
   - ✅ Generations with NULL user_id: 0

---

## ✅ Post-Migration Validation

### Test 1: Check Profiles Table

Run in SQL Editor:

```sql
SELECT id, email, role, subscription_tier, monthly_limit
FROM public.profiles;
```

**Expected:** 1 row with your admin user

---

### Test 2: Check Templates Ownership

Run in SQL Editor:

```sql
SELECT id, name, user_id
FROM public.indesign_templates
WHERE user_id IS NULL;
```

**Expected:** 0 rows (all templates should have user_id)

---

### Test 3: Check RLS Policies

Run in SQL Editor:

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected:** Multiple policies for each table (users can read own, admins can read all, etc.)

---

### Test 4: Verify Triggers

Run in SQL Editor:

```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

**Expected:** Triggers for `handle_new_user`, `handle_updated_at`, etc.

---

## 🎉 Success Criteria

Migration is successful if:

- ✅ All new tables exist (profiles, subscriptions, usage_logs)
- ✅ All columns added (user_id on templates and generations)
- ✅ RLS enabled on all tables
- ✅ Admin user profile created
- ✅ All existing data migrated to admin user
- ✅ No orphaned records (user_id IS NULL)
- ✅ All validation queries pass

---

## ⚠️ Troubleshooting

### Error: "Admin user not found"

**Problem:** Migration script can't find admin user
**Solution:**
1. Make sure you created the admin user in Step 4
2. Verify the email in `001_add_multiuser.sql` matches EXACTLY
3. Check for typos (spaces, capitalization)

---

### Error: "column user_id already exists"

**Problem:** Schema v2 already partially applied
**Solution:**
- This is OK! The schema is idempotent (safe to run multiple times)
- Continue with the migration script

---

### Error: "RLS policy already exists"

**Problem:** Policies already created from previous attempt
**Solution:**
- This is OK! Skip to migration script (Step 6)

---

### Error: "relation profiles does not exist"

**Problem:** Schema v2 not executed
**Solution:**
1. Go back to Step 3
2. Execute `supabase-schema-v2.sql` BEFORE migration

---

## 🔄 Rollback (Emergency Only)

If something goes wrong and you need to rollback:

1. Open `backend/migrations/001_add_multiuser.sql`
2. Scroll to the **ROLLBACK SCRIPT** section (line 304)
3. **Uncomment** lines 309-363
4. Run in SQL Editor
5. **Restore from backup** (Step 1)

**⚠️ WARNING:** Rollback will remove ALL multi-user features!

---

## 📝 Next Steps After Migration

Once migration is complete:

1. ✅ Update Story 1.1 status to "Ready for Review"
2. ➡️ Continue to **Story 1.2**: Backend Auth Middleware
3. ➡️ Continue to **Story 1.3**: Usage Tracking & Limits

---

## 🆘 Need Help?

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review the error message in SQL Editor
3. Verify you followed all steps in order
4. Check that backup exists before attempting rollback

---

**Last Updated:** 2026-01-10
**Author:** James (Dev Agent)
**Story:** 1.1 - Database Schema Multi-User
