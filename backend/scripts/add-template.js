import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger le .env depuis le dossier backend
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Script pour ajouter un nouveau template InDesign à la base de données
 * Usage: node backend/scripts/add-template.js <filename> <display_name>
 */

async function addTemplate(filename, displayName) {
  try {
    const templateId = randomUUID();
    const filePath = filename;

    console.log(`\n📄 Ajout du template:`);
    console.log(`   ID: ${templateId}`);
    console.log(`   Fichier: ${filename}`);
    console.log(`   Nom: ${displayName}`);
    console.log(`   Chemin: ${filePath}\n`);

    // Créer le client Supabase
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Supabase n\'est pas configuré. Vérifiez les variables SUPABASE_URL et SUPABASE_ANON_KEY dans backend/.env');
    }

    const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    const { data, error } = await client
      .from('indesign_templates')
      .insert({
        id: templateId,
        filename: filename,
        file_path: filePath,
        name: displayName,
        description: 'Template ajouté manuellement - En attente d\'analyse',
        image_slots: 0,
        placeholders: [],
        category: 'Non catégorisé',
        style: 'Non analysé',
        recommended_for: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur Supabase: ${error.message}`);
    }

    console.log('✅ Template ajouté avec succès!\n');
    console.log('📊 Données créées:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n🔍 Prochaines étapes:');
    console.log('1. Démarrez le backend: cd backend && npm run dev');
    console.log('2. Lancez l\'analyse automatique via l\'interface admin:');
    console.log('   http://localhost:5173/admin/templates');
    console.log('3. Ou via API:');
    console.log('   curl -X POST http://localhost:3001/api/templates/analyze\n');

    return data;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du template:', error);
    throw error;
  }
}

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Usage: node backend/scripts/add-template.js <filename> <display_name>');
  console.error('   Exemple: node backend/scripts/add-template.js "Template 251025.indt" "Magazine Complet Octobre 2025"');
  process.exit(1);
}

const [filename, ...displayNameParts] = args;
const displayName = displayNameParts.join(' ');

addTemplate(filename, displayName)
  .then(() => {
    console.log('✨ Processus terminé avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
