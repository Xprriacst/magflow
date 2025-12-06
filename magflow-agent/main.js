const { app, BrowserWindow, Tray, Menu, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const { io } = require('socket.io-client');
const Store = require('electron-store');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const store = new Store();
const BACKEND_URL = process.env.MAGFLOW_BACKEND || 'https://magflow.onrender.com';
const LOCAL_FLASK_PORT = 5003;

let mainWindow = null;
let tray = null;
let socket = null;
let isConnected = false;
let currentUser = null;

// Créer la fenêtre principale
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

// Créer l'icône dans la barre système
function createTray() {
  const trayIconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  // Utiliser l'icône par défaut si le fichier n'existe pas
  if (fs.existsSync(trayIconPath)) {
    tray = new Tray(trayIconPath);
  } else {
    // Créer un tray sans icône personnalisée (utilise icône par défaut)
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    if (fs.existsSync(iconPath)) {
      tray = new Tray(iconPath);
    } else {
      console.warn('[Agent] No tray icon found, skipping tray creation');
      return;
    }
  }
  
  updateTrayMenu();
  
  tray.on('click', () => {
    mainWindow.show();
  });
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: isConnected ? '✅ Connecté' : '❌ Déconnecté', 
      enabled: false 
    },
    { type: 'separator' },
    { 
      label: 'Ouvrir MagFlow Agent', 
      click: () => mainWindow.show() 
    },
    { 
      label: 'Ouvrir MagFlow Web', 
      click: () => shell.openExternal('https://magflow-app.netlify.app') 
    },
    { type: 'separator' },
    { 
      label: 'Quitter', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.setToolTip(isConnected ? 'MagFlow Agent - Connecté' : 'MagFlow Agent - Déconnecté');
}

// Connexion WebSocket au backend
function connectToBackend(token) {
  if (socket) {
    socket.disconnect();
  }

  socket = io(BACKEND_URL, {
    auth: { token },
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('✅ Connecté au backend MagFlow');
    isConnected = true;
    updateTrayMenu();
    mainWindow.webContents.send('connection-status', { connected: true });
    
    // Enregistrer cet agent
    socket.emit('agent:register', {
      agentId: store.get('agentId') || uuidv4(),
      userId: store.get('user')?.id,
      platform: process.platform,
      indesignVersion: detectInDesignVersion()
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ Déconnecté du backend');
    isConnected = false;
    updateTrayMenu();
    mainWindow.webContents.send('connection-status', { connected: false });
  });

  // Recevoir un job de génération
  socket.on('job:new', async (job) => {
    console.log('📥 Job reçu:', job.id);
    mainWindow.webContents.send('job-received', job);
    
    try {
      // Mettre à jour le statut
      socket.emit('job:status', { jobId: job.id, status: 'processing' });
      
      // Exécuter le job
      const result = await executeJob(job);
      
      // Envoyer le résultat
      socket.emit('job:complete', { 
        jobId: job.id, 
        success: true,
        result 
      });
      
      mainWindow.webContents.send('job-complete', { job, result });
      
    } catch (error) {
      console.error('❌ Erreur job:', error);
      socket.emit('job:complete', { 
        jobId: job.id, 
        success: false,
        error: error.message 
      });
      
      mainWindow.webContents.send('job-error', { job, error: error.message });
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
    mainWindow.webContents.send('error', error);
  });
}

// Détecter la version d'InDesign installée
function detectInDesignVersion() {
  try {
    if (process.platform === 'darwin') {
      const apps = fs.readdirSync('/Applications');
      const indesign = apps.find(app => app.includes('Adobe InDesign'));
      return indesign || 'Non détecté';
    } else if (process.platform === 'win32') {
      // Windows: chercher dans Program Files
      const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
      const adobeDir = path.join(programFiles, 'Adobe');
      if (fs.existsSync(adobeDir)) {
        const apps = fs.readdirSync(adobeDir);
        const indesign = apps.find(app => app.includes('InDesign'));
        return indesign || 'Non détecté';
      }
    }
    return 'Non détecté';
  } catch (error) {
    return 'Erreur détection';
  }
}

// Exécuter un job de génération
async function executeJob(job) {
  console.log('📋 Exécution job:', JSON.stringify(job, null, 2));
  
  const projectId = job.id;
  const titre = job.titre || 'Sans titre';
  const chapo = job.chapo || '';
  const images = job.images || [];
  const templateId = job.template_id;
  const templatePath = job.template_path;
  const templateName = job.template_name;
  const content = job.contentStructure?.corps_article || '';
  
  // Créer le dossier du projet
  const projectDir = path.join(app.getPath('temp'), 'magflow', projectId);
  fs.mkdirSync(projectDir, { recursive: true });
  
  // Télécharger les images
  const localImages = [];
  for (let i = 0; i < images.length; i++) {
    const imageUrl = images[i];
    const ext = path.extname(imageUrl) || '.jpg';
    const imagePath = path.join(projectDir, `image_${i + 1}${ext}`);
    
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(imagePath, response.data);
      localImages.push(imagePath);
      console.log('  ✅ Image téléchargée:', imagePath);
    } catch (err) {
      console.error('  ❌ Erreur téléchargement image:', err.message);
    }
  }
  
  // Créer le config.json pour le script InDesign
  const config = {
    project_id: projectId,
    prompt: titre,
    text_content: content,
    subtitle: chapo,
    images: localImages,
    template: templateName || templateId,
    template_path: templatePath,
    created_at: new Date().toISOString()
  };
  
  const configPath = path.join(projectDir, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('📝 Config créée:', configPath);
  
  // Exécuter le script InDesign via AppleScript (macOS)
  if (process.platform === 'darwin') {
    return executeInDesignMac(projectId, configPath);
  } else if (process.platform === 'win32') {
    return executeInDesignWindows(projectId, configPath);
  } else {
    throw new Error('Plateforme non supportée');
  }
}

// Exécuter InDesign sur macOS
function executeInDesignMac(projectId, configPath) {
  return new Promise((resolve, reject) => {
    const indesignApp = store.get('indesignApp') || 'Adobe InDesign 2026';
    
    // Créer un script JSX temporaire avec le chemin du config intégré
    const jsxScript = `
// MagFlow InDesign Script - Auto-generated
#target indesign

var CONFIG_PATH = "${configPath.replace(/\\/g, '/')}";

// Lire le fichier config
var configFile = new File(CONFIG_PATH);
if (!configFile.exists) {
    alert("MagFlow: Config non trouvé: " + CONFIG_PATH);
} else {
    configFile.open("r");
    var configText = configFile.read();
    configFile.close();
    
    // Parser le JSON (ExtendScript)
    var config;
    try {
        config = eval("(" + configText + ")");
    } catch(e) {
        alert("MagFlow: Erreur parsing config: " + e);
    }
    
    if (config && config.template_path) {
        // Ouvrir le template
        var templateFile = new File(config.template_path);
        if (templateFile.exists) {
            var doc = app.open(templateFile);
            
            // Remplacer les placeholders
            app.findTextPreferences = null;
            app.changeTextPreferences = null;
            
            if (config.prompt) {
                app.findTextPreferences.findWhat = "{{TITRE}}";
                app.changeTextPreferences.changeTo = config.prompt;
                doc.changeText();
            }
            
            if (config.subtitle) {
                app.findTextPreferences.findWhat = "{{CHAPO}}";
                app.changeTextPreferences.changeTo = config.subtitle;
                doc.changeText();
                
                app.findTextPreferences.findWhat = "{{SOUS-TITRE}}";
                app.changeTextPreferences.changeTo = config.subtitle;
                doc.changeText();
            }
            
            if (config.text_content) {
                app.findTextPreferences.findWhat = "{{ARTICLE}}";
                app.changeTextPreferences.changeTo = config.text_content;
                doc.changeText();
            }
            
            // Placer les images
            if (config.images && config.images.length > 0) {
                var rectangles = doc.rectangles;
                for (var i = 0; i < Math.min(config.images.length, rectangles.length); i++) {
                    try {
                        var imgFile = new File(config.images[i]);
                        if (imgFile.exists) {
                            rectangles[i].place(imgFile);
                            rectangles[i].fit(FitOptions.PROPORTIONALLY);
                            rectangles[i].fit(FitOptions.CENTER_CONTENT);
                        }
                    } catch(e) {}
                }
            }
            
            alert("✅ MagFlow: Magazine généré avec succès!");
        } else {
            alert("MagFlow: Template non trouvé: " + config.template_path);
        }
    }
}
`;
    
    const tempJsxPath = path.join(app.getPath('temp'), 'magflow_generate.jsx');
    fs.writeFileSync(tempJsxPath, jsxScript);
    
    const appleScript = `
tell application "${indesignApp}"
    activate
    do script POSIX file "${tempJsxPath}" language javascript
end tell
    `;
    
    const tempAppleScript = path.join(app.getPath('temp'), 'magflow_script.applescript');
    fs.writeFileSync(tempAppleScript, appleScript);
    
    console.log('🎨 Exécution InDesign...');
    const child = spawn('osascript', [tempAppleScript]);
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    
    child.on('close', (code) => {
      try { fs.unlinkSync(tempAppleScript); } catch(e) {}
      try { fs.unlinkSync(tempJsxPath); } catch(e) {}
      
      if (code === 0) {
        console.log('✅ InDesign terminé');
        const outputPath = path.join(app.getPath('temp'), 'magflow', 'output', `${projectId}.indd`);
        resolve({ outputPath, stdout });
      } else {
        console.error('❌ InDesign erreur:', stderr);
        reject(new Error(stderr || 'Erreur InDesign'));
      }
    });
  });
}

// Exécuter InDesign sur Windows
function executeInDesignWindows(projectId, configPath) {
  return new Promise((resolve, reject) => {
    // TODO: Implémenter pour Windows via COM/VBScript
    reject(new Error('Windows non encore supporté'));
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  
  // Générer un ID unique pour cet agent
  if (!store.get('agentId')) {
    store.set('agentId', uuidv4());
  }
  
  // IPC Handlers (doivent être après app.whenReady)
  ipcMain.handle('login', async (event, { email, password }) => {
    console.log('[Agent] Login attempt:', email);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });
      console.log('[Agent] Login response:', response.data);
      
      if (!response.data.success) {
        return { success: false, error: response.data.error || 'Erreur de connexion' };
      }
      
      const { token, user } = response.data;
      
      store.set('authToken', token);
      store.set('user', user);
      currentUser = user;
      
      connectToBackend(token);
      
      return { success: true, user };
    } catch (error) {
      console.error('[Agent] Login error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  });

  ipcMain.handle('logout', async () => {
    store.delete('authToken');
    store.delete('user');
    currentUser = null;
    
    if (socket) {
      socket.disconnect();
    }
    
    isConnected = false;
    updateTrayMenu();
    
    return { success: true };
  });

  ipcMain.handle('get-status', () => {
    return {
      connected: isConnected,
      user: store.get('user'),
      indesignVersion: detectInDesignVersion()
    };
  });

  ipcMain.handle('get-indesign-version', () => {
    return detectInDesignVersion();
  });

  ipcMain.handle('select-indesign', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      defaultPath: '/Applications',
      properties: ['openDirectory'],
      filters: [{ name: 'Applications', extensions: ['app'] }]
    });
    
    if (!result.canceled && result.filePaths[0]) {
      const appName = path.basename(result.filePaths[0], '.app');
      store.set('indesignApp', appName);
      return appName;
    }
    return null;
  });
  
  // Auto-connexion si token sauvegardé
  const savedToken = store.get('authToken');
  if (savedToken) {
    connectToBackend(savedToken);
  }
});

app.on('window-all-closed', () => {
  // Ne pas quitter sur macOS
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
