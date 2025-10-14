import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5003';
const FLASK_API_TOKEN = process.env.FLASK_API_TOKEN;

/**
 * Formate le contenu structuré en texte lisible pour InDesign
 */
function formatContentForInDesign(contentStructure) {
  const parts = [];
  
  // Ajouter les sections dans l'ordre
  if (contentStructure.sections && Array.isArray(contentStructure.sections)) {
    contentStructure.sections.forEach(section => {
      if (section.titre) {
        parts.push(section.titre);
      }
      if (section.contenu) {
        parts.push(section.contenu);
      }
    });
  }
  
  // Fallback: si pas de sections, construire depuis les champs disponibles
  if (parts.length === 0) {
    if (contentStructure.chapo) parts.push(contentStructure.chapo);
    if (contentStructure.contenu_principal) parts.push(contentStructure.contenu_principal);
    if (contentStructure.conclusion) parts.push(contentStructure.conclusion);
  }
  
  return parts.join('\n\n');
}

/**
 * Génère un magazine via l'API Flask
 * @param {Object} params - Paramètres de génération
 * @returns {Promise<Object>} Résultat de la génération
 */
export async function generateMagazine({
  titre,
  contentStructure,
  subtitle,
  template,
  imageUrls
}) {
  try {
    // Formatter le contenu en texte lisible
    const textContent = formatContentForInDesign(contentStructure);
    
    // Préparer les données form-urlencoded
    const params = new URLSearchParams({
      prompt: titre,
      text_content: textContent,
      subtitle: subtitle || contentStructure.chapo,
      template: template.filename,
      image_urls: imageUrls.join(','),
      rectangle_index: '0'
    });

    // Headers
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    // Ajouter token si configuré
    if (FLASK_API_TOKEN) {
      headers['Authorization'] = `Bearer ${FLASK_API_TOKEN}`;
    }

    console.log(`[Flask] Calling ${FLASK_API_URL}/api/create-layout-urls`);
    console.log('[Flask] Template:', template.filename);
    console.log('[Flask] Images:', imageUrls.length);

    // Appel Flask
    const response = await axios.post(
      `${FLASK_API_URL}/api/create-layout-urls`,
      params.toString(),
      {
        headers,
        timeout: 300000 // 5 minutes
      }
    );

    console.log('[Flask] Response:', response.data);

    if (response.data.success) {
      return {
        success: true,
        projectId: response.data.project_id,
        outputFile: response.data.output_file,
        downloadUrl: `${FLASK_API_URL}/api/download/${response.data.project_id}`
      };
    } else {
      throw new Error(response.data.error || 'Flask generation failed');
    }

  } catch (error) {
    console.error('[Flask] Error:', error.message);
    
    if (error.response) {
      console.error('[Flask] Response error:', error.response.data);
      throw new Error(`Flask API Error: ${error.response.data.error || error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Flask API not responding. Is it running on port 5003?');
    } else {
      throw new Error(`Flask Service Error: ${error.message}`);
    }
  }
}

/**
 * Vérifie le statut de l'API Flask
 * @returns {Promise<boolean>} true si l'API est accessible
 */
export async function checkFlaskHealth() {
  try {
    const response = await axios.get(`${FLASK_API_URL}/api/status`, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.error('[Flask] Health check failed:', error.message);
    return false;
  }
}

/**
 * Télécharge un fichier généré depuis Flask
 * @param {string} projectId - ID du projet
 * @returns {Promise<Stream>} Stream du fichier
 */
export async function downloadFromFlask(projectId) {
  try {
    const response = await axios.get(
      `${FLASK_API_URL}/api/download/${projectId}`,
      {
        responseType: 'stream',
        timeout: 60000
      }
    );
    return response.data;
  } catch (error) {
    console.error('[Flask] Download error:', error.message);
    throw new Error(`Download failed: ${error.message}`);
  }
}

export default { generateMagazine, checkFlaskHealth, downloadFromFlask };
