-- ============================================
-- Mise à jour des images de preview des templates
-- Date: 23 Octobre 2025
-- ============================================

-- Template 2: Magazine Artistique Avancé
UPDATE indesign_templates 
SET preview_url = '/assets/images/Capture_d_ecran_2025-09-12_a_22.10.29-1757707887314.png'
WHERE filename = 'template-mag-simple-2-1808.indt';

-- Template 3: Magazine Art - Page 1
UPDATE indesign_templates 
SET preview_url = '/assets/images/Capture_d_ecran_2025-09-12_a_22.10.38-1757756150308.png'
WHERE filename = 'Magazine art template page 1.indd';

-- Vérification
SELECT 
  name,
  filename,
  preview_url,
  CASE 
    WHEN preview_url IS NOT NULL THEN '✅ Image définie'
    ELSE '❌ Pas d''image'
  END as status
FROM indesign_templates
ORDER BY created_at;
