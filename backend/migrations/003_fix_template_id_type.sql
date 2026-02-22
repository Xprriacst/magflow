-- ============================================================================
-- Migration 003: Fix template_id type in magazine_generations
-- ============================================================================
-- Problem: template_id is UUID but fallback templates use string IDs like "fallback-1"
-- Solution: Change template_id to TEXT type
-- ============================================================================

-- Drop the foreign key constraint first
ALTER TABLE magazine_generations
DROP CONSTRAINT IF EXISTS magazine_generations_template_id_fkey;

-- Change column type from UUID to TEXT
ALTER TABLE magazine_generations
ALTER COLUMN template_id TYPE TEXT USING template_id::TEXT;

-- Recreate index for the new type
DROP INDEX IF EXISTS idx_generations_template;
CREATE INDEX idx_generations_template ON magazine_generations(template_id);

-- Update schema version
INSERT INTO public.schema_version (version, description)
VALUES ('2.0.3', 'Fix template_id type to TEXT for fallback templates')
ON CONFLICT (version) DO NOTHING;
