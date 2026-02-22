import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function updateTemplate() {
  console.log('\n📝 Mise à jour Template 251025_3_PH...\n');
  
  const templateId = '1712acaa-8c51-4981-b191-51761466231a';
  
  const { data, error } = await client
    .from('indesign_templates')
    .update({
      placeholders: ['TITRE', 'ARTICLE'],
      description: 'Template Mode élégant v3 avec placeholders.\n\nTITRE: Texte court\nARTICLE: Article principal avec lettrine',
      image_slots: 1,
      category: 'Mode',
      style: 'simple',
      updated_at: new Date().toISOString()
    })
    .eq('id', templateId)
    .select()
    .single();

  if (error) throw error;
  
  console.log('✅ Template v3 mis à jour avec succès!\n');
  console.log('📊 Métadonnées:');
  console.log(`   - Fichier: ${data.filename}`);
  console.log(`   - Placeholders: ${data.placeholders.join(', ')}`);
  console.log(`   - Image slots: ${data.image_slots}`);
  console.log(`   - Catégorie: ${data.category}`);
  console.log(`   - Style: ${data.style}\n`);
}

updateTemplate()
  .then(() => process.exit(0))
  .catch(e => { 
    console.error('❌ Erreur:', e.message); 
    process.exit(1); 
  });
