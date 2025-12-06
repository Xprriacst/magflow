import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, supabaseAdmin } from './supabaseClient.js';
import { enrichTemplateMetadata } from './openaiService.js';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_PATH = path.resolve(__dirname, '../../Indesign automation v1');
const SCRIPT_PATH = path.join(BASE_PATH, 'scripts', 'analyze_templates.jsx');
const ANALYSIS_DIR = path.join(BASE_PATH, 'analysis');

/**
 * Prépare le dossier d'analyse
 */
async function ensureAnalysisDir() {
  try {
    await fs.mkdir(ANALYSIS_DIR, { recursive: true });
  } catch (error) {
    console.error('[TemplateAnalyzer] Error creating analysis dir:', error);
  }
}

/**
 * Récupère tous les templates depuis Supabase
 */
async function getTemplatesFromDatabase() {
  try {
    const { data, error } = await supabase
      .from('indesign_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('[TemplateAnalyzer] Error fetching templates:', error);
    throw error;
  }
}

/**
 * Crée le fichier de configuration pour le script JSX
 */
async function createAnalysisConfig(templates) {
  const configPath = path.join(ANALYSIS_DIR, 'config.json');
  const outputPath = path.join(ANALYSIS_DIR, 'results.json');

  const config = {
    templates: templates.map(t => ({
      id: t.id,
      filename: t.filename,
      file_path: t.file_path
    })),
    output_path: outputPath
  };

  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  
  return { configPath, outputPath };
}

/**
 * Exécute le script InDesign via osascript
 */
async function executeInDesignScript(configPath) {
  const indesignApp = process.env.INDESIGN_APP_NAME || 'Adobe InDesign 2025';
  
  // Créer un script AppleScript temporaire
  const applescript = `
tell application "${indesignApp}"
    activate
    do script (file POSIX file "${SCRIPT_PATH}") language javascript
end tell
`;

  const tempScriptPath = path.join(ANALYSIS_DIR, 'temp_analyze.applescript');
  await fs.writeFile(tempScriptPath, applescript, 'utf-8');

  try {
    // Définir la variable d'environnement pour le script JSX
    const env = {
      ...process.env,
      TEMPLATE_ANALYSIS_CONFIG: configPath
    };

    console.log('[TemplateAnalyzer] Executing InDesign script...');
    const { stdout, stderr } = await execAsync(`osascript "${tempScriptPath}"`, {
      env,
      timeout: 300000 // 5 minutes
    });

    if (stderr) {
      console.warn('[TemplateAnalyzer] Script stderr:', stderr);
    }
    if (stdout) {
      console.log('[TemplateAnalyzer] Script stdout:', stdout);
    }

    return { success: true };
  } catch (error) {
    console.error('[TemplateAnalyzer] Script execution error:', error);
    throw new Error(`InDesign script failed: ${error.message}`);
  } finally {
    // Nettoyer le fichier temporaire
    try {
      await fs.unlink(tempScriptPath);
    } catch (e) {
      // Ignorer les erreurs de nettoyage
    }
  }
}

/**
 * Parse les résultats de l'analyse InDesign
 */
async function parseAnalysisResults(outputPath) {
  try {
    const content = await fs.readFile(outputPath, 'utf-8');
    const results = JSON.parse(content);
    return results;
  } catch (error) {
    console.error('[TemplateAnalyzer] Error parsing results:', error);
    throw new Error(`Failed to parse analysis results: ${error.message}`);
  }
}

/**
 * Met à jour un template dans Supabase avec les métadonnées enrichies
 */
async function updateTemplateInDatabase(templateId, metadata) {
  try {
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('indesign_templates')
      .update({
        image_slots: metadata.image_slots,
        placeholders: metadata.placeholders,
        category: metadata.category,
        style: metadata.style,
        recommended_for: metadata.recommended_for,
        description: metadata.description || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase update error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error(`[TemplateAnalyzer] Error updating template ${templateId}:`, error);
    throw error;
  }
}

/**
 * Analyse tous les templates
 * @returns {Promise<Object>} Résultat de l'analyse
 */
export async function analyzeAllTemplates() {
  console.log('[TemplateAnalyzer] Starting full analysis...');
  
  const results = {
    analyzed: 0,
    updated: 0,
    errors: []
  };

  try {
    // 1. Préparer le dossier
    await ensureAnalysisDir();

    // 2. Récupérer les templates
    const templates = await getTemplatesFromDatabase();
    if (templates.length === 0) {
      console.log('[TemplateAnalyzer] No templates found');
      return results;
    }

    console.log(`[TemplateAnalyzer] Found ${templates.length} templates`);

    // 3. Créer la config pour le script JSX
    const { configPath, outputPath } = await createAnalysisConfig(templates);

    // 4. Exécuter le script InDesign
    await executeInDesignScript(configPath);

    // 5. Parser les résultats
    const analysisResults = await parseAnalysisResults(outputPath);
    
    if (!analysisResults.templates || !Array.isArray(analysisResults.templates)) {
      throw new Error('Invalid analysis results format');
    }

    console.log(`[TemplateAnalyzer] Parsed ${analysisResults.templates.length} results`);

    // 6. Enrichir avec l'IA et mettre à jour chaque template
    for (const templateResult of analysisResults.templates) {
      results.analyzed++;

      try {
        if (templateResult.errors && templateResult.errors.length > 0) {
          console.warn(`[TemplateAnalyzer] Template ${templateResult.id} has errors:`, templateResult.errors);
          results.errors.push({
            templateId: templateResult.id,
            filename: templateResult.filename,
            errors: templateResult.errors
          });
          continue;
        }

        // Enrichir avec l'IA
        console.log(`[TemplateAnalyzer] Enriching template ${templateResult.filename}...`);
        const enrichedMetadata = await enrichTemplateMetadata({
          filename: templateResult.filename,
          imageSlots: templateResult.imageSlots,
          textPlaceholders: templateResult.textPlaceholders,
          fonts: templateResult.fonts,
          swatches: templateResult.swatches,
          metadata: templateResult.metadata,
          pageCount: templateResult.pageCount
        });

        // Combiner les données extraites et enrichies
        const finalMetadata = {
          image_slots: templateResult.imageSlots,
          placeholders: templateResult.textPlaceholders,
          category: enrichedMetadata.category,
          style: enrichedMetadata.style,
          recommended_for: enrichedMetadata.recommended_for,
          description: enrichedMetadata.description
        };

        // Mettre à jour dans Supabase
        await updateTemplateInDatabase(templateResult.id, finalMetadata);
        results.updated++;

        console.log(`[TemplateAnalyzer] ✓ Updated template ${templateResult.filename}`);
      } catch (error) {
        console.error(`[TemplateAnalyzer] Error processing template ${templateResult.id}:`, error);
        results.errors.push({
          templateId: templateResult.id,
          filename: templateResult.filename,
          error: error.message
        });
      }
    }

    console.log('[TemplateAnalyzer] Analysis complete:', results);
    return results;

  } catch (error) {
    console.error('[TemplateAnalyzer] Fatal error:', error);
    throw error;
  }
}

/**
 * Analyse un template spécifique
 * @param {string} templateId - ID du template
 * @returns {Promise<Object>} Template mis à jour
 */
export async function analyzeOneTemplate(templateId) {
  console.log(`[TemplateAnalyzer] Analyzing template ${templateId}...`);

  try {
    // Récupérer le template
    const { data: template, error } = await supabase
      .from('indesign_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error || !template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Analyser via le workflow complet
    await ensureAnalysisDir();
    const { configPath, outputPath } = await createAnalysisConfig([template]);
    await executeInDesignScript(configPath);
    const analysisResults = await parseAnalysisResults(outputPath);

    if (!analysisResults.templates || analysisResults.templates.length === 0) {
      throw new Error('No analysis results returned');
    }

    const templateResult = analysisResults.templates[0];

    if (templateResult.errors && templateResult.errors.length > 0) {
      throw new Error(`Analysis errors: ${templateResult.errors.join(', ')}`);
    }

    // Enrichir avec l'IA
    const enrichedMetadata = await enrichTemplateMetadata({
      filename: templateResult.filename,
      imageSlots: templateResult.imageSlots,
      textPlaceholders: templateResult.textPlaceholders,
      fonts: templateResult.fonts,
      swatches: templateResult.swatches,
      metadata: templateResult.metadata,
      pageCount: templateResult.pageCount
    });

    // Mettre à jour
    const finalMetadata = {
      image_slots: templateResult.imageSlots,
      placeholders: templateResult.textPlaceholders,
      category: enrichedMetadata.category,
      style: enrichedMetadata.style,
      recommended_for: enrichedMetadata.recommended_for,
      description: enrichedMetadata.description
    };

    const updatedTemplate = await updateTemplateInDatabase(templateId, finalMetadata);
    
    console.log(`[TemplateAnalyzer] ✓ Template ${templateId} analyzed successfully`);
    return updatedTemplate;

  } catch (error) {
    console.error(`[TemplateAnalyzer] Error analyzing template ${templateId}:`, error);
    throw error;
  }
}

export default { analyzeAllTemplates, analyzeOneTemplate };
