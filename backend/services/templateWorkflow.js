/**
 * Service de workflow pour l'ajout de nouveaux templates
 * Orchestre: Upload → Analyse → Miniature → Enrichissement IA → Création BDD
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';
import { existsSync, readFileSync } from 'fs';
import { supabase, supabaseAdmin, isSupabaseConfigured } from './supabaseClient.js';
import { enrichTemplateMetadata } from './openaiService.js';

const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5003';

/**
 * Workflow complet pour l'ajout d'un nouveau template
 * @param {Object} options
 * @param {string} options.filePath - Chemin vers le fichier template uploadé
 * @param {string} options.originalName - Nom original du fichier
 * @param {string} options.templateName - Nom souhaité pour le template (optionnel)
 * @returns {Promise<Object>} Template créé avec toutes ses métadonnées
 */
export async function processNewTemplate({ filePath, originalName, templateName }) {
  console.log('[TemplateWorkflow] Starting template processing:', originalName);

  const results = {
    step: 'init',
    success: false,
    template: null,
    errors: []
  };

  try {
    // === ÉTAPE 1: Validation du fichier ===
    results.step = 'validation';
    
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const ext = path.extname(originalName).toLowerCase();
    if (!['.indt', '.indd'].includes(ext)) {
      throw new Error('Only .indt and .indd files are allowed');
    }

    const fileBuffer = readFileSync(filePath);
    const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex');
    console.log('[TemplateWorkflow] File validated, checksum:', checksum);

    // === ÉTAPE 2: Analyse via Flask/InDesign ===
    results.step = 'analysis';
    console.log('[TemplateWorkflow] Analyzing template via Flask...');

    const analysisResult = await analyzeTemplateViaFlask(filePath);
    
    if (!analysisResult.success) {
      throw new Error(`Analysis failed: ${analysisResult.error || 'Unknown error'}`);
    }

    console.log('[TemplateWorkflow] Analysis complete:', {
      placeholders: analysisResult.template?.placeholders?.length || 0,
      imageSlots: analysisResult.template?.image_slots || 0
    });

    // === ÉTAPE 3: Upload du template vers Supabase Storage ===
    results.step = 'template_upload';
    console.log('[TemplateWorkflow] Uploading template to Supabase Storage...');

    const templateStorageUrl = await uploadFileToSupabase(
      fileBuffer,
      `templates/${originalName}`,
      'application/octet-stream'
    );

    console.log('[TemplateWorkflow] Template uploaded:', templateStorageUrl);

    // === ÉTAPE 4: Upload de la miniature vers Supabase Storage ===
    results.step = 'thumbnail_upload';
    let thumbnailUrl = null;

    if (analysisResult.thumbnail?.path) {
      console.log('[TemplateWorkflow] Uploading thumbnail...');
      
      try {
        const thumbnailBuffer = readFileSync(analysisResult.thumbnail.path);
        const thumbnailFilename = analysisResult.thumbnail.filename || 
          originalName.replace(/\.(indt|indd)$/i, '_thumbnail.jpg');
        
        thumbnailUrl = await uploadFileToSupabase(
          thumbnailBuffer,
          `previews/${thumbnailFilename}`,
          'image/jpeg'
        );
        
        console.log('[TemplateWorkflow] Thumbnail uploaded:', thumbnailUrl);
      } catch (thumbError) {
        console.warn('[TemplateWorkflow] Thumbnail upload failed:', thumbError.message);
        results.errors.push(`Thumbnail upload warning: ${thumbError.message}`);
      }
    }

    // === ÉTAPE 5: Enrichissement IA des métadonnées ===
    results.step = 'ai_enrichment';
    console.log('[TemplateWorkflow] Enriching metadata with AI...');

    let enrichedMetadata = {
      category: 'General',
      style: 'simple',
      recommended_for: [],
      description: ''
    };

    try {
      const templateData = analysisResult.template || {};
      enrichedMetadata = await enrichTemplateMetadata({
        filename: originalName,
        imageSlots: templateData.image_slots || 0,
        textPlaceholders: templateData.placeholders || [],
        fonts: templateData.fonts || [],
        swatches: templateData.colors || [],
        pageCount: templateData.page_count || 1
      });
      console.log('[TemplateWorkflow] AI enrichment complete:', enrichedMetadata.category);
    } catch (aiError) {
      console.warn('[TemplateWorkflow] AI enrichment failed:', aiError.message);
      results.errors.push(`AI enrichment warning: ${aiError.message}`);
    }

    // === ÉTAPE 6: Création de l'entrée en base de données ===
    results.step = 'database_insert';
    console.log('[TemplateWorkflow] Creating database entry...');

    const templateData = analysisResult.template || {};
    
    // Formater les placeholders pour Supabase (avec les accolades)
    const formattedPlaceholders = (templateData.placeholders || []).map(p => `{{${p}}}`);

    const newTemplate = {
      name: templateName || generateTemplateName(originalName),
      filename: originalName,
      file_path: filePath,
      storage_url: templateStorageUrl,
      preview_url: thumbnailUrl,
      file_checksum: checksum,
      placeholders: formattedPlaceholders,
      image_slots: templateData.image_slots || 0,
      category: enrichedMetadata.category || 'General',
      style: enrichedMetadata.style || 'simple',
      recommended_for: enrichedMetadata.recommended_for || [],
      description: enrichedMetadata.description || `Template ${templateName || originalName}`,
      is_active: true
    };

    const client = supabaseAdmin || supabase;
    const { data: insertedTemplate, error: insertError } = await client
      .from('indesign_templates')
      .insert(newTemplate)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log('[TemplateWorkflow] Template created:', insertedTemplate.id);

    // === SUCCÈS ===
    results.success = true;
    results.step = 'complete';
    results.template = insertedTemplate;

    return results;

  } catch (error) {
    console.error(`[TemplateWorkflow] Error at step ${results.step}:`, error);
    results.errors.push(error.message);
    throw error;
  }
}

/**
 * Analyse un template via l'API Flask
 */
async function analyzeTemplateViaFlask(templatePath) {
  try {
    const response = await axios.post(
      `${FLASK_API_URL}/api/templates/analyze`,
      {
        template_path: templatePath,
        thumbnail_width: 800,
        thumbnail_height: 600
      },
      {
        timeout: 120000, // 2 minutes pour l'analyse InDesign
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('[TemplateWorkflow] Flask API call failed:', error.message);
    if (error.response) {
      throw new Error(`Flask API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Upload un fichier vers Supabase Storage
 */
async function uploadFileToSupabase(buffer, storagePath, contentType) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const client = supabaseAdmin || supabase;

  const { error: uploadError } = await client.storage
    .from('templates')
    .upload(storagePath, buffer, {
      contentType,
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = client.storage
    .from('templates')
    .getPublicUrl(storagePath);

  return urlData?.publicUrl;
}

/**
 * Génère un nom de template à partir du nom de fichier
 */
function generateTemplateName(filename) {
  return filename
    .replace(/\.(indt|indd)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

/**
 * Mettre à jour un template existant avec de nouvelles métadonnées
 */
export async function updateTemplateFromAnalysis(templateId) {
  console.log('[TemplateWorkflow] Re-analyzing template:', templateId);

  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured');
  }

  const client = supabaseAdmin || supabase;

  // Récupérer le template
  const { data: template, error: fetchError } = await client
    .from('indesign_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (fetchError || !template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Analyser via Flask
  const analysisResult = await analyzeTemplateViaFlask(template.file_path);
  
  if (!analysisResult.success) {
    throw new Error(`Analysis failed: ${analysisResult.error || 'Unknown error'}`);
  }

  // Upload nouvelle miniature si générée
  let newThumbnailUrl = template.preview_url;
  
  if (analysisResult.thumbnail?.path) {
    try {
      const thumbnailBuffer = readFileSync(analysisResult.thumbnail.path);
      const thumbnailFilename = analysisResult.thumbnail.filename;
      
      newThumbnailUrl = await uploadFileToSupabase(
        thumbnailBuffer,
        `previews/${thumbnailFilename}`,
        'image/jpeg'
      );
    } catch (thumbError) {
      console.warn('[TemplateWorkflow] Thumbnail upload failed:', thumbError.message);
    }
  }

  // Enrichir avec IA
  const templateData = analysisResult.template || {};
  let enrichedMetadata = {};
  
  try {
    enrichedMetadata = await enrichTemplateMetadata({
      filename: template.filename,
      imageSlots: templateData.image_slots || 0,
      textPlaceholders: templateData.placeholders || [],
      fonts: templateData.fonts || [],
      swatches: templateData.colors || [],
      pageCount: templateData.page_count || 1
    });
  } catch (aiError) {
    console.warn('[TemplateWorkflow] AI enrichment failed:', aiError.message);
  }

  // Mettre à jour
  const formattedPlaceholders = (templateData.placeholders || []).map(p => `{{${p}}}`);
  
  const updateData = {
    preview_url: newThumbnailUrl,
    placeholders: formattedPlaceholders,
    image_slots: templateData.image_slots || 0,
    category: enrichedMetadata.category || template.category,
    style: enrichedMetadata.style || template.style,
    recommended_for: enrichedMetadata.recommended_for || template.recommended_for,
    description: enrichedMetadata.description || template.description,
    updated_at: new Date().toISOString()
  };

  const { data: updatedTemplate, error: updateError } = await client
    .from('indesign_templates')
    .update(updateData)
    .eq('id', templateId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Update failed: ${updateError.message}`);
  }

  return updatedTemplate;
}

export default { processNewTemplate, updateTemplateFromAnalysis };
