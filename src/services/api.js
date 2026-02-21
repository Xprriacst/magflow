/**
 * Service API centralisé pour MagFlow
 * Communication avec le backend Node.js
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Récupère le token d'authentification depuis localStorage
 */
function getAuthToken() {
  return localStorage.getItem('magflow_token');
}

/**
 * Wrapper fetch avec gestion d'erreurs et token automatique
 */
async function apiCall(endpoint, options = {}, requiresAuth = false) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Ajouter le token si authentification requise ou si token présent
    const token = getAuthToken();
    if (token && (requiresAuth || !options.skipAuth)) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Si 401, le token est invalide - nettoyer localStorage
      if (response.status === 401) {
        localStorage.removeItem('magflow_token');
        localStorage.removeItem('magflow_user');
      }
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
   * REQUIERT AUTHENTIFICATION - vérifie les crédits utilisateur
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

    // ✅ Appel authentifié (requiresAuth = true)
    const data = await apiCall('/api/magazine/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true);
    return {
      generationId: data.generationId,
      projectId: data.projectId,
      downloadUrl: data.downloadUrl,
    };
  },

  /**
   * Récupère le statut d'une génération
   * REQUIERT AUTHENTIFICATION
   * @param {string} generationId - ID de la génération
   * @returns {Promise<Object>} Statut
   */
  async getStatus(generationId) {
    const data = await apiCall(`/api/magazine/status/${generationId}`, {}, true);
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
   * REQUIERT AUTHENTIFICATION
   * @param {number} limit - Nombre de résultats
   * @param {number} offset - Offset pour pagination
   * @returns {Promise<Object>} Historique
   */
  async getHistory(limit = 20, offset = 0) {
    const data = await apiCall(`/api/magazine/history?limit=${limit}&offset=${offset}`, {}, true);
    return {
      generations: data.generations,
      total: data.total,
      limit: data.limit,
      offset: data.offset,
    };
  },
};

/**
 * Authentication
 */
export const authAPI = {
  /**
   * Enregistre un nouvel utilisateur
   */
  async register(email, password, fullName, companyName) {
    return await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, companyName }),
    });
  },

  /**
   * Connecte un utilisateur
   */
  async login(email, password) {
    return await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Déconnecte l'utilisateur
   */
  async logout() {
    return await apiCall('/api/auth/logout', {
      method: 'POST',
    }, true);
  },

  /**
   * Récupère le profil de l'utilisateur connecté (avec crédits)
   * REQUIERT AUTHENTIFICATION
   */
  async getProfile() {
    return await apiCall('/api/auth/me', {}, true);
  },

  /**
   * Met à jour le profil utilisateur
   * REQUIERT AUTHENTIFICATION
   */
  async updateProfile(data) {
    return await apiCall('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  },

  /**
   * Réinitialise le mot de passe
   */
  async resetPassword(email) {
    return await apiCall('/api/auth/password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Met à jour le mot de passe
   * REQUIERT AUTHENTIFICATION
   */
  async updatePassword(newPassword) {
    return await apiCall('/api/auth/password-update', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }, true);
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
 * Stripe / Payments
 */
export const stripeAPI = {
  /**
   * Récupère les packages de crédits disponibles
   */
  async getPackages() {
    return await apiCall('/api/stripe/packages');
  },

  /**
   * Crée une session de checkout Stripe
   * REQUIERT AUTHENTIFICATION
   * @param {string} packageId - ID du package de crédits
   */
  async createCheckoutSession(packageId) {
    return await apiCall('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    }, true);
  },

  /**
   * Vérifie le statut d'une session de paiement
   * REQUIERT AUTHENTIFICATION
   * @param {string} sessionId - ID de la session Stripe
   */
  async verifySession(sessionId) {
    return await apiCall(`/api/stripe/verify-session/${sessionId}`, {}, true);
  },
};

/**
 * Méthode générique pour POST
 */
export async function post(endpoint, data = {}, options = {}) {
  return await apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * Export par défaut avec toutes les API
 */
export default {
  content: contentAPI,
  templates: templatesAPI,
  magazine: magazineAPI,
  auth: authAPI,
  health: healthAPI,
  stripe: stripeAPI,
  post,
};
