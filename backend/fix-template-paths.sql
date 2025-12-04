-- ============================================
-- FIX: Correction des chemins templates
-- Date: 23 Octobre 2025
-- Raison: Déplacement projet de iCloud vers Documents
-- ============================================

-- Ancien chemin: /Users/alexandreerrasti/Library/Mobile Documents/com~apple~CloudDocs/magflow/
-- Nouveau chemin: /Users/alexandreerrasti/Documents/magflow/

-- Template 1: Magazine Artistique Simple
UPDATE indesign_templates 
SET file_path = '/Users/alexandreerrasti/Documents/magflow/Indesign automation v1/indesign_templates/template-mag-simple-1808.indt'
WHERE filename = 'template-mag-simple-1808.indt';

-- Template 2: Magazine Artistique Avancé
UPDATE indesign_templates 
SET file_path = '/Users/alexandreerrasti/Documents/magflow/Indesign automation v1/indesign_templates/template-mag-simple-2-1808.indt'
WHERE filename = 'template-mag-simple-2-1808.indt';

-- Template 3: Magazine Art Page 1
UPDATE indesign_templates 
SET file_path = '/Users/alexandreerrasti/Documents/magflow/Indesign automation v1/indesign_templates/Magazine art template page 1.indd'
WHERE filename = 'Magazine art template page 1.indd';

-- Vérification
SELECT 
  name,
  filename,
  file_path,
  CASE 
    WHEN file_path LIKE '%Documents/magflow%' THEN '✅ Correct'
    WHEN file_path LIKE '%iCloud%' THEN '❌ Ancien chemin'
    ELSE '⚠️ Autre'
  END as status
FROM indesign_templates
ORDER BY created_at;
