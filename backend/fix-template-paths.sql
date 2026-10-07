-- ============================================
-- FIX: Correction des chemins templates
-- Date: 23 Octobre 2025
-- Raison: Les chemins locaux appartiennent à la configuration de l'agent
-- ============================================

-- Template 1: Magazine Artistique Simple
UPDATE indesign_templates 
SET file_path = 'template-mag-simple-1808.indt'
WHERE filename = 'template-mag-simple-1808.indt';

-- Template 2: Magazine Artistique Avancé
UPDATE indesign_templates 
SET file_path = 'template-mag-simple-2-1808.indt'
WHERE filename = 'template-mag-simple-2-1808.indt';

-- Template 3: Magazine Art Page 1
UPDATE indesign_templates 
SET file_path = 'Magazine art template page 1.indd'
WHERE filename = 'Magazine art template page 1.indd';

-- Vérification
SELECT 
  name,
  filename,
  file_path,
  CASE 
    WHEN file_path = filename THEN '✅ Portable'
    WHEN file_path LIKE '/%' THEN '❌ Chemin absolu'
    ELSE '⚠️ À vérifier'
  END as status
FROM indesign_templates
ORDER BY created_at;
