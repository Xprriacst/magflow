import { contentAPI } from './api';

/**
 * Service for analyzing content and providing AI-powered suggestions
 * Now uses backend API instead of direct OpenAI calls
 */

/**
 * Analyze content structure using backend API (GPT-4o)
 * @param {string} content - The text content to analyze
 * @returns {Promise<Object>} Structured analysis results
 */
export async function analyzeContentStructure(content) {
  try {
    // Call backend API instead of OpenAI directly
    const structure = await contentAPI.analyze(content);
    return structure;
  } catch (error) {
    console.error('Error analyzing content structure:', error);
    throw error;
  }
}

/**
 * Get template recommendations based on content analysis
 * @param {Object} structureData - The analyzed content structure
 * @param {number} imageCount - Number of images available
 * @returns {Promise<Array>} Array of recommended templates
 */
export async function getTemplateRecommendations(structureData, imageCount = 0) {
  try {
    // Import templatesAPI at function level to avoid circular dependencies
    const { templatesAPI } = await import('./api');
    
    // Call backend API for recommendations
    const recommendedTemplates = await templatesAPI.recommend(structureData, imageCount);
    
    return recommendedTemplates;
  } catch (error) {
    console.error('Error getting template recommendations:', error);
    throw error;
  }
}

/**
 * Analyze images and provide context for template selection
 * @param {Array} images - Array of image files or URLs
 * @returns {Promise<Object>} Image analysis results
 */
export async function analyzeImages(images) {
  try {
    if (!images || images?.length === 0) {
      return { imageTypes: [], dominantColors: [], recommendedLayout: 'text-focused' };
    }

    // For now, return basic analysis based on image count
    // In a full implementation, you would analyze actual image content
    const imageCount = images?.length;
    let recommendedLayout = 'text-focused';
    
    if (imageCount === 1) {
      recommendedLayout = 'hero-image';
    } else if (imageCount <= 3) {
      recommendedLayout = 'mixed-content';
    } else {
      recommendedLayout = 'gallery-style';
    }

    return {
      imageCount,
      imageTypes: images?.map(() => 'photo'), // Placeholder
      dominantColors: ['#333333', '#ffffff'], // Placeholder
      recommendedLayout
    };
  } catch (error) {
    console.error('Error analyzing images:', error);
    throw error;
  }
}

/**
 * Generate optimized content based on analysis
 * TODO: Router cette fonction vers le backend quand nécessaire
 * @param {string} originalContent - Original content text
 * @param {Object} structure - Analyzed structure
 * @returns {Promise<Object>} Optimized content structure
 */
export async function generateOptimizedContent(originalContent, structure) {
  // Fonction désactivée temporairement - à router vers backend si nécessaire
  console.warn('generateOptimizedContent: Feature not yet implemented via backend');
  
  return {
    optimizedContent: originalContent, // Retourne le contenu original pour l'instant
    appliedStructure: structure,
    improvements: [
      'Structure éditoriale analysée',
      'Prêt pour génération'
    ]
  };
}