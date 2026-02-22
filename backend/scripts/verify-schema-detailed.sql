-- ============================================================================
-- Detailed Schema Verification Script
-- ============================================================================
-- Run this in Supabase SQL Editor to see exact current state
-- ============================================================================

\echo '========================================';
\echo 'MagFlow Database Schema Verification';
\echo '========================================';
\echo '';

-- ============================================================================
-- 1. CHECK TABLES EXISTENCE
-- ============================================================================

\echo '1️⃣  TABLES EXISTENCE:';
\echo '────────────────────';

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN '✅ profiles exists'
    ELSE '❌ profiles MISSING'
  END as profiles_status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscriptions')
    THEN '✅ subscriptions exists'
    ELSE '❌ subscriptions MISSING'
  END as subscriptions_status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usage_logs')
    THEN '✅ usage_logs exists'
    ELSE '❌ usage_logs MISSING'
  END as usage_logs_status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'indesign_templates')
    THEN '✅ indesign_templates exists'
    ELSE '❌ indesign_templates MISSING'
  END as templates_status;

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'magazine_generations')
    THEN '✅ magazine_generations exists'
    ELSE '❌ magazine_generations MISSING'
  END as generations_status;

\echo '';
\echo '2️⃣  COLUMNS ON EXISTING TABLES:';
\echo '──────────────────────────────';

-- Check user_id on indesign_templates
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'indesign_templates'
      AND column_name = 'user_id'
    )
    THEN '✅ indesign_templates.user_id exists'
    ELSE '❌ indesign_templates.user_id MISSING'
  END as templates_user_id_status;

-- Check visibility on indesign_templates
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'indesign_templates'
      AND column_name = 'visibility'
    )
    THEN '✅ indesign_templates.visibility exists'
    ELSE '❌ indesign_templates.visibility MISSING'
  END as templates_visibility_status;

-- Check user_id on magazine_generations
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'magazine_generations'
      AND column_name = 'user_id'
    )
    THEN '✅ magazine_generations.user_id exists'
    ELSE '❌ magazine_generations.user_id MISSING'
  END as generations_user_id_status;

\echo '';
\echo '3️⃣  RLS STATUS:';
\echo '──────────────';

SELECT
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'subscriptions', 'usage_logs', 'indesign_templates', 'magazine_generations')
ORDER BY tablename;

\echo '';
\echo '4️⃣  DATA COUNTS:';
\echo '───────────────';

-- Count existing templates
SELECT
  'indesign_templates' as table_name,
  COUNT(*) as row_count
FROM public.indesign_templates;

-- Count existing generations
SELECT
  'magazine_generations' as table_name,
  COUNT(*) as row_count
FROM public.magazine_generations;

-- Count profiles (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    RAISE NOTICE 'profiles count: %', (SELECT COUNT(*) FROM public.profiles);
  ELSE
    RAISE NOTICE 'profiles table does not exist yet';
  END IF;
END $$;

\echo '';
\echo '5️⃣  USERS WITH NULL user_id (need migration):';
\echo '────────────────────────────────────────────';

-- Check templates without user_id
DO $$
DECLARE
  null_count INTEGER := 0;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'indesign_templates'
    AND column_name = 'user_id'
  ) THEN
    SELECT COUNT(*) INTO null_count
    FROM public.indesign_templates
    WHERE user_id IS NULL;

    RAISE NOTICE 'Templates with NULL user_id: %', null_count;
  ELSE
    RAISE NOTICE 'user_id column does not exist on indesign_templates yet';
  END IF;
END $$;

-- Check generations without user_id
DO $$
DECLARE
  null_count INTEGER := 0;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'magazine_generations'
    AND column_name = 'user_id'
  ) THEN
    SELECT COUNT(*) INTO null_count
    FROM public.magazine_generations
    WHERE user_id IS NULL;

    RAISE NOTICE 'Generations with NULL user_id: %', null_count;
  ELSE
    RAISE NOTICE 'user_id column does not exist on magazine_generations yet';
  END IF;
END $$;

\echo '';
\echo '========================================';
\echo 'VERIFICATION COMPLETE';
\echo '========================================';
