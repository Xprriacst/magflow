import express from 'express';
import { supabase, supabaseAdmin, isSupabaseConfigured } from '../services/supabaseClient.js';
import { generateMagazine } from '../services/flaskService.js';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, checkUsageLimit, logUserAction } from '../middleware/auth.js';
import { defaultLimiter, generationLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Apply default rate limiting to all routes
router.use(defaultLimiter);

const PLACEHOLDER_IMAGE = process.env.MAGFLOW_PLACEHOLDER_IMAGE_URL ||
  'https://images.unsplash.com/photo-1526481280695-3c469f99d62a?auto=format&fit=crop&w=1200&q=80';

/**
 * POST /api/magazine/generate
 * Génère un magazine complet
 * Protected route - requires authentication and checks usage limits
 */
router.post('/generate', verifyToken, checkUsageLimit, generationLimiter, async (req, res, next) => {
  try {
    const { content, contentStructure, template, template_id, titre, chapo, images } = req.body;
    const userId = req.user.id;
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

    if (isSupabaseConfigured && supabaseAdmin) {
      // Use admin client to bypass RLS for server-side operations
      const { error } = await supabaseAdmin
        .from('magazine_generations')
        .insert([{
          id: generationId,
          user_id: userId, // Track which user created this generation
          content_structure: contentStructure,
          template_id: templateData?.id || template_id,
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

    // Vérifier si un agent est connecté
    const io = req.app.get('io');
    const connectedAgents = req.app.get('connectedAgents');
    const hasConnectedAgent = connectedAgents && connectedAgents.size > 0;
    
    let result;
    
    if (hasConnectedAgent) {
      // ✅ Envoyer le job à l'agent via WebSocket
      console.log('[Magazine] Agent connecté - envoi du job via WebSocket');
      
      const job = {
        id: generationId,
        template_id: template_id || templateData?.id,
        template_name: templateData?.name || 'Template',
        template_path: templateData?.file_path,
        titre: finalTitre,
        chapo: finalChapo,
        images: resolvedImages,
        contentStructure
      };
      
      // Envoyer à tous les agents connectés (pour l'instant)
      io.emit('job:new', job);
      
      // Répondre immédiatement (le job est en cours)
      result = {
        projectId: generationId,
        status: 'processing',
        message: 'Job envoyé à l\'agent local'
      };
    } else {
      // Fallback: appeler Flask
      console.log('[Magazine] Pas d\'agent connecté - utilisation Flask');
      result = await generateMagazine({
        titre: finalTitre,
        contentStructure,
        subtitle: finalChapo,
        template: templateData,
        template_id: template_id || templateData?.id,
        imageUrls: resolvedImages
      });
    }

    // Mettre à jour le statut
    if (isSupabaseConfigured && supabaseAdmin && !dbError) {
      await supabaseAdmin
        .from('magazine_generations')
        .update({
          status: 'completed',
          flask_project_id: result.projectId,
          completed_at: new Date().toISOString()
        })
        .eq('id', generationId);

      // Increment user's monthly generation count
      await supabaseAdmin
        .from('profiles')
        .update({
          monthly_generations_used: req.userProfile.monthly_generations_used + 1
        })
        .eq('id', userId);

      // Log the generation action
      await logUserAction(userId, 'generation', {
        generation_id: generationId,
        template_id: templateData?.id || template_id,
        template_name: templateData?.name
      }, req);
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
    if (isSupabaseConfigured && supabaseAdmin && req.body.generationId) {
      await supabaseAdmin
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
 * Protected route - users can only see their own generations
 */
router.get('/status/:generationId', verifyToken, async (req, res, next) => {
  try {
    const { generationId } = req.params;
    const userId = req.user.id;

    if (!isSupabaseConfigured || !supabaseAdmin) {
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

    // Query with user filter (users can only see their own generations)
    let query = supabaseAdmin
      .from('magazine_generations')
      .select('*')
      .eq('id', generationId);

    // Non-admins can only see their own generations
    if (req.userProfile?.role !== 'admin') {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

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
 * Protected route - users can only see their own history
 */
router.get('/history', verifyToken, async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user.id;

    if (!isSupabaseConfigured || !supabaseAdmin) {
      return res.json({
        success: true,
        generations: [],
        total: 0,
        limit: parseInt(limit),
        offset: parseInt(offset),
        warning: 'Historique indisponible (Supabase non configuré).'
      });
    }

    // Build query - admins see all, users see only their own
    let query = supabaseAdmin
      .from('magazine_generations')
      .select('*, template:indesign_templates(name, filename)', { count: 'exact' });

    if (req.userProfile?.role !== 'admin') {
      query = query.eq('user_id', userId);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

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
