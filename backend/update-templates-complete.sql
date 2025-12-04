-- ============================================
-- MISE À JOUR COMPLÈTE DES TEMPLATES
-- Date: 23 Octobre 2025
-- Inclut: Chemins + Images de preview
-- ============================================

-- Template 1: Magazine Artistique Simple
UPDATE indesign_templates 
SET 
  file_path = '/Users/alexandreerrasti/Documents/magflow/Indesign automation v1/indesign_templates/template-mag-simple-1808.indt',
  preview_url = NULL  -- Pas d'image pour le moment
WHERE filename = 'template-mag-simple-1808.indt';

-- Template 2: Magazine Artistique Avancé
UPDATE indesign_templates 
SET 
  file_path = '/Users/alexandreerrasti/Documents/magflow/Indesign automation v1/indesign_templates/template-mag-simple-2-1808.indt',
  preview_url = '/assets/images/Capture_d_ecran_2025-09-12_a_22.10.29-1757707887314.png'
WHERE filename = 'template-mag-simple-2-1808.indt';

-- Template 3: Magazine Art - Page 1
UPDATE indesign_templates 
SET 
  file_path = '/Users/alexandreerrasti/Documents/magflow/Indesign automation v1/indesign_templates/Magazine art template page 1.indd',
  preview_url = '/assets/images/Capture_d_ecran_2025-09-12_a_22.10.38-1757756150308.png'
WHERE filename = 'Magazine art template page 1.indd';

-- ============================================
-- VÉRIFICATION COMPLÈTE
-- ============================================
SELECT 
  name,
  filename,
  CASE 
    WHEN file_path LIKE '%Documents/magflow%' THEN '✅ Chemin OK'
    WHEN file_path LIKE '%iCloud%' THEN '❌ Ancien chemin'
    ELSE '⚠️ Autre'
  END as chemin_status,
  CASE 
    WHEN preview_url IS NOT NULL THEN '✅ Image définie'
    ELSE '⚠️ Pas d''image'
  END as image_status,
  preview_url
FROM indesign_templates
ORDER BY created_at;
