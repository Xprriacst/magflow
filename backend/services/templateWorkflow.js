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
  const workflowStartTime = Date.now();
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  🚀 TEMPLATE WORKFLOW STARTED                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('[TemplateWorkflow] 📦 File:', originalName);
  console.log('[TemplateWorkflow] 📍 Path:', filePath);
  console.log('[TemplateWorkflow] 🏷️  Name:', templateName || '(auto-generate)');

  const results = {
    step: 'init',
    success: false,
    template: null,
    errors: []
  };

  try {
    // === ÉTAPE 1: Validation du fichier ===
    console.log('\n┌─ STEP 1/6: FILE VALIDATION ─────────────────────────────────┐');
    results.step = 'validation';

    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const ext = path.extname(originalName).toLowerCase();
    if (!['.indt', '.indd'].includes(ext)) {
      throw new Error('Only .indt and .indd files are allowed');
    }

    const fileBuffer = readFileSync(filePath);
    const fileSize = (fileBuffer.length / 1024 / 1024).toFixed(2);
    const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex');

    console.log('[TemplateWorkflow] ✅ File exists and is valid');
    console.log('[TemplateWorkflow] 📊 Size:', fileSize, 'MB');
    console.log('[TemplateWorkflow] 🔐 Checksum:', checksum);
    console.log('└──────────────────────────────────────────────────────────────┘');

    // === ÉTAPE 2: Analyse via Flask/InDesign ===
    console.log('\n┌─ STEP 2/6: INDESIGN ANALYSIS (may take 2-8 min) ────────────┐');
    results.step = 'analysis';
    console.log('[TemplateWorkflow] 🖥️  Sending to Flask API for InDesign processing...');
    console.log('[TemplateWorkflow] ⏳ This will:');
    console.log('[TemplateWorkflow]    1. Open template in InDesign');
    console.log('[TemplateWorkflow]    2. Extract metadata (placeholders, images, fonts, colors)');
    console.log('[TemplateWorkflow]    3. Generate thumbnail JPG');
    console.log('[TemplateWorkflow]    4. Close document');

    const analysisStartTime = Date.now();
    const analysisResult = await analyzeTemplateViaFlask(filePath);
    const analysisDuration = ((Date.now() - analysisStartTime) / 1000).toFixed(2);

    if (!analysisResult.success) {
      throw new Error(`Analysis failed: ${analysisResult.error || 'Unknown error'}`);
    }

    console.log(`[TemplateWorkflow] ✅ Analysis complete in ${analysisDuration}s`);
    console.log('[TemplateWorkflow] 📋 Extracted:', {
      placeholders: analysisResult.template?.placeholders?.length || 0,
      imageSlots: analysisResult.template?.image_slots || 0,
      fonts: analysisResult.template?.fonts?.length || 0,
      colors: analysisResult.template?.colors?.length || 0
    });
    console.log('└──────────────────────────────────────────────────────────────┘');

    // === ÉTAPE 3: Upload du template vers Supabase Storage ===
    console.log('\n┌─ STEP 3/6: UPLOAD TEMPLATE TO CLOUD ────────────────────────┐');
    results.step = 'template_upload';
    console.log('[TemplateWorkflow] ☁️  Uploading', fileSize, 'MB to Supabase Storage...');

    const uploadStartTime = Date.now();
    const templateStorageUrl = await uploadFileToSupabase(
      fileBuffer,
      `templates/${originalName}`,
      'application/octet-stream'
    );
    const uploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(2);

    console.log(`[TemplateWorkflow] ✅ Template uploaded in ${uploadDuration}s`);
    console.log('[TemplateWorkflow] 🔗 URL:', templateStorageUrl);
    console.log('└──────────────────────────────────────────────────────────────┘');

    // === ÉTAPE 4: Upload de la miniature vers Supabase Storage ===
    console.log('\n┌─ STEP 4/6: UPLOAD THUMBNAIL TO CLOUD ───────────────────────┐');
    results.step = 'thumbnail_upload';
    let thumbnailUrl = null;

    if (analysisResult.thumbnail?.path) {
      console.log('[TemplateWorkflow] 🖼️  Thumbnail found:', analysisResult.thumbnail.path);

      try {
        const thumbnailBuffer = readFileSync(analysisResult.thumbnail.path);
        const thumbnailSize = (thumbnailBuffer.length / 1024).toFixed(2);
        const thumbnailFilename = analysisResult.thumbnail.filename ||
          originalName.replace(/\.(indt|indd)$/i, '_thumbnail.jpg');

        console.log('[TemplateWorkflow] 📊 Thumbnail size:', thumbnailSize, 'KB');

        const thumbUploadStartTime = Date.now();
        thumbnailUrl = await uploadFileToSupabase(
          thumbnailBuffer,
          `previews/${thumbnailFilename}`,
          'image/jpeg'
        );
        const thumbUploadDuration = ((Date.now() - thumbUploadStartTime) / 1000).toFixed(2);

        console.log(`[TemplateWorkflow] ✅ Thumbnail uploaded in ${thumbUploadDuration}s`);
        console.log('[TemplateWorkflow] 🔗 URL:', thumbnailUrl);
      } catch (thumbError) {
        console.warn('[TemplateWorkflow] ⚠️  Thumbnail upload failed:', thumbError.message);
        results.errors.push(`Thumbnail upload warning: ${thumbError.message}`);
      }
    } else {
      console.log('[TemplateWorkflow] ⚠️  No thumbnail generated by InDesign');
    }
    console.log('└──────────────────────────────────────────────────────────────┘');

    // === ÉTAPE 5: Enrichissement IA des métadonnées ===
    console.log('\n┌─ STEP 5/6: AI ENRICHMENT (GPT-4 analysis) ──────────────────┐');
    results.step = 'ai_enrichment';
    console.log('[TemplateWorkflow] 🤖 Analyzing template with AI...');

    let enrichedMetadata = {
      category: 'General',
      style: 'simple',
      recommended_for: [],
      description: ''
    };

    try {
      const templateData = analysisResult.template || {};
      const aiStartTime = Date.now();

      enrichedMetadata = await enrichTemplateMetadata({
        filename: originalName,
        imageSlots: templateData.image_slots || 0,
        textPlaceholders: templateData.placeholders || [],
        fonts: templateData.fonts || [],
        swatches: templateData.colors || [],
        pageCount: templateData.page_count || 1
      });

      const aiDuration = ((Date.now() - aiStartTime) / 1000).toFixed(2);
      console.log(`[TemplateWorkflow] ✅ AI enrichment complete in ${aiDuration}s`);
      console.log('[TemplateWorkflow] 📊 Results:', {
        category: enrichedMetadata.category,
        style: enrichedMetadata.style,
        recommended_for: enrichedMetadata.recommended_for?.length || 0
      });
    } catch (aiError) {
      console.warn('[TemplateWorkflow] ⚠️  AI enrichment failed:', aiError.message);
      results.errors.push(`AI enrichment warning: ${aiError.message}`);
    }
    console.log('└──────────────────────────────────────────────────────────────┘');

    // === ÉTAPE 6: Création de l'entrée en base de données ===
    console.log('\n┌─ STEP 6/6: DATABASE INSERT ──────────────────────────────────┐');
    results.step = 'database_insert';
    console.log('[TemplateWorkflow] 💾 Creating database entry...');

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

    console.log('[TemplateWorkflow] ✅ Template created with ID:', insertedTemplate.id);
    console.log('[TemplateWorkflow] 📊 Template summary:', {
      name: insertedTemplate.name,
      category: insertedTemplate.category,
      imageSlots: insertedTemplate.image_slots,
      placeholders: insertedTemplate.placeholders?.length || 0
    });
    console.log('└──────────────────────────────────────────────────────────────┘');

    // === SUCCÈS ===
    results.success = true;
    results.step = 'complete';
    results.template = insertedTemplate;

    const totalDuration = ((Date.now() - workflowStartTime) / 1000).toFixed(2);
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TEMPLATE WORKFLOW COMPLETED                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log(`[TemplateWorkflow] ⏱️  Total duration: ${totalDuration}s (${(totalDuration / 60).toFixed(1)} minutes)`);
    console.log(`[TemplateWorkflow] 🎉 Template "${insertedTemplate.name}" ready to use!\n`);

    return results;

  } catch (error) {
    const totalDuration = ((Date.now() - workflowStartTime) / 1000).toFixed(2);
    console.error('\n╔════════════════════════════════════════════════════════════════╗');
    console.error('║  ❌ TEMPLATE WORKFLOW FAILED                                   ║');
    console.error('╚════════════════════════════════════════════════════════════════╝');
    console.error(`[TemplateWorkflow] ⏱️  Failed after: ${totalDuration}s`);
    console.error(`[TemplateWorkflow] 🔴 Error at step: ${results.step}`);
    console.error(`[TemplateWorkflow] 📋 Error message: ${error.message}\n`);

    results.errors.push(error.message);
    throw error;
  }
}

/**
 * Analyse un template via l'API Flask
 */
async function analyzeTemplateViaFlask(templatePath) {
  const startTime = Date.now();
  try {
    console.log('[TemplateWorkflow] 📞 Calling Flask API:', `${FLASK_API_URL}/api/templates/analyze`);
    console.log('[TemplateWorkflow] 📄 Template path:', templatePath);
    console.log('[TemplateWorkflow] ⏱️  Timeout set to: 600 seconds (10 minutes)');

    const response = await axios.post(
      `${FLASK_API_URL}/api/templates/analyze`,
      {
        template_path: templatePath,
        thumbnail_width: 800,
        thumbnail_height: 600
      },
      {
        timeout: 600000, // 10 minutes pour l'analyse InDesign (augmenté de 5 min)
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[TemplateWorkflow] ✅ Flask API responded in ${duration}s`);

    return response.data;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[TemplateWorkflow] ❌ Flask API call failed after ${duration}s:`, error.message);

    if (error.code === 'ECONNABORTED') {
      console.error('[TemplateWorkflow] ⚠️  TIMEOUT: Flask did not respond within 10 minutes');
      console.error('[TemplateWorkflow] 💡 This might indicate InDesign is stuck or the template is very complex');
    }

    if (error.response) {
      console.error('[TemplateWorkflow] 📋 Flask response status:', error.response.status);
      console.error('[TemplateWorkflow] 📋 Flask response data:', error.response.data);
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
