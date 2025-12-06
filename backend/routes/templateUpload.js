import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';

const router = express.Router();

// Configuration multer pour upload temporaire
const upload = multer({
  dest: '/tmp/magflow-uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.indt', '.indd'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .indt and .indd files are allowed'));
    }
  }
});

/**
 * Calcule le checksum MD5 d'un fichier
 */
function getFileChecksum(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * POST /api/templates/upload
 * Upload un template vers Supabase Storage et met à jour la BDD
 */
router.post('/upload', upload.single('template'), async (req, res, next) => {
  const tempFilePath = req.file?.path;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (!isSupabaseConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured'
      });
    }

    const { templateId } = req.body;
    const originalName = req.file.originalname;
    const fileBuffer = fs.readFileSync(tempFilePath);
    const checksum = getFileChecksum(tempFilePath);

    // Chemin dans le bucket Storage
    const storagePath = `templates/${originalName}`;

    console.log(`[TemplateUpload] Uploading ${originalName} to Supabase Storage...`);

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('templates')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/octet-stream',
        upsert: true // Remplacer si existe
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('templates')
      .getPublicUrl(storagePath);

    const storageUrl = urlData?.publicUrl;

    console.log(`[TemplateUpload] Uploaded to: ${storageUrl}`);

    // Si templateId fourni, mettre à jour le template existant
    if (templateId) {
      const { data: template, error: updateError } = await supabase
        .from('indesign_templates')
        .update({
          storage_url: storageUrl,
          file_checksum: checksum,
          updated_at: new Date().toISOString()
          // version sera incrémenté automatiquement par le trigger
        })
        .eq('id', templateId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      res.json({
        success: true,
        message: 'Template uploaded and updated',
        template,
        storage_url: storageUrl
      });
    } else {
      // Nouveau template - retourner juste l'URL pour création manuelle
      res.json({
        success: true,
        message: 'File uploaded to storage',
        storage_url: storageUrl,
        file_checksum: checksum,
        filename: originalName
      });
    }

  } catch (error) {
    console.error('[TemplateUpload] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    // Nettoyer le fichier temporaire
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
});

/**
 * POST /api/templates/upload-local
 * Upload un template depuis un chemin local sur le serveur (admin/dev)
 */
router.post('/upload-local', async (req, res, next) => {
  try {
    const { localPath, templateId } = req.body;

    if (!localPath) {
      return res.status(400).json({
        success: false,
        error: 'localPath is required'
      });
    }

    if (!fs.existsSync(localPath)) {
      return res.status(404).json({
        success: false,
        error: `File not found: ${localPath}`
      });
    }

    if (!isSupabaseConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured'
      });
    }

    const filename = path.basename(localPath);
    const fileBuffer = fs.readFileSync(localPath);
    const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const storagePath = `templates/${filename}`;

    console.log(`[TemplateUpload] Uploading ${filename} from local path...`);

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('templates')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/octet-stream',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('templates')
      .getPublicUrl(storagePath);

    const storageUrl = urlData?.publicUrl;

    // Mettre à jour le template si ID fourni
    if (templateId) {
      const { error: updateError } = await supabase
        .from('indesign_templates')
        .update({
          storage_url: storageUrl,
          file_checksum: checksum
        })
        .eq('id', templateId);

      if (updateError) {
        console.warn('[TemplateUpload] DB update warning:', updateError.message);
      }
    }

    res.json({
      success: true,
      storage_url: storageUrl,
      file_checksum: checksum,
      filename
    });

  } catch (error) {
    console.error('[TemplateUpload] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/templates/upload-all
 * Upload tous les templates locaux vers Supabase Storage
 */
router.post('/upload-all', async (req, res, next) => {
  try {
    if (!isSupabaseConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Supabase not configured'
      });
    }

    // Récupérer tous les templates avec file_path
    const { data: templates, error: fetchError } = await supabase
      .from('indesign_templates')
      .select('id, name, filename, file_path, storage_url')
      .eq('is_active', true);

    if (fetchError) {
      throw new Error(`Failed to fetch templates: ${fetchError.message}`);
    }

    const results = {
      total: templates.length,
      uploaded: 0,
      skipped: 0,
      errors: []
    };

    for (const template of templates) {
      // Skip si déjà dans le cloud
      if (template.storage_url) {
        results.skipped++;
        console.log(`[TemplateUpload] Skipping ${template.name} (already uploaded)`);
        continue;
      }

      // Vérifier si le fichier local existe
      if (!template.file_path || !fs.existsSync(template.file_path)) {
        results.errors.push(`${template.name}: file not found at ${template.file_path}`);
        continue;
      }

      try {
        const fileBuffer = fs.readFileSync(template.file_path);
        const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex');
        const storagePath = `templates/${template.filename}`;

        // Upload
        const { error: uploadError } = await supabase.storage
          .from('templates')
          .upload(storagePath, fileBuffer, {
            contentType: 'application/octet-stream',
            upsert: true
          });

        if (uploadError) {
          results.errors.push(`${template.name}: ${uploadError.message}`);
          continue;
        }

        // URL
        const { data: urlData } = supabase.storage
          .from('templates')
          .getPublicUrl(storagePath);

        // Update DB
        await supabase
          .from('indesign_templates')
          .update({
            storage_url: urlData?.publicUrl,
            file_checksum: checksum
          })
          .eq('id', template.id);

        results.uploaded++;
        console.log(`[TemplateUpload] Uploaded: ${template.name}`);

      } catch (err) {
        results.errors.push(`${template.name}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('[TemplateUpload] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
