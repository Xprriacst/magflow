/**
 * MagFlow Template Sync Service
 * Synchronise les templates InDesign depuis Supabase Storage vers le cache local
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const Store = require('electron-store');

const store = new Store();

// Configuration
const TEMPLATES_CACHE_DIR = path.join(
  process.env.APPDATA || process.env.HOME,
  '.magflow',
  'templates'
);

/**
 * Initialise le dossier de cache des templates
 */
function ensureCacheDir() {
  if (!fs.existsSync(TEMPLATES_CACHE_DIR)) {
    fs.mkdirSync(TEMPLATES_CACHE_DIR, { recursive: true });
    console.log('[TemplateSync] Cache directory created:', TEMPLATES_CACHE_DIR);
  }
  return TEMPLATES_CACHE_DIR;
}

/**
 * Calcule le checksum MD5 d'un fichier
 */
function getFileChecksum(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Récupère la liste des templates depuis le backend
 */
async function fetchTemplatesList(backendUrl) {
  try {
    const response = await axios.get(`${backendUrl}/api/templates`);
    if (response.data.success) {
      return response.data.templates;
    }
    throw new Error('Failed to fetch templates');
  } catch (error) {
    console.error('[TemplateSync] Error fetching templates:', error.message);
    throw error;
  }
}

/**
 * Télécharge un template depuis Supabase Storage
 */
async function downloadTemplate(template, targetPath) {
  if (!template.storage_url) {
    console.warn(`[TemplateSync] Template ${template.name} has no storage_url, skipping`);
    return false;
  }

  try {
    console.log(`[TemplateSync] Downloading: ${template.name}...`);
    
    const response = await axios.get(template.storage_url, {
      responseType: 'arraybuffer',
      timeout: 60000 // 60s timeout pour gros fichiers
    });
    
    fs.writeFileSync(targetPath, response.data);
    
    // Vérifier le checksum si disponible
    if (template.file_checksum) {
      const localChecksum = getFileChecksum(targetPath);
      if (localChecksum !== template.file_checksum) {
        console.warn(`[TemplateSync] Checksum mismatch for ${template.name}`);
        // On garde quand même le fichier, mais on log l'avertissement
      }
    }
    
    console.log(`[TemplateSync] Downloaded: ${template.name} -> ${targetPath}`);
    return true;
  } catch (error) {
    console.error(`[TemplateSync] Failed to download ${template.name}:`, error.message);
    return false;
  }
}

/**
 * Synchronise tous les templates
 * @param {string} backendUrl - URL du backend MagFlow
 * @param {function} progressCallback - Callback pour le progress (optional)
 * @returns {object} - Résultat de la synchronisation
 */
async function syncTemplates(backendUrl, progressCallback = null) {
  const cacheDir = ensureCacheDir();
  const results = {
    total: 0,
    downloaded: 0,
    skipped: 0,
    errors: [],
    templates: []
  };

  try {
    // 1. Récupérer la liste des templates
    const templates = await fetchTemplatesList(backendUrl);
    results.total = templates.length;

    if (progressCallback) progressCallback({ phase: 'fetched', total: templates.length });

    // 2. Récupérer les versions locales
    const localVersions = store.get('templateVersions') || {};

    // 3. Synchroniser chaque template
    for (let i = 0; i < templates.length; i++) {
      const template = templates[i];
      const localPath = path.join(cacheDir, template.filename);
      const localVersion = localVersions[template.id];

      // Vérifier si mise à jour nécessaire
      const needsUpdate = 
        !fs.existsSync(localPath) || 
        !localVersion ||
        localVersion < (template.version || 1);

      if (needsUpdate && template.storage_url) {
        const success = await downloadTemplate(template, localPath);
        if (success) {
          results.downloaded++;
          localVersions[template.id] = template.version || 1;
        } else {
          results.errors.push(`Failed to download: ${template.name}`);
        }
      } else {
        results.skipped++;
      }

      // Ajouter le chemin local au template
      results.templates.push({
        ...template,
        local_path: fs.existsSync(localPath) ? localPath : null
      });

      if (progressCallback) {
        progressCallback({ 
          phase: 'syncing', 
          current: i + 1, 
          total: templates.length,
          template: template.name
        });
      }
    }

    // 4. Sauvegarder les versions locales
    store.set('templateVersions', localVersions);

    console.log(`[TemplateSync] Sync complete: ${results.downloaded} downloaded, ${results.skipped} skipped`);
    
    return results;

  } catch (error) {
    console.error('[TemplateSync] Sync failed:', error);
    results.errors.push(error.message);
    return results;
  }
}

/**
 * Obtient le chemin local d'un template
 */
function getLocalTemplatePath(templateId) {
  const templates = store.get('cachedTemplates') || [];
  const template = templates.find(t => t.id === templateId);
  if (template) {
    const localPath = path.join(TEMPLATES_CACHE_DIR, template.filename);
    if (fs.existsSync(localPath)) {
      return localPath;
    }
  }
  return null;
}

/**
 * Vérifie si un template est disponible localement
 */
function isTemplateAvailable(templateId) {
  return getLocalTemplatePath(templateId) !== null;
}

/**
 * Liste les templates disponibles localement
 */
function getLocalTemplates() {
  ensureCacheDir();
  const files = fs.readdirSync(TEMPLATES_CACHE_DIR);
  return files.filter(f => f.endsWith('.indt') || f.endsWith('.indd'));
}

/**
 * Nettoie le cache des templates
 */
function clearCache() {
  if (fs.existsSync(TEMPLATES_CACHE_DIR)) {
    const files = fs.readdirSync(TEMPLATES_CACHE_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(TEMPLATES_CACHE_DIR, file));
    }
    console.log('[TemplateSync] Cache cleared');
  }
  store.delete('templateVersions');
}

module.exports = {
  syncTemplates,
  getLocalTemplatePath,
  isTemplateAvailable,
  getLocalTemplates,
  clearCache,
  ensureCacheDir,
  TEMPLATES_CACHE_DIR
};
