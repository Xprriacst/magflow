import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger le .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

console.log('\n📋 Liste des templates InDesign:\n');

client
  .from('indesign_templates')
  .select('*')
  .order('created_at', { ascending: false })
  .then(({ data, error }) => {
    if (error) {
      console.error('❌ Erreur:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('   Aucun template trouvé.');
      process.exit(0);
    }

    data.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name}`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Fichier: ${template.filename}`);
      console.log(`   Catégorie: ${template.category}`);
      console.log(`   Style: ${template.style}`);
      console.log(`   Images: ${template.image_slots}`);
      console.log(`   Placeholders: ${template.placeholders?.join(', ') || 'aucun'}`);
      console.log(`   Actif: ${template.is_active ? '✅' : '❌'}`);
      console.log('');
    });

    console.log(`Total: ${data.length} template(s)\n`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
