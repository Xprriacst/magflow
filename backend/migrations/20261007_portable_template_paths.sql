-- Nettoie les chemins machine historiques. L'agent résout ensuite le nom du
-- fichier sous MAGFLOW_TEMPLATES_DIR.
UPDATE indesign_templates
SET file_path = filename,
    updated_at = NOW()
WHERE file_path LIKE '/Users/%'
   OR file_path LIKE '/home/%'
   OR file_path ~ '^[A-Za-z]:[\\/]';
