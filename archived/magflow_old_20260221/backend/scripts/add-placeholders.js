import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const execAsync = promisify(exec);

const BASE_PATH = path.resolve(__dirname, '../../Indesign automation v1');
const SCRIPT_PATH = path.join(BASE_PATH, 'scripts', 'add_placeholders_to_template.jsx');
const ANALYSIS_DIR = path.join(BASE_PATH, 'analysis');

/**
 * Exécute le script InDesign pour ajouter les placeholders
 */
async function addPlaceholdersToTemplate() {
  console.log('\n🔧 Ajout de placeholders au template...\n');
  
  const indesignApp = process.env.INDESIGN_APP_NAME || 'Adobe InDesign 2025';
  
  // Créer un script AppleScript
  const applescript = `
tell application "${indesignApp}"
    activate
    do script (file POSIX file "${SCRIPT_PATH}") language javascript
end tell
`;

  const tempScriptPath = path.join(ANALYSIS_DIR, 'temp_add_placeholders.applescript');
  await fs.writeFile(tempScriptPath, applescript, 'utf-8');

  try {
    console.log('⚙️  Lancement d\'InDesign...');
    const { stdout, stderr } = await execAsync(`osascript "${tempScriptPath}"`, {
      timeout: 300000 // 5 minutes
    });

    if (stderr) {
      console.warn('⚠️  Warnings:', stderr);
    }
    if (stdout) {
      console.log('📄 Output:', stdout);
    }

    // Lire les résultats
    const resultsPath = path.join(ANALYSIS_DIR, 'placeholder_results.json');
    const metadataPath = path.join(ANALYSIS_DIR, 'template_metadata.json');
    
    const resultsContent = await fs.readFile(resultsPath, 'utf-8');
    const results = JSON.parse(resultsContent);
    
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);

    console.log('\n✅ Placeholders ajoutés avec succès!\n');
    
    console.log('📊 Résumé:');
    results.placeholders_added.forEach(ph => {
      const key = ph.placeholder.replace(/[{}]/g, '');
      const limits = results.char_limits[key];
      
      console.log(`\n   ${ph.placeholder}`);
      console.log(`   - Longueur originale: ${ph.original_length} caractères`);
      console.log(`   - Recommandé: ${limits.recommended} caractères`);
      console.log(`   - Plage: ${limits.min} - ${limits.max} caractères`);
      console.log(`   - Type: ${limits.type}`);
      console.log(`   - Lettrine: ${limits.has_drop_cap ? 'Oui' : 'Non'}`);
    });

    // Mettre à jour Supabase avec les char_limits
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      console.log('\n💾 Mise à jour des métadonnées dans Supabase...');
      
      const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      
      // Extraire les noms des placeholders
      const placeholderNames = Object.keys(results.char_limits);
      
      const { data, error } = await client
        .from('indesign_templates')
        .update({
          placeholders: placeholderNames,
          // Stocker les char_limits dans un champ JSON custom
          metadata: {
            char_limits: results.char_limits
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', metadata.template_id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur mise à jour Supabase:', error.message);
      } else {
        console.log('✅ Supabase mis à jour');
      }
    }

    console.log('\n🎯 Prochaine étape:');
    console.log('   Relancer l\'analyse complète du template:');
    console.log(`   node backend/scripts/analyze-one-template.js ${metadata.template_id}\n`);

    return { success: true, metadata };

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    throw error;
  } finally {
    // Nettoyer
    try {
      await fs.unlink(tempScriptPath);
    } catch (e) {
      // Ignorer
    }
  }
}

// Exécution
console.log('🚀 Script d\'ajout de placeholders\n');
console.log('⚠️  ATTENTION:');
console.log('   - InDesign va s\'ouvrir');
console.log('   - Le template sera modifié');
console.log('   - Les textes Lorem Ipsum seront remplacés par {{CHAPO}} et {{ARTICLE}}');
console.log('   - Les limites de caractères seront enregistrées\n');

addPlaceholdersToTemplate()
  .then(() => {
    console.log('✨ Processus terminé avec succès!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
