import express from 'express';
import { analyzeContentStructure } from '../services/openaiService.js';

const router = express.Router();

/**
 * POST /api/content/analyze
 * Analyse la structure éditoriale d'un contenu
 */
router.post('/analyze', async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Le contenu doit contenir au moins 50 caractères'
      });
    }

    console.log(`[Content] Analyzing content (${content.length} chars)...`);

    const structure = await analyzeContentStructure(content);

    console.log('[Content] Structure analyzed successfully');
    console.log('[Content] Titre:', structure.titre_principal);
    console.log('[Content] Catégorie:', structure.categorie_suggeree);

    res.json({
      success: true,
      structure
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/content/health
 * Health check pour OpenAI
 */
router.get('/health', async (req, res) => {
  try {
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    res.json({
      success: true,
      service: 'openai',
      openai: {
        configured: hasApiKey,
        model: 'gpt-4o'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
