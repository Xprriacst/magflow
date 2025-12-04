import express from 'express';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js';
import { generateMagazine } from '../services/flaskService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const PLACEHOLDER_IMAGE = process.env.MAGFLOW_PLACEHOLDER_IMAGE_URL ||
  'https://images.unsplash.com/photo-1526481280695-3c469f99d62a?auto=format&fit=crop&w=1200&q=80';

/**
 * POST /api/magazine/generate
 * Génère un magazine complet
 */
router.post('/generate', async (req, res, next) => {
  try {
    const { content, contentStructure, template, template_id, titre, chapo, images } = req.body;
    const imageSources = Array.isArray(images) ? images.filter(Boolean) : [];

    // ✅ SPRINT 1.2: Support template_id OU template object (rétrocompatibilité)
    let templateData = template;
    if (template_id && !template && isSupabaseConfigured && supabase) {
      // Si template_id fourni mais pas template, le récupérer
      const { data: fetchedTemplate } = await supabase
        .from('indesign_templates')
        .select('*')
        .eq('id', template_id)
        .single();
      templateData = fetchedTemplate;
    }

    // Validation
    if (!contentStructure || (!template && !template_id)) {
      return res.status(400).json({
        success: false,
        error: 'contentStructure and (template or template_id) are required'
      });
    }

    const resolvedImages = imageSources.length > 0 ? imageSources : [PLACEHOLDER_IMAGE];

    // ✅ SPRINT 1.2: Utiliser titre/chapo directs ou fallback sur contentStructure
    const finalTitre = titre || contentStructure?.titre_principal || 'Sans titre';
    const finalChapo = chapo || contentStructure?.chapo || '';

    console.log('[Magazine] Starting generation...');
    console.log('[Magazine] Template:', templateData?.name || template_id);
    console.log('[Magazine] Titre:', finalTitre.substring(0, 50));
    console.log('[Magazine] Images:', resolvedImages.length);

    // Créer un enregistrement dans la base de données
    const generationId = uuidv4();
    let dbError = null;

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('magazine_generations')
        .insert([{
          id: generationId,
          content_structure: contentStructure,
          template_id: templateData?.id || template_id, // ✅ Support des deux
          image_urls: resolvedImages,
          status: 'processing',
          created_at: new Date().toISOString()
        }]);

      if (error) {
        dbError = error;
        console.error('[Magazine] Database error:', error);
      }
    } else {
      console.warn('[Magazine] Supabase not configured. Skipping generation logging.');
    }

    // Appeler Flask pour génération InDesign
    // ✅ SPRINT 1.2: Utiliser les vraies données
    const result = await generateMagazine({
      titre: finalTitre,
      contentStructure,
      subtitle: finalChapo,
      template: templateData,
      template_id: template_id || templateData?.id,
      imageUrls: resolvedImages
    });

    // Mettre à jour le statut
    if (isSupabaseConfigured && !dbError) {
      await supabase
        .from('magazine_generations')
        .update({
          status: 'completed',
          flask_project_id: result.projectId,
          completed_at: new Date().toISOString()
        })
        .eq('id', generationId);
    }

    console.log('[Magazine] Generation completed:', result.projectId);

    res.json({
      success: true,
      generationId,
      projectId: result.projectId,
      downloadUrl: result.downloadUrl
    });

  } catch (error) {
    // Mettre à jour le statut en erreur si possible
    if (isSupabaseConfigured && req.body.generationId) {
      await supabase
        .from('magazine_generations')
        .update({
          status: 'error',
          error_message: error.message
        })
        .eq('id', req.body.generationId);
    }

    next(error);
  }
});

/**
 * GET /api/magazine/status/:generationId
 * Récupère le statut d'une génération
 */
router.get('/status/:generationId', async (req, res, next) => {
  try {
    const { generationId } = req.params;

    if (!isSupabaseConfigured) {
      return res.json({
        success: true,
        status: 'completed',
        projectId: null,
        downloadUrl: null,
        createdAt: null,
        completedAt: null,
        warning: 'Statut approximatif (Supabase non configuré).'
      });
    }

    const { data, error } = await supabase
      .from('magazine_generations')
      .select('*')
      .eq('id', generationId)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Generation not found'
      });
    }

    res.json({
      success: true,
      status: data.status,
      projectId: data.flask_project_id,
      downloadUrl: data.flask_project_id 
        ? `${process.env.FLASK_API_URL}/api/download/${data.flask_project_id}`
        : null,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      error: data.error_message
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/magazine/history
 * Récupère l'historique des générations
 */
router.get('/history', async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    if (!isSupabaseConfigured) {
      return res.json({
        success: true,
        generations: [],
        total: 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        warning: 'Historique indisponible (Supabase non configuré).'
      });
    }

    const { data, error, count } = await supabase
      .from('magazine_generations')
      .select('*, template:indesign_templates(name, filename)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    res.json({
      success: true,
      generations: data || [],
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    next(error);
  }
});

export default router;
