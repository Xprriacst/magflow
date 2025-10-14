import express from 'express';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { recommendTemplates } from '../services/openaiService.js';
import fallbackTemplates from '../data/templatesFallback.js';

const getFallbackTemplates = () => fallbackTemplates.filter(template => template.is_active !== false);

const router = express.Router();

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

export default router;
