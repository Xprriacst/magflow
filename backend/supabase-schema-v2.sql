-- ============================================================================
-- MagFlow Database Schema v2.0
-- Multi-User SaaS with Freemium Model
-- ============================================================================
-- Author: Winston (Architect)
-- Date: 2026-01-09
-- Based on: PRD docs/prd.md
--
-- This schema extends the existing single-user MagFlow schema to support:
-- - Multi-user authentication (Supabase Auth)
-- - Freemium model with usage limits
-- - Stripe subscription management
-- - Admin panel capabilities
-- - Row Level Security (RLS) for data isolation
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: profiles
-- ============================================================================
-- Extends Supabase auth.users with application-specific user data
-- One-to-one relationship with auth.users

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile Information
  email TEXT NOT NULL UNIQUE,
  company_name TEXT,

  -- Subscription & Plan
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),

  -- Stripe Integration
  stripe_customer_id TEXT UNIQUE, -- Stripe customer ID
  stripe_subscription_id TEXT,    -- Stripe subscription ID (null for free users)

  -- Usage Tracking
  monthly_generations_used INTEGER NOT NULL DEFAULT 0,
  monthly_limit INTEGER NOT NULL DEFAULT 5, -- 5 for free, -1 for unlimited (pro)
  usage_reset_date DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month'),

  -- Authorization
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- Comments
COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON COLUMN public.profiles.monthly_limit IS '5 for free users, -1 for unlimited (pro users)';
COMMENT ON COLUMN public.profiles.usage_reset_date IS 'Date when monthly_generations_used resets to 0';

-- ============================================================================
-- TABLE: subscriptions
-- ============================================================================
-- Tracks Stripe subscription history and status changes

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Stripe Data
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL, -- Price ID from Stripe

  -- Subscription Details
  plan TEXT NOT NULL CHECK (plan IN ('pro_monthly', 'pro_annual')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),

  -- Billing Periods
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Comments
COMMENT ON TABLE public.subscriptions IS 'Stripe subscription data and history';
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'If true, subscription will cancel at end of current period';

-- ============================================================================
-- TABLE: usage_logs
-- ============================================================================
-- Tracks all user actions for analytics and audit

CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Action Details
  action TEXT NOT NULL CHECK (action IN (
    'generation',
    'template_upload',
    'template_delete',
    'login',
    'signup',
    'upgrade',
    'downgrade',
    'admin_action'
  )),

  -- Context
  metadata JSONB, -- Flexible field for action-specific data

  -- Tracking
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX idx_usage_logs_action ON public.usage_logs(action);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_metadata_gin ON public.usage_logs USING GIN (metadata);

-- Comments
COMMENT ON TABLE public.usage_logs IS 'Audit log of all user actions';
COMMENT ON COLUMN public.usage_logs.metadata IS 'JSON field for action-specific context (e.g., generation_id, template_id)';

-- ============================================================================
-- TABLE: indesign_templates (MODIFIED)
-- ============================================================================
-- Extends existing table to support user ownership

-- Add user_id column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'indesign_templates'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.indesign_templates
    ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add visibility column for future marketplace features (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'indesign_templates'
    AND column_name = 'visibility'
  ) THEN
    ALTER TABLE public.indesign_templates
    ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public'));
  END IF;
END $$;

-- Index for filtering by user
CREATE INDEX IF NOT EXISTS idx_indesign_templates_user_id ON public.indesign_templates(user_id);

-- Comments
COMMENT ON COLUMN public.indesign_templates.user_id IS 'Owner of this template (null for global/admin templates)';
COMMENT ON COLUMN public.indesign_templates.visibility IS 'private: only visible to owner, public: future marketplace feature';

-- ============================================================================
-- TABLE: magazine_generations (MODIFIED)
-- ============================================================================
-- Extends existing table to track which user created each generation

-- Add user_id column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'magazine_generations'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.magazine_generations
    ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Index for filtering by user
CREATE INDEX IF NOT EXISTS idx_magazine_generations_user_id ON public.magazine_generations(user_id);

-- Comments
COMMENT ON COLUMN public.magazine_generations.user_id IS 'User who created this generation';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indesign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magazine_generations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- PROFILES Policies
-- ----------------------------------------------------------------------------

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow signup (insert) - handled by trigger after auth.users insert
CREATE POLICY "Enable insert for authenticated users"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- SUBSCRIPTIONS Policies
-- ----------------------------------------------------------------------------

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all subscriptions
CREATE POLICY "Admins can read all subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Backend service can insert/update subscriptions (via service key)
-- Note: This is handled at the application level with service_role key

-- ----------------------------------------------------------------------------
-- USAGE_LOGS Policies
-- ----------------------------------------------------------------------------

-- Users can read their own logs
CREATE POLICY "Users can read own logs"
  ON public.usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all logs
CREATE POLICY "Admins can read all logs"
  ON public.usage_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Backend service can insert logs (via service key)
-- Note: This is handled at the application level with service_role key

-- ----------------------------------------------------------------------------
-- INDESIGN_TEMPLATES Policies
-- ----------------------------------------------------------------------------

-- Users can read their own templates
CREATE POLICY "Users can read own templates"
  ON public.indesign_templates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own templates
CREATE POLICY "Users can insert own templates"
  ON public.indesign_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
  ON public.indesign_templates
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
  ON public.indesign_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can read all templates
CREATE POLICY "Admins can read all templates"
  ON public.indesign_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert templates for any user
CREATE POLICY "Admins can insert templates"
  ON public.indesign_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any template
CREATE POLICY "Admins can update all templates"
  ON public.indesign_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- MAGAZINE_GENERATIONS Policies
-- ----------------------------------------------------------------------------

-- Users can read their own generations
CREATE POLICY "Users can read own generations"
  ON public.magazine_generations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own generations
CREATE POLICY "Users can insert own generations"
  ON public.magazine_generations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own generations
CREATE POLICY "Users can update own generations"
  ON public.magazine_generations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can read all generations
CREATE POLICY "Admins can read all generations"
  ON public.magazine_generations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: Create profile on signup
-- ----------------------------------------------------------------------------
-- Automatically creates a profile when a new user signs up via Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'user' -- Default role, can be changed to 'admin' manually
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates profile entry when user signs up';

-- ----------------------------------------------------------------------------
-- Function: Update updated_at timestamp
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.subscriptions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- Function: Reset monthly usage (call via cron)
-- ----------------------------------------------------------------------------
-- Resets monthly_generations_used to 0 for all users on the 1st of each month

CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET
    monthly_generations_used = 0,
    usage_reset_date = DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')
  WHERE usage_reset_date <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.reset_monthly_usage IS 'Resets monthly usage counters. Call via cron on 1st of each month.';

-- ============================================================================
-- INITIAL DATA / SEED
-- ============================================================================

-- Note: Admin user creation should be done manually or via migration script
-- Example (replace with real UUID from auth.users after signup):
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'admin@magflow.com';

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant access to tables for authenticated users
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.subscriptions TO authenticated;
GRANT ALL ON public.usage_logs TO authenticated;
GRANT ALL ON public.indesign_templates TO authenticated;
GRANT ALL ON public.magazine_generations TO authenticated;

-- Grant sequence usage (for auto-increment IDs if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- SCHEMA VERSION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.schema_version (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT
);

INSERT INTO public.schema_version (version, description)
VALUES ('2.0.0', 'Multi-user SaaS with freemium model')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
