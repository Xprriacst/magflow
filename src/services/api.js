/**
 * Service API centralisé pour MagFlow
 * Communication avec le backend Node.js
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Wrapper fetch avec gestion d'erreurs
 */
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    throw error;
  }
}

/**
 * Content Analysis
 */
export const contentAPI = {
  /**
   * Analyse la structure éditoriale d'un contenu
   * @param {string} content - Texte à analyser
   * @returns {Promise<Object>} Structure éditoriale
   */
  async analyze(content) {
    const data = await apiCall('/api/content/analyze', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return data.structure;
  },

  /**
   * Vérifie la santé du service OpenAI
   */
  async checkHealth() {
    return await apiCall('/api/content/health');
  },
};

/**
 * Templates Management
 */
export const templatesAPI = {
  /**
   * Récupère tous les templates actifs
   * @returns {Promise<Array>} Liste des templates
   */
  async getAll() {
    const data = await apiCall('/api/templates');
    return data.templates;
  },

  /**
   * Récupère un template spécifique
   * @param {string} id - ID du template
   * @returns {Promise<Object>} Template
   */
  async getById(id) {
    const data = await apiCall(`/api/templates/${id}`);
    return data.template;
  },

  /**
   * Recommande des templates basés sur le contenu
   * @param {Object} contentStructure - Structure analysée
   * @param {number} imageCount - Nombre d'images
   * @returns {Promise<Array>} Templates recommandés avec score
   */
  async recommend(contentStructure, imageCount = 0) {
    const data = await apiCall('/api/templates/recommend', {
      method: 'POST',
      body: JSON.stringify({ contentStructure, imageCount }),
    });
    return data.recommended;
  },

  /**
   * Crée un nouveau template (admin)
   * @param {Object} templateData - Données du template
   * @returns {Promise<Object>} Template créé
   */
  async create(templateData) {
    const data = await apiCall('/api/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
    return data.template;
  },

  /**
   * Met à jour l'image de preview d'un template (admin)
   * @param {string} templateId - ID du template
   * @param {string|null} previewUrl - Nouvelle URL ou null pour retirer l'image
   * @returns {Promise<Object>} Template mis à jour
   */
  async updatePreview(templateId, previewUrl) {
    const data = await apiCall(`/api/templates/${templateId}/preview`, {
      method: 'PUT',
      body: JSON.stringify({ previewUrl }),
    });
    return data.template;
  },

  /**
   * Analyse tous les templates avec InDesign + IA
   * @returns {Promise<Object>} Résultat de l'analyse
   */
  async analyzeAll() {
    const data = await apiCall('/api/templates/analyze', {
      method: 'POST',
    });
    return {
      analyzed: data.analyzed,
      updated: data.updated,
      errors: data.errors || []
    };
  },

  /**
   * Analyse un template spécifique
   * @param {string} templateId - ID du template
   * @returns {Promise<Object>} Template mis à jour
   */
  async analyzeOne(templateId) {
    const data = await apiCall(`/api/templates/${templateId}/analyze`, {
      method: 'POST',
    });
    return data.template;
  },
};

/**
 * Magazine Generation
 */
export const magazineAPI = {
  /**
   * Génère un magazine complet
   * @param {Object} params - Paramètres de génération
   * @param {string} params.content - Contenu original
   * @param {Object} params.contentStructure - Structure analysée
   * @param {Object} params.template - Template sélectionné
   * @param {Array<string>} params.images - URLs des images
   * @returns {Promise<Object>} Résultat de génération
   */
  async generate({ content, contentStructure, template, images }) {
    // ✅ SPRINT 1.2: Envoyer template_id et vraies données
    const payload = {
      content,
      contentStructure,
      template_id: template?.id || template?.template_id, // ✅ ID au lieu de tout l'objet
      titre: contentStructure?.titre_principal || '', // ✅ Vraies données
      chapo: contentStructure?.chapo || '', // ✅ Vraies données
      images,
    };
    
    console.log('[API] Génération magazine:', {
      template_id: payload.template_id,
      titre: payload.titre?.substring(0, 50),
      chapo: payload.chapo?.substring(0, 50)
    });
    
    const data = await apiCall('/api/magazine/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return {
      generationId: data.generationId,
      projectId: data.projectId,
      downloadUrl: data.downloadUrl,
    };
  },

  /**
   * Récupère le statut d'une génération
   * @param {string} generationId - ID de la génération
   * @returns {Promise<Object>} Statut
   */
  async getStatus(generationId) {
    const data = await apiCall(`/api/magazine/status/${generationId}`);
    return {
      status: data.status,
      projectId: data.projectId,
      downloadUrl: data.downloadUrl,
      createdAt: data.createdAt,
      completedAt: data.completedAt,
      error: data.error,
    };
  },

  /**
   * Récupère l'historique des générations
   * @param {number} limit - Nombre de résultats
   * @param {number} offset - Offset pour pagination
   * @returns {Promise<Object>} Historique
   */
  async getHistory(limit = 20, offset = 0) {
    const data = await apiCall(`/api/magazine/history?limit=${limit}&offset=${offset}`);
    return {
      generations: data.generations,
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    };
  },
};

/**
 * Health Check
 */
export const healthAPI = {
  /**
   * Vérifie la santé du backend
   */
  async check() {
    return await apiCall('/health');
  },
};

/**
 * Export par défaut avec toutes les API
 */
export default {
  content: contentAPI,
  templates: templatesAPI,
  magazine: magazineAPI,
  health: healthAPI,
};
