import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

const BASE_PATH = path.resolve(__dirname, '../../Indesign automation v1');
const SCRIPT_PATH = path.join(BASE_PATH, 'scripts', 'inspect_template_text.jsx');
const ANALYSIS_DIR = path.join(BASE_PATH, 'analysis');

async function inspectTemplate() {
  console.log('\n🔍 Inspection du template...\n');
  
  const indesignApp = process.env.INDESIGN_APP_NAME || 'Adobe InDesign 2025';
  
  const applescript = `
tell application "${indesignApp}"
    activate
    do script (file POSIX file "${SCRIPT_PATH}") language javascript
end tell
`;

  const tempScriptPath = path.join(ANALYSIS_DIR, 'temp_inspect.applescript');
  await fs.writeFile(tempScriptPath, applescript, 'utf-8');

  try {
    console.log('⚙️  Lancement d\'InDesign...');
    const { stdout, stderr } = await execAsync(`osascript "${tempScriptPath}"`, {
      timeout: 300000
    });

    // Lire les résultats
    const jsonPath = path.join(ANALYSIS_DIR, 'template_inspection.json');
    const txtPath = path.join(ANALYSIS_DIR, 'template_inspection.txt');
    
    const jsonContent = await fs.readFile(jsonPath, 'utf-8');
    const txtContent = await fs.readFile(txtPath, 'utf-8');
    
    console.log('\n📄 RÉSULTATS D\'INSPECTION\n');
    console.log(txtContent);
    
    console.log('\n💾 Fichiers créés:');
    console.log(`   - ${jsonPath}`);
    console.log(`   - ${txtPath}\n`);

    return JSON.parse(jsonContent);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    throw error;
  } finally {
    try {
      await fs.unlink(tempScriptPath);
    } catch (e) {
      // Ignorer
    }
  }
}

console.log('🚀 Inspection du template Template 251025.indt\n');

inspectTemplate()
  .then(() => {
    console.log('✨ Inspection terminée!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
