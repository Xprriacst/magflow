-- ============================================
-- Migration: Add Cloud Storage for Templates
-- ============================================

-- Ajouter storage_url pour le lien Supabase Storage
ALTER TABLE indesign_templates 
ADD COLUMN IF NOT EXISTS storage_url TEXT;

-- Ajouter version pour le cache/sync
ALTER TABLE indesign_templates 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Ajouter checksum pour détecter les changements
ALTER TABLE indesign_templates 
ADD COLUMN IF NOT EXISTS file_checksum TEXT;

-- Commentaires
COMMENT ON COLUMN indesign_templates.storage_url IS 'URL du fichier template dans Supabase Storage';
COMMENT ON COLUMN indesign_templates.version IS 'Version du template pour sync client (incrémenté à chaque update)';
COMMENT ON COLUMN indesign_templates.file_checksum IS 'MD5 checksum du fichier pour détecter les changements';

-- Trigger pour incrémenter la version à chaque modification
CREATE OR REPLACE FUNCTION increment_template_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrémenter la version si le fichier a changé
  IF OLD.storage_url IS DISTINCT FROM NEW.storage_url 
     OR OLD.file_checksum IS DISTINCT FROM NEW.file_checksum THEN
    NEW.version = COALESCE(OLD.version, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_template_version ON indesign_templates;
CREATE TRIGGER trigger_increment_template_version
  BEFORE UPDATE ON indesign_templates
  FOR EACH ROW
  EXECUTE FUNCTION increment_template_version();

-- ============================================
-- Créer le bucket Storage (à exécuter manuellement dans Supabase Dashboard)
-- ============================================
-- 1. Aller dans Storage > New Bucket
-- 2. Nom: "templates"
-- 3. Public: true (ou false avec RLS)
-- 4. File size limit: 100MB
-- 5. Allowed MIME types: application/octet-stream, application/x-indesign

-- ============================================
-- Politique RLS pour le bucket (si bucket privé)
-- ============================================
-- CREATE POLICY "Templates are downloadable by authenticated users"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'templates' AND auth.role() = 'authenticated');

-- CREATE POLICY "Admins can upload templates"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'templates' AND auth.role() = 'admin');
