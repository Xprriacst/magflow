/**
 * MagFlow Desktop Agent - Version Simple (Node.js)
 * Connecte InDesign local au cloud MagFlow
 */

const { io } = require('socket.io-client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const BACKEND_URL = process.env.MAGFLOW_BACKEND || 'https://magflow.onrender.com';
const INDESIGN_APP = process.env.INDESIGN_APP || 'Adobe InDesign 2026';
const WORK_DIR = process.env.MAGFLOW_WORK_DIR || path.join(process.env.HOME, 'MagFlow');
const AGENT_ID = process.env.MAGFLOW_AGENT_ID || uuidv4();
const AGENT_TOKEN = process.env.MAGFLOW_AGENT_TOKEN;

if (!AGENT_TOKEN) {
  throw new Error('MAGFLOW_AGENT_TOKEN is required');
}

// Créer le dossier de travail
if (!fs.existsSync(WORK_DIR)) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
}

console.log('╔════════════════════════════════════════════╗');
console.log('║       MagFlow Desktop Agent v1.0           ║');
console.log('╠════════════════════════════════════════════╣');
console.log(`║ Backend: ${BACKEND_URL.padEnd(32)}║`);
console.log(`║ InDesign: ${INDESIGN_APP.padEnd(31)}║`);
console.log(`║ Work Dir: ${WORK_DIR.substring(0, 30).padEnd(31)}║`);
console.log('╚════════════════════════════════════════════╝');

// Détecter InDesign
function detectInDesign() {
  try {
    const result = execSync(`ls /Applications | grep -i "Adobe InDesign"`, { encoding: 'utf8' });
    const versions = result.trim().split('\n').filter(Boolean);
    console.log('📦 InDesign trouvé:', versions.join(', '));
    return versions.length > 0;
  } catch (e) {
    console.error('❌ InDesign non trouvé');
    return false;
  }
}

// Télécharger une image
async function downloadImage(url, destPath) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    fs.writeFileSync(destPath, response.data);
    console.log(`  ✅ Image téléchargée: ${path.basename(destPath)}`);
    return destPath;
  } catch (error) {
    console.error(`  ❌ Erreur téléchargement: ${error.message}`);
    return null;
  }
}

// Exécuter InDesign
async function executeInDesign(projectId, configPath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'scripts', 'generate.jsx');
    
    // Vérifier que le script existe
    if (!fs.existsSync(scriptPath)) {
      // Créer un script JSX minimal
      createDefaultScript(scriptPath);
    }
    
    const applescript = `
tell application "${INDESIGN_APP}"
    activate
    do script POSIX file "${scriptPath}" language javascript
end tell
`;
    
    const tempScript = path.join(WORK_DIR, `temp_${projectId}.applescript`);
    fs.writeFileSync(tempScript, applescript);
    
    try {
      console.log('  🎨 Exécution InDesign...');
      execSync(`osascript "${tempScript}"`, { timeout: 300000 });
      fs.unlinkSync(tempScript);
      
      // Attendre un peu que InDesign finisse
      setTimeout(() => {
        resolve({
          success: true,
          projectId,
          outputFile: path.join(WORK_DIR, 'output', `${projectId}.indd`)
        });
      }, 5000);
      
    } catch (error) {
      fs.unlinkSync(tempScript);
      reject(new Error(`Erreur InDesign: ${error.message}`));
    }
  });
}

// Créer le script JSX par défaut
function createDefaultScript(scriptPath) {
  const scriptsDir = path.dirname(scriptPath);
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  const jsxContent = `
// MagFlow InDesign Generation Script
#target indesign

function main() {
    var workDir = "${WORK_DIR.replace(/\\/g, '/')}";
    var configFile = new File(workDir + "/current_job.json");
    
    if (!configFile.exists) {
        alert("Config file not found: " + configFile.fsName);
        return;
    }
    
    configFile.open("r");
    var configText = configFile.read();
    configFile.close();
    
    // Parser le JSON (ExtendScript n'a pas JSON.parse natif)
    var config = eval("(" + configText + ")");
    
    alert("MagFlow Job reçu:\\nTemplate: " + config.template_name + "\\nTitre: " + config.titre);
    
    // Ouvrir le template
    var templatePath = config.template_path;
    var templateFile = new File(templatePath);
    
    if (!templateFile.exists) {
        alert("Template not found: " + templatePath);
        return;
    }
    
    var doc = app.open(templateFile);
    
    // Remplacer les placeholders
    if (config.titre) {
        app.findTextPreferences.findWhat = "{{TITRE}}";
        app.changeTextPreferences.changeTo = config.titre;
        doc.changeText();
    }
    
    if (config.chapo) {
        app.findTextPreferences.findWhat = "{{CHAPO}}";
        app.changeTextPreferences.changeTo = config.chapo;
        doc.changeText();
    }
    
    // Placer les images
    if (config.images && config.images.length > 0) {
        var rectangles = doc.rectangles;
        for (var i = 0; i < Math.min(config.images.length, rectangles.length); i++) {
            var imageFile = new File(config.images[i]);
            if (imageFile.exists) {
                rectangles[i].place(imageFile);
                rectangles[i].fit(FitOptions.PROPORTIONALLY);
            }
        }
    }
    
    // Sauvegarder
    var outputFolder = new Folder(workDir + "/output");
    if (!outputFolder.exists) outputFolder.create();
    
    var outputPath = outputFolder.fsName + "/" + config.project_id + ".indd";
    doc.save(new File(outputPath));
    
    alert("✅ Magazine généré: " + outputPath);
}

main();
`;
  
  fs.writeFileSync(scriptPath, jsxContent);
  console.log('📝 Script JSX créé:', scriptPath);
}

// Traiter un job
async function processJob(job) {
  console.log('\n📋 Nouveau job reçu:', job.id);
  console.log('  Template:', job.template_name || job.template_id);
  console.log('  Titre:', job.titre?.substring(0, 40) + '...');
  
  const projectDir = path.join(WORK_DIR, 'projects', job.id);
  fs.mkdirSync(projectDir, { recursive: true });
  
  try {
    // 1. Télécharger les images
    console.log('📥 Téléchargement des images...');
    const localImages = [];
    for (let i = 0; i < job.images.length; i++) {
      const imgUrl = job.images[i];
      const ext = path.extname(imgUrl) || '.jpg';
      const localPath = path.join(projectDir, `image_${i}${ext}`);
      const result = await downloadImage(imgUrl, localPath);
      if (result) localImages.push(result);
    }
    
    // 2. Créer le fichier de config pour InDesign
    const config = {
      project_id: job.id,
      template_path: job.template_path,
      template_name: job.template_name,
      titre: job.titre,
      chapo: job.chapo,
      images: localImages
    };
    
    const configPath = path.join(WORK_DIR, 'current_job.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    // 3. Exécuter InDesign
    const result = await executeInDesign(job.id, configPath);
    
    console.log('✅ Job terminé:', job.id);
    return { success: true, ...result };
    
  } catch (error) {
    console.error('❌ Erreur job:', error.message);
    return { success: false, error: error.message };
  }
}

// Connexion WebSocket
function connect() {
  console.log('\n🔌 Connexion au backend...');
  
  const socket = io(BACKEND_URL, {
    auth: { token: AGENT_TOKEN },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 5000
  });
  
  socket.on('connect', () => {
    console.log('✅ Connecté au backend');
    
    // S'enregistrer comme agent
    socket.emit('agent:register', {
      agentId: AGENT_ID,
      indesignVersion: INDESIGN_APP,
      platform: process.platform,
      hostname: require('os').hostname()
    });
  });
  
  socket.on('disconnect', (reason) => {
    console.log('❌ Déconnecté:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Erreur connexion:', error.message);
  });
  
  // Recevoir un job
  socket.on('job:new', async (job) => {
    const result = await processJob(job);
    socket.emit('job:complete', { jobId: job.id, ...result });
  });
  
  // Ping pour maintenir la connexion
  socket.on('ping', () => {
    socket.emit('pong', { agentId: AGENT_ID, timestamp: Date.now() });
  });
  
  return socket;
}

// Démarrage
console.log('\n🔍 Vérification InDesign...');
if (detectInDesign()) {
  console.log('✅ InDesign détecté');
  connect();
} else {
  console.log('⚠️  InDesign non détecté - Agent en mode démo');
  connect();
}

// Garder le processus actif
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt de l\'agent...');
  process.exit(0);
});
