import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger le .env depuis le dossier backend AVANT tout import
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Importer après le chargement du .env
const { analyzeOneTemplate } = await import('../services/templateAnalyzer.js');

/**
 * Script pour analyser un template spécifique
 * Usage: node backend/scripts/analyze-one-template.js <template_id>
 */

const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('❌ Usage: node backend/scripts/analyze-one-template.js <template_id>');
  console.error('   Exemple: node backend/scripts/analyze-one-template.js 30050538-7b3b-4147-b587-cd9e39f1e7ce');
  process.exit(1);
}

const templateId = args[0];

console.log(`\n🔍 Analyse du template ${templateId}...\n`);
console.log('⚠️  ATTENTION: InDesign va s\'ouvrir et analyser le template.');
console.log('   Cela peut prendre quelques minutes.\n');

analyzeOneTemplate(templateId)
  .then((result) => {
    console.log('\n✅ Analyse terminée avec succès!');
    console.log('\n📊 Métadonnées extraites:');
    console.log(`   - Emplacements d'images: ${result.image_slots}`);
    console.log(`   - Placeholders texte: ${result.placeholders?.join(', ') || 'aucun'}`);
    console.log(`   - Catégorie: ${result.category}`);
    console.log(`   - Style: ${result.style}`);
    console.log(`   - Recommandé pour: ${result.recommended_for?.join(', ') || 'non défini'}`);
    
    if (result.description) {
      console.log(`\n📝 Description:\n   ${result.description}`);
    }
    
    console.log('\n✨ Le template est maintenant prêt à être utilisé!');
    console.log('   Accessible via: http://localhost:5173/dashboard\n');
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors de l\'analyse:', error.message);
    console.error('\n💡 Vérifications:');
    console.error('   1. InDesign est-il installé ?');
    console.error('   2. Le fichier template existe-t-il ?');
    console.error('   3. Le backend est-il configuré (OPENAI_API_KEY) ?\n');
    process.exit(1);
  });
