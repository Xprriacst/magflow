import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/**
 * Met à jour les métadonnées du template avec les limites de caractères
 */
async function updateTemplateMetadata() {
  console.log('\n📝 Mise à jour des métadonnées du template...\n');
  
  const templateId = '30050538-7b3b-4147-b587-cd9e39f1e7ce';
  const newFilePath = 'Template 251025_2_PH.indt';
  
  // Métadonnées basées sur l'inspection originale (corrigées avec TITRE)
  const charLimits = {
    'TITRE': {
      min: 47,              // 59 * 0.8
      max: 71,              // 59 * 1.2
      recommended: 59,
      type: 'titre',
      has_drop_cap: false,
      description: 'Titre principal de l\'article'
    },
    'ARTICLE': {
      min: 426,             // 533 * 0.8
      max: 640,             // 533 * 1.2
      recommended: 533,
      type: 'article',
      has_drop_cap: true,
      description: 'Article principal avec lettrine M'
    }
  };

  try {
    // Mettre à jour avec les champs existants
    const { data, error } = await client
      .from('indesign_templates')
      .update({
        file_path: newFilePath,
        filename: 'Template 251025_2_PH.indt',
        placeholders: ['TITRE', 'ARTICLE'],
        description: `Template Mode élégant avec placeholders.
        
TITRE: ${charLimits.TITRE.recommended} caractères (${charLimits.TITRE.min}-${charLimits.TITRE.max})
ARTICLE: ${charLimits.ARTICLE.recommended} caractères (${charLimits.ARTICLE.min}-${charLimits.ARTICLE.max}) avec lettrine`,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur Supabase: ${error.message}`);
    }

    console.log('✅ Template mis à jour avec succès!\n');
    console.log('📊 Métadonnées:');
    console.log(`   - Fichier: ${data.filename}`);
    console.log(`   - Placeholders: ${data.placeholders.join(', ')}`);
    console.log('\n📏 Limites de caractères:');
    
    Object.entries(charLimits).forEach(([key, limits]) => {
      console.log(`\n   {{${key}}}`);
      console.log(`   - Recommandé: ${limits.recommended} caractères`);
      console.log(`   - Plage: ${limits.min} - ${limits.max} caractères`);
      console.log(`   - Type: ${limits.type}`);
      console.log(`   - Lettrine: ${limits.has_drop_cap ? 'Oui' : 'Non'}`);
      console.log(`   - Description: ${limits.description}`);
    });

    console.log('\n🎯 Prochaines étapes:');
    console.log('   1. Mettre à jour le mapping Flask avec le nouveau fichier');
    console.log('   2. Corriger manuellement le template dans InDesign:');
    console.log('      - FRAME #1 devrait contenir {{ARTICLE}} (pas {{CHAPO}})');
    console.log('   3. Relancer l\'analyse complète si nécessaire\n');

    return data;

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

updateTemplateMetadata()
  .then(() => {
    console.log('✨ Mise à jour terminée!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
