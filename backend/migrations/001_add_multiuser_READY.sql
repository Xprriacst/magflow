-- ============================================================================
-- MagFlow Migration: Single-User to Multi-User
-- ============================================================================
-- Migration: 001_add_multiuser
-- From: v1.0 (single-user prototype)
-- To: v2.0 (multi-user SaaS with freemium)
-- Date: 2026-01-09
-- Author: Winston (Architect)
-- Modified: 2026-01-10 by James (Dev) - Email set to alexandre.errasti@gmail.com
--
-- IMPORTANT: This migration assumes you have:
-- 1. Created a backup of your database
-- 2. Executed supabase-schema-v2.sql first
-- 3. Created an admin user via Supabase Auth dashboard with email: alexandre.errasti@gmail.com
-- ============================================================================

-- ============================================================================
-- PRE-MIGRATION CHECKS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MagFlow Migration 001: Multi-User Setup';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Starting pre-migration checks...';
END $$;

-- Check if old tables exist
DO $$
DECLARE
  templates_count INTEGER;
  generations_count INTEGER;
BEGIN
  -- Count existing data
  SELECT COUNT(*) INTO templates_count FROM public.indesign_templates;
  SELECT COUNT(*) INTO generations_count FROM public.magazine_generations;

  RAISE NOTICE 'Found % existing templates', templates_count;
  RAISE NOTICE 'Found % existing generations', generations_count;

  IF templates_count > 0 OR generations_count > 0 THEN
    RAISE NOTICE 'IMPORTANT: Existing data will be migrated to admin user';
  ELSE
    RAISE NOTICE 'No existing data found - clean migration';
  END IF;
END $$;

-- ============================================================================
-- STEP 1: CREATE ADMIN USER PROFILE
-- ============================================================================

DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'alexandre.errasti@gmail.com'; -- ✅ SET
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 1: Creating admin user profile...';

  -- Try to find admin user in auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found with email: %. Please create admin user in Supabase Auth first!', admin_email;
  END IF;

  RAISE NOTICE 'Found admin user: % (UUID: %)', admin_email, admin_user_id;

  -- Create or update profile for admin
  INSERT INTO public.profiles (
    id,
    email,
    role,
    subscription_tier,
    monthly_limit,
    company_name
  ) VALUES (
    admin_user_id,
    admin_email,
    'admin',
    'pro', -- Admin gets pro features
    -1,    -- Unlimited generations
    'MagFlow Admin'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    subscription_tier = 'pro',
    monthly_limit = -1;

  RAISE NOTICE '✓ Admin profile created/updated';
END $$;

-- ============================================================================
-- STEP 2: MIGRATE EXISTING TEMPLATES
-- ============================================================================

DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'alexandre.errasti@gmail.com'; -- ✅ SET
  templates_migrated INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 2: Migrating existing templates...';

  -- Get admin user ID
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  -- Update all templates without user_id to belong to admin
  UPDATE public.indesign_templates
  SET user_id = admin_user_id
  WHERE user_id IS NULL;

  GET DIAGNOSTICS templates_migrated = ROW_COUNT;

  RAISE NOTICE '✓ Migrated % templates to admin user', templates_migrated;
END $$;

-- ============================================================================
-- STEP 3: MIGRATE EXISTING GENERATIONS
-- ============================================================================

DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'alexandre.errasti@gmail.com'; -- ✅ SET
  generations_migrated INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 3: Migrating existing magazine generations...';

  -- Get admin user ID
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  -- Update all generations without user_id to belong to admin
  UPDATE public.magazine_generations
  SET user_id = admin_user_id
  WHERE user_id IS NULL;

  GET DIAGNOSTICS generations_migrated = ROW_COUNT;

  RAISE NOTICE '✓ Migrated % generations to admin user', generations_migrated;
END $$;

-- ============================================================================
-- STEP 4: VERIFY DATA INTEGRITY
-- ============================================================================

DO $$
DECLARE
  orphaned_templates INTEGER;
  orphaned_generations INTEGER;
  admin_templates INTEGER;
  admin_generations INTEGER;
  admin_user_id UUID;
  admin_email TEXT := 'alexandre.errasti@gmail.com'; -- ✅ SET
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 4: Verifying data integrity...';

  -- Get admin user ID
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;

  -- Check for orphaned templates (should be 0)
  SELECT COUNT(*) INTO orphaned_templates
  FROM public.indesign_templates
  WHERE user_id IS NULL;

  -- Check for orphaned generations (should be 0)
  SELECT COUNT(*) INTO orphaned_generations
  FROM public.magazine_generations
  WHERE user_id IS NULL;

  -- Count admin's data
  SELECT COUNT(*) INTO admin_templates
  FROM public.indesign_templates
  WHERE user_id = admin_user_id;

  SELECT COUNT(*) INTO admin_generations
  FROM public.magazine_generations
  WHERE user_id = admin_user_id;

  RAISE NOTICE '  Orphaned templates: %', orphaned_templates;
  RAISE NOTICE '  Orphaned generations: %', orphaned_generations;
  RAISE NOTICE '  Admin templates: %', admin_templates;
  RAISE NOTICE '  Admin generations: %', admin_generations;

  IF orphaned_templates > 0 OR orphaned_generations > 0 THEN
    RAISE EXCEPTION 'Data integrity check failed! Found orphaned records.';
  END IF;

  RAISE NOTICE '✓ Data integrity verified';
END $$;

-- ============================================================================
-- STEP 5: MAKE user_id COLUMNS NOT NULL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 5: Enforcing NOT NULL constraints...';

  -- Now that all records have user_id, make it required
  ALTER TABLE public.indesign_templates
  ALTER COLUMN user_id SET NOT NULL;

  ALTER TABLE public.magazine_generations
  ALTER COLUMN user_id SET NOT NULL;

  RAISE NOTICE '✓ NOT NULL constraints applied';
END $$;

-- ============================================================================
-- STEP 6: VERIFY RLS POLICIES
-- ============================================================================

DO $$
DECLARE
  profiles_rls BOOLEAN;
  templates_rls BOOLEAN;
  generations_rls BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 6: Verifying RLS is enabled...';

  -- Check RLS status
  SELECT relrowsecurity INTO profiles_rls
  FROM pg_class
  WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace;

  SELECT relrowsecurity INTO templates_rls
  FROM pg_class
  WHERE relname = 'indesign_templates' AND relnamespace = 'public'::regnamespace;

  SELECT relrowsecurity INTO generations_rls
  FROM pg_class
  WHERE relname = 'magazine_generations' AND relnamespace = 'public'::regnamespace;

  RAISE NOTICE '  profiles RLS: %', COALESCE(profiles_rls::TEXT, 'NOT ENABLED');
  RAISE NOTICE '  indesign_templates RLS: %', COALESCE(templates_rls::TEXT, 'NOT ENABLED');
  RAISE NOTICE '  magazine_generations RLS: %', COALESCE(generations_rls::TEXT, 'NOT ENABLED');

  IF NOT (profiles_rls AND templates_rls AND generations_rls) THEN
    RAISE WARNING 'RLS is not enabled on all tables! Run supabase-schema-v2.sql to enable.';
  ELSE
    RAISE NOTICE '✓ RLS enabled on all tables';
  END IF;
END $$;

-- ============================================================================
-- POST-MIGRATION SUMMARY
-- ============================================================================

DO $$
DECLARE
  total_users INTEGER;
  total_templates INTEGER;
  total_generations INTEGER;
  admin_email TEXT := 'alexandre.errasti@gmail.com'; -- ✅ SET
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Summary stats
  SELECT COUNT(*) INTO total_users FROM public.profiles;
  SELECT COUNT(*) INTO total_templates FROM public.indesign_templates;
  SELECT COUNT(*) INTO total_generations FROM public.magazine_generations;

  RAISE NOTICE 'Database Summary:';
  RAISE NOTICE '  Total users: %', total_users;
  RAISE NOTICE '  Total templates: %', total_templates;
  RAISE NOTICE '  Total generations: %', total_generations;
  RAISE NOTICE '';
  RAISE NOTICE 'Admin User: %', admin_email;
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Test login with admin account';
  RAISE NOTICE '  2. Create a test user via signup page';
  RAISE NOTICE '  3. Verify test user can only see their own data';
  RAISE NOTICE '  4. Verify admin can see all data';
  RAISE NOTICE '  5. Test generation with usage limits';
  RAISE NOTICE '';
  RAISE NOTICE 'Migration 001 completed successfully!';
END $$;
