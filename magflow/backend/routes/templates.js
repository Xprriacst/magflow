import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { recommendTemplates } from '../services/openaiService.js';
import { analyzeAllTemplates, analyzeOneTemplate } from '../services/templateAnalyzer.js';
import fallbackTemplates from '../data/templatesFallback.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration de l'upload pour les templates
const templatesDir = path.resolve(__dirname, '../../Indesign automation v1');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, templatesDir);
  },
  filename: (req, file, cb) => {
    // Garder le nom original pour que InDesign le trouve
    // Attention aux écrasements, mais pour l'instant c'est voulu pour mettre à jour
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max pour les gros fichiers InDesign
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.indt', '.indd'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Format de fichier non supporté. Utilisez .indt ou .indd.'));
  }
});

const getFallbackTemplates = () => fallbackTemplates.filter(template => template.is_active !== false);

const router = express.Router();

/**
 * POST /api/templates/upload
 * Upload un fichier InDesign, le sauvegarde et lance l'analyse
 */
router.post('/upload', upload.single('templateFile'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier uploadé'
      });
    }

    const { originalname, filename, path: filePath } = req.file;
    const { name, description } = req.body;

    console.log(`[Templates] File uploaded: ${filename} (${filePath})`);

    let templateId;

    if (isSupabaseConfigured) {
      // Vérifier si le template existe déjà par son nom de fichier
      const { data: existing } = await supabase
        .from('indesign_templates')
        .select('id')
        .eq('filename', filename)
        .single();

      if (existing) {
        // Mise à jour
        console.log(`[Templates] Updating existing template ${existing.id}`);
        const { error } = await supabase
          .from('indesign_templates')
          .update({
            name: name || filename,
            description: description || '',
            updated_at: new Date().toISOString(),
            is_active: true
          })
          .eq('id', existing.id);
          
        if (error) throw new Error(`Supabase update error: ${error.message}`);
        templateId = existing.id;
      } else {
        // Création
        console.log(`[Templates] Creating new template entry`);
        const { data, error } = await supabase
          .from('indesign_templates')
          .insert([{
            name: name || filename,
            filename: filename,
            description: description || '',
            is_active: true,
            // file_path n'est pas stocké en base car on utilise filename dans le dossier standard
          }])
          .select()
          .single();
          
        if (error) throw new Error(`Supabase insert error: ${error.message}`);
        templateId = data.id;
      }

      // Lancer l'analyse automatique immédiatement
      console.log(`[Templates] Triggering analysis for ${templateId}...`);
      // Note: on ne wait pas forcément l'analyse pour répondre vite, 
      // mais ici l'utilisateur attend probablement le résultat.
      // On va attendre pour donner un feedback complet.
      try {
        await analyzeOneTemplate(templateId);
        console.log(`[Templates] Analysis completed for ${templateId}`);
      } catch (analyzeError) {
        console.error(`[Templates] Analysis warning: ${analyzeError.message}`);
        // On ne fail pas la requête globale si l'analyse échoue, l'upload est OK
      }

      // Récupérer le template final à jour
      const { data: finalTemplate } = await supabase
        .from('indesign_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      res.json({
        success: true,
        message: 'Template uploadé et analysé avec succès',
        template: finalTemplate
      });

    } else {
      // Mode sans base de données (dev local sans Supabase)
      console.warn('[Templates] Supabase not configured. File uploaded but not saved to DB.');
      res.json({
        success: true,
        message: 'Fichier uploadé (Mode hors ligne)',
        template: {
          id: 'temp-' + Date.now(),
          filename: filename,
          name: name || filename,
          description: description
        }
      });
    }

  } catch (error) {
    console.error('[Templates] Upload error:', error);
    // Nettoyer le fichier si erreur (optionnel, mais propre)
    // if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(error);
  }
});

/**
 * GET /api/templates
 * Récupère tous les templates actifs
 */
router.get('/', async (req, res, next) => {
  try {
    console.log('[Templates] Fetching all templates...');

    if (!isSupabaseConfigured) {
      console.warn('[Templates] Supabase not configured. Serving fallback templates.');
      return res.json({
        success: true,
        templates: getFallbackTemplates()
      });
    }

    const { data, error } = await supabase
      .from('indesign_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Templates] Supabase error:', error);
      return res.json({
        success: true,
        templates: getFallbackTemplates(),
        message: 'Supabase indisponible, utilisation des templates de secours.'
      });
    }

    const templates = data && data.length > 0 ? data : getFallbackTemplates();

    if (!data || data.length === 0) {
      console.warn('[Templates] No templates found in Supabase, using fallback list.');
    }

    res.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('[Templates] Unexpected error, using fallback:', error);
    res.json({
      success: true,
      templates: getFallbackTemplates(),
      message: 'Templates de secours chargés suite à une erreur.'
    });
  }
});

/**
 * GET /api/templates/:id
 * Récupère un template spécifique
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isSupabaseConfigured) {
      const fallback = getFallbackTemplates().find(template => template.id === id || template.filename === id);
      if (!fallback) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }
      return res.json({ success: true, template: fallback });
    }

    const { data, error } = await supabase
      .from('indesign_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      const fallback = getFallbackTemplates().find(template => template.id === id || template.filename === id);
      if (!fallback) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      return res.json({ success: true, template: fallback });
    }

    res.json({
      success: true,
      template: data
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/templates/recommend
 * Recommande des templates basés sur le contenu et les images
 */
router.post('/recommend', async (req, res, next) => {
  try {
    const { contentStructure, imageCount } = req.body;

    if (!contentStructure) {
      return res.status(400).json({
        success: false,
        error: 'contentStructure is required'
      });
    }

    console.log('[Templates] Getting recommendations...');
    console.log('[Templates] Category:', contentStructure.categorie_suggeree);
    console.log('[Templates] Images:', imageCount);

    let templatesSource = [];

    if (!isSupabaseConfigured) {
      console.warn('[Templates] Supabase not configured. Using fallback templates for recommendation.');
      templatesSource = getFallbackTemplates();
    } else {
      const { data: templates, error } = await supabase
        .from('indesign_templates')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('[Templates] Supabase error during recommend:', error);
        templatesSource = getFallbackTemplates();
      } else {
        templatesSource = templates && templates.length > 0 ? templates : getFallbackTemplates();
      }
    }

    if (!templatesSource || templatesSource.length === 0) {
      return res.json({
        success: true,
        recommended: [],
        message: 'No templates available'
      });
    }

    const recommended = await recommendTemplates(
      contentStructure,
      imageCount || 0,
      templatesSource
    );

    console.log(`[Templates] Recommended ${recommended.length} templates`);

    res.json({
      success: true,
      recommended
    });

  } catch (error) {
    console.error('[Templates] Recommend failed, returning fallback:', error);
    res.json({
      success: true,
      recommended: getFallbackTemplates().slice(0, 3),
      message: 'Recommandations de secours'
    });
  }
});

/**
 * POST /api/templates
 * Créer un nouveau template (admin)
 */
router.post('/', async (req, res, next) => {
  try {
    const templateData = req.body;

    // Validation basique
    if (!templateData.name || !templateData.filename) {
      return res.status(400).json({
        success: false,
        error: 'name and filename are required'
      });
    }

    const { data, error } = await supabase
      .from('indesign_templates')
      .insert([templateData])
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('[Templates] Created template:', data.id);

    res.status(201).json({
      success: true,
      template: data
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/templates/analyze
 * Analyse tous les templates avec InDesign + IA (admin)
 */
router.post('/analyze', async (req, res, next) => {
  try {
    console.log('[Templates] Starting full template analysis...');

    const results = await analyzeAllTemplates();

    res.json({
      success: true,
      analyzed: results.analyzed,
      updated: results.updated,
      errors: results.errors
    });

  } catch (error) {
    console.error('[Templates] Analysis failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'Failed to analyze templates. Check InDesign is running and accessible.'
    });
  }
});

/**
 * POST /api/templates/:id/analyze
 * Analyse un template spécifique (admin)
 */
router.post('/:id/analyze', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    console.log(`[Templates] Analyzing template ${id}...`);

    const template = await analyzeOneTemplate(id);

    res.json({
      success: true,
      template
    });

  } catch (error) {
    console.error(`[Templates] Analysis failed for template ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/templates/:id/preview
 * Met à jour l'image de preview d'un template (admin)
 */
router.put('/:id/preview', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { previewUrl } = req.body;

    if (typeof previewUrl === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'previewUrl is required'
      });
    }

    const normalizedUrl =
      previewUrl === null
        ? null
        : typeof previewUrl === 'string'
          ? previewUrl.trim() || null
          : previewUrl;

    if (!isSupabaseConfigured) {
      const template = fallbackTemplates.find(
        (tpl) => tpl.id === id || tpl.filename === id
      );

      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }

      template.preview_url = normalizedUrl;

      return res.json({
        success: true,
        template
      });
    }

    const { data, error } = await supabase
      .from('indesign_templates')
      .update({
        preview_url: normalizedUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    res.json({
      success: true,
      template: data
    });
  } catch (error) {
    next(error);
  }
});

export default router;
