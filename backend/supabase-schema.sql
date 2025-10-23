-- ============================================
-- MagFlow - Supabase Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: indesign_templates
-- Stocke les templates InDesign disponibles
-- ============================================
CREATE TABLE IF NOT EXISTS indesign_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  filename TEXT NOT NULL UNIQUE,
  description TEXT,
  preview_url TEXT,
  
  -- Métadonnées du template
  placeholders JSONB DEFAULT '[]'::jsonb,
  image_slots INTEGER DEFAULT 0,
  category TEXT,
  style TEXT,
  recommended_for TEXT[] DEFAULT '{}',
  
  -- Chemin vers le fichier .indt sur le serveur Flask
  file_path TEXT NOT NULL,
  
  -- Statut
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX idx_templates_active ON indesign_templates(is_active);
CREATE INDEX idx_templates_category ON indesign_templates(category);
CREATE INDEX idx_templates_filename ON indesign_templates(filename);

-- ============================================
-- Table: magazine_generations
-- Historique des générations de magazines
-- ============================================
CREATE TABLE IF NOT EXISTS magazine_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Référence au template utilisé
  template_id UUID REFERENCES indesign_templates(id) ON DELETE SET NULL,
  
  -- Structure du contenu analysé
  content_structure JSONB NOT NULL,
  
  -- URLs des images utilisées
  image_urls TEXT[] NOT NULL,
  
  -- ID du projet Flask
  flask_project_id TEXT,
  
  -- Statut de la génération
  status TEXT NOT NULL DEFAULT 'processing',
  -- Valeurs possibles: 'processing', 'completed', 'error'
  
  -- Message d'erreur si applicable
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Contrainte de validation du statut
  CONSTRAINT valid_status CHECK (status IN ('processing', 'completed', 'error'))
);

-- Index pour recherche rapide
CREATE INDEX idx_generations_status ON magazine_generations(status);
CREATE INDEX idx_generations_created ON magazine_generations(created_at DESC);
CREATE INDEX idx_generations_template ON magazine_generations(template_id);

-- ============================================
-- Function: update_updated_at
-- Met à jour automatiquement updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour indesign_templates
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON indesign_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Données initiales: Templates InDesign existants
-- ============================================
INSERT INTO indesign_templates (
  name, 
  filename, 
  description,
  placeholders, 
  image_slots, 
  category, 
  style,
  recommended_for,
  file_path
) VALUES 
(
  'Magazine Artistique Simple',
  'template-mag-simple-1808.indt',
  'Template simple et élégant pour articles artistiques et culturels',
  '["{{TITRE}}", "{{SOUS-TITRE}}", "{{ARTICLE}}"]'::jsonb,
  3,
  'Art & Culture',
  'simple',
  ARRAY['Art & Culture', 'Design', 'Photographie'],
  '/Users/alexandreerrasti/Documents/magflow/Indesign automation v1/indesign_templates/template-mag-simple-1808.indt'
),
(
  'Magazine Artistique Avancé',
  'template-mag-simple-2-1808.indt',
  'Template avec mise en page plus complexe pour contenus riches',
  '["{{TITRE}}", "{{SOUS-TITRE}}", "{{ARTICLE}}", "{{ENCADRE_1}}", "{{ENCADRE_2}}"]'::jsonb,
  5,
  'Art & Culture',
  'moyen',
  ARRAY['Art & Culture', 'Design', 'Magazine', 'Editorial'],
  '/Users/alexandreerrasti/Documents/magflow/Indesign automation v1/indesign_templates/template-mag-simple-2-1808.indt'
),
(
  'Magazine Art - Page 1',
  'Magazine art template page 1.indd',
  'Template page 1 pour magazines d''art avec design sophistiqué',
  '["{{TITRE}}", "{{CHAPO}}", "{{SECTION_1}}", "{{SECTION_2}}"]'::jsonb,
  4,
  'Art & Culture',
  'complexe',
  ARRAY['Art & Culture', 'Design', 'Mode', 'Lifestyle'],
  '/Users/alexandreerrasti/Documents/magflow/Indesign automation v1/indesign_templates/Magazine art template page 1.indd'
)
ON CONFLICT (filename) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  placeholders = EXCLUDED.placeholders,
  image_slots = EXCLUDED.image_slots,
  category = EXCLUDED.category,
  style = EXCLUDED.style,
  recommended_for = EXCLUDED.recommended_for,
  file_path = EXCLUDED.file_path,
  updated_at = NOW();

-- ============================================
-- Row Level Security (RLS)
-- À activer en production si authentification
-- ============================================
-- ALTER TABLE indesign_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE magazine_generations ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut lire les templates actifs
-- CREATE POLICY "Templates are viewable by everyone"
--   ON indesign_templates FOR SELECT
--   USING (is_active = true);

-- Politique: Seuls les utilisateurs authentifiés peuvent générer
-- CREATE POLICY "Authenticated users can generate magazines"
--   ON magazine_generations FOR INSERT
--   WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- Vue: Templates avec statistiques
-- ============================================
CREATE OR REPLACE VIEW templates_stats AS
SELECT 
  t.*,
  COUNT(g.id) as usage_count,
  MAX(g.created_at) as last_used_at
FROM indesign_templates t
LEFT JOIN magazine_generations g ON t.id = g.template_id
WHERE t.is_active = true
GROUP BY t.id
ORDER BY usage_count DESC, t.created_at DESC;

-- ============================================
-- Fonction: Recherche de templates
-- ============================================
CREATE OR REPLACE FUNCTION search_templates(
  search_query TEXT,
  search_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  filename TEXT,
  description TEXT,
  category TEXT,
  style TEXT,
  image_slots INTEGER,
  score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.filename,
    t.description,
    t.category,
    t.style,
    t.image_slots,
    -- Score basé sur la pertinence du texte
    ts_rank(
      to_tsvector('french', COALESCE(t.name, '') || ' ' || COALESCE(t.description, '')),
      plainto_tsquery('french', search_query)
    ) as score
  FROM indesign_templates t
  WHERE 
    t.is_active = true
    AND (
      search_category IS NULL 
      OR t.category = search_category
    )
    AND (
      to_tsvector('french', COALESCE(t.name, '') || ' ' || COALESCE(t.description, ''))
      @@ plainto_tsquery('french', search_query)
    )
  ORDER BY score DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Commentaires pour documentation
-- ============================================
COMMENT ON TABLE indesign_templates IS 'Templates InDesign disponibles pour génération de magazines';
COMMENT ON TABLE magazine_generations IS 'Historique des magazines générés';
COMMENT ON COLUMN indesign_templates.placeholders IS 'Liste JSON des placeholders utilisés dans le template';
COMMENT ON COLUMN indesign_templates.image_slots IS 'Nombre d''emplacements images disponibles';
COMMENT ON COLUMN indesign_templates.file_path IS 'Chemin absolu vers le fichier .indt sur le serveur Flask';
COMMENT ON COLUMN magazine_generations.content_structure IS 'Structure éditoriale analysée par OpenAI';
COMMENT ON COLUMN magazine_generations.flask_project_id IS 'ID du projet généré par Flask';

-- ============================================
-- Fin du schema
-- ============================================
