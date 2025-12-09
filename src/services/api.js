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

  /**
   * Upload et traite un nouveau template (workflow complet)
   * Upload → Analyse InDesign → Miniature → Enrichissement IA → Création BDD
   * @param {File} file - Fichier .indt ou .indd
   * @param {string} name - Nom du template (optionnel)
   * @param {Function} onProgress - Callback de progression (optionnel)
   * @returns {Promise<Object>} Template créé avec toutes ses métadonnées
   */
  async uploadAndProcess(file, name = null, onProgress = null) {
    const formData = new FormData();
    formData.append('template', file);
    if (name) {
      formData.append('name', name);
    }

    if (onProgress) {
      onProgress({ step: 'uploading', message: 'Upload du template...' });
    }

    try {
      // Créer un AbortController avec timeout de 10 minutes (600 secondes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000);

      const response = await fetch(`${API_BASE_URL}/api/templates/upload-and-process`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Note: Ne pas définir Content-Type, le navigateur le fait automatiquement avec FormData
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (onProgress) {
        onProgress({ step: 'complete', message: 'Template traité avec succès' });
      }

      return {
        template: data.template,
        warnings: data.warnings || []
      };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Le traitement du template a pris trop de temps (>10 minutes). Veuillez réessayer ou contacter le support.');
      }
      console.error('[API] Upload and process error:', error);
      throw error;
    }
  },

  /**
   * Re-analyse un template existant (mise à jour métadonnées + miniature)
   * @param {string} templateId - ID du template
   * @returns {Promise<Object>} Template mis à jour
   */
  async reanalyze(templateId) {
    // Créer un AbortController avec timeout de 10 minutes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}/reanalyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data.template;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Le traitement a pris trop de temps (>10 minutes). Veuillez réessayer.');
      }
      console.error(`[API] Reanalyze error:`, error.message);
      throw error;
    }
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
