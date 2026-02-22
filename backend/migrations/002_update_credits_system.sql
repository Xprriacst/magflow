-- ============================================================================
-- MagFlow Migration 002: Update Credits System
-- ============================================================================
-- Changes:
-- - Update default monthly_limit from 5 to 3 for free users
-- - Add credits_purchased column for bought credits
-- - Update existing free users to new limit
-- ============================================================================

-- 1. Add credits_purchased column (for additional credits bought via Stripe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'credits_purchased'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN credits_purchased INTEGER NOT NULL DEFAULT 0;

    COMMENT ON COLUMN public.profiles.credits_purchased IS 'Additional credits purchased via Stripe (never expires)';
  END IF;
END $$;

-- 2. Update default for new users (ALTER COLUMN DEFAULT)
ALTER TABLE public.profiles
ALTER COLUMN monthly_limit SET DEFAULT 3;

-- 3. Update existing FREE users who still have the old limit of 5
-- Only update if they haven't used any credits yet (to not disrupt active users)
UPDATE public.profiles
SET monthly_limit = 3
WHERE subscription_tier = 'free'
  AND monthly_limit = 5
  AND monthly_generations_used = 0;

-- 4. Create function to calculate total available credits
CREATE OR REPLACE FUNCTION public.get_available_credits(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  profile_record RECORD;
  monthly_remaining INTEGER;
  total_credits INTEGER;
BEGIN
  SELECT monthly_limit, monthly_generations_used, credits_purchased
  INTO profile_record
  FROM public.profiles
  WHERE id = user_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Unlimited users
  IF profile_record.monthly_limit = -1 THEN
    RETURN -1;
  END IF;

  -- Calculate: monthly remaining + purchased credits
  monthly_remaining := GREATEST(0, profile_record.monthly_limit - profile_record.monthly_generations_used);
  total_credits := monthly_remaining + COALESCE(profile_record.credits_purchased, 0);

  RETURN total_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_available_credits IS 'Returns total available credits (monthly remaining + purchased)';

-- 5. Create function to consume credits (prioritize monthly, then purchased)
CREATE OR REPLACE FUNCTION public.consume_credit(user_id UUID, pages_count INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
  monthly_remaining INTEGER;
  to_consume_from_monthly INTEGER;
  to_consume_from_purchased INTEGER;
BEGIN
  -- Lock row for update
  SELECT monthly_limit, monthly_generations_used, credits_purchased
  INTO profile_record
  FROM public.profiles
  WHERE id = user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Unlimited users always succeed
  IF profile_record.monthly_limit = -1 THEN
    -- Still track usage for analytics
    UPDATE public.profiles
    SET monthly_generations_used = monthly_generations_used + pages_count
    WHERE id = user_id;
    RETURN TRUE;
  END IF;

  -- Calculate available
  monthly_remaining := GREATEST(0, profile_record.monthly_limit - profile_record.monthly_generations_used);

  -- Check if enough credits
  IF (monthly_remaining + COALESCE(profile_record.credits_purchased, 0)) < pages_count THEN
    RETURN FALSE;
  END IF;

  -- Consume from monthly first, then from purchased
  to_consume_from_monthly := LEAST(pages_count, monthly_remaining);
  to_consume_from_purchased := pages_count - to_consume_from_monthly;

  UPDATE public.profiles
  SET
    monthly_generations_used = monthly_generations_used + to_consume_from_monthly,
    credits_purchased = GREATEST(0, credits_purchased - to_consume_from_purchased)
  WHERE id = user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.consume_credit IS 'Consumes credits: monthly first, then purchased. Returns TRUE if successful.';

-- 6. Create function to add purchased credits
CREATE OR REPLACE FUNCTION public.add_purchased_credits(user_id UUID, credits_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_total INTEGER;
BEGIN
  UPDATE public.profiles
  SET credits_purchased = credits_purchased + credits_amount
  WHERE id = user_id
  RETURNING credits_purchased INTO new_total;

  RETURN COALESCE(new_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.add_purchased_credits IS 'Adds purchased credits to user account. Returns new total.';

-- ============================================================================
-- Track migration version
-- ============================================================================
INSERT INTO public.schema_version (version, description)
VALUES ('2.1.0', 'Credits system update: 3 free credits, purchased credits support')
ON CONFLICT (version) DO NOTHING;
