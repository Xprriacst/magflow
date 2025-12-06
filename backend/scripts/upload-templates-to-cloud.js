#!/usr/bin/env node
/**
 * Script pour uploader tous les templates locaux vers Supabase Storage
 * Usage: node backend/scripts/upload-templates-to-cloud.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL et SUPABASE_KEY doivent être définis');
  console.log('Variables trouvées:', { SUPABASE_URL: !!SUPABASE_URL, SUPABASE_KEY: !!SUPABASE_KEY });
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getChecksum(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

async function uploadTemplate(template) {
  const { id, name, filename, file_path, storage_url } = template;
  
  // Skip si déjà uploadé
  if (storage_url) {
    console.log(`⏭️  ${name} - déjà dans le cloud`);
    return { skipped: true };
  }
  
  // Vérifier que le fichier existe
  if (!file_path || !fs.existsSync(file_path)) {
    console.log(`⚠️  ${name} - fichier non trouvé: ${file_path}`);
    return { error: 'File not found' };
  }
  
  console.log(`📤 Upload: ${name}...`);
  
  const fileBuffer = fs.readFileSync(file_path);
  const checksum = getChecksum(file_path);
  const storagePath = `templates/${filename}`;
  
  // Upload vers Storage
  const { error: uploadError } = await supabase.storage
    .from('templates')
    .upload(storagePath, fileBuffer, {
      contentType: 'application/octet-stream',
      upsert: true
    });
  
  if (uploadError) {
    console.error(`❌ ${name}: ${uploadError.message}`);
    return { error: uploadError.message };
  }
  
  // Obtenir l'URL publique
  const { data: urlData } = supabase.storage
    .from('templates')
    .getPublicUrl(storagePath);
  
  const storageUrl = urlData?.publicUrl;
  
  // Mettre à jour la BDD
  const { error: updateError } = await supabase
    .from('indesign_templates')
    .update({
      storage_url: storageUrl,
      file_checksum: checksum
    })
    .eq('id', id);
  
  if (updateError) {
    console.error(`❌ ${name} (DB update): ${updateError.message}`);
    return { error: updateError.message };
  }
  
  console.log(`✅ ${name} → ${storageUrl}`);
  return { uploaded: true, url: storageUrl };
}

async function main() {
  console.log('\n🚀 Upload des templates vers Supabase Storage\n');
  console.log('📍 Supabase URL:', SUPABASE_URL);
  console.log('');
  
  // Récupérer tous les templates
  const { data: templates, error } = await supabase
    .from('indesign_templates')
    .select('id, name, filename, file_path, storage_url')
    .eq('is_active', true);
  
  if (error) {
    console.error('❌ Erreur récupération templates:', error.message);
    process.exit(1);
  }
  
  if (!templates || templates.length === 0) {
    console.log('⚠️  Aucun template trouvé dans la base de données');
    process.exit(0);
  }
  
  console.log(`📋 ${templates.length} templates trouvés\n`);
  
  const results = {
    uploaded: 0,
    skipped: 0,
    errors: 0
  };
  
  for (const template of templates) {
    const result = await uploadTemplate(template);
    if (result.uploaded) results.uploaded++;
    else if (result.skipped) results.skipped++;
    else results.errors++;
  }
  
  console.log('\n📊 Résumé:');
  console.log(`   ✅ Uploadés: ${results.uploaded}`);
  console.log(`   ⏭️  Skippés: ${results.skipped}`);
  console.log(`   ❌ Erreurs: ${results.errors}`);
  console.log('');
}

main().catch(console.error);
