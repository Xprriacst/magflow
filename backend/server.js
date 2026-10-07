import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import contentRoutes from './routes/content.js';
import templatesRoutes from './routes/templates.js';
import templateUploadRoutes from './routes/templateUpload.js';
import magazineRoutes from './routes/magazine.js';
import uploadRoutes from './routes/upload.js';
import authRoutes from './routes/auth.js';
import { supabase, isSupabaseConfigured } from './services/supabaseClient.js';
import { sendJobToAgent, isAgentConnected } from './services/jobDispatcher.js';
import { authenticateAgentSocket, parseAllowedOrigins, requireUserAuth } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

const devAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:4028'
];
const configuredOrigins = parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS);
const allowedOrigins = configuredOrigins.length > 0
  ? configuredOrigins
  : (process.env.NODE_ENV === 'production' ? [] : devAllowedOrigins);

function corsOrigin(origin, callback) {
  if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
  console.warn('[CORS] Origin not allowed:', origin);
  return callback(new Error('Not allowed by CORS'));
}

// Socket.io pour la communication avec les Desktop Agents
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  }
});
io.use(authenticateAgentSocket);

// Store des agents connectés (userId -> socketId)
const connectedAgents = new Map();

async function updateGeneration(jobId, changes) {
  if (!isSupabaseConfigured || !supabase || !jobId) return;

  const { error } = await supabase
    .from('magazine_generations')
    .update(changes)
    .eq('id', jobId);

  if (error) {
    console.error(`[Jobs] Impossible de mettre à jour ${jobId}:`, error);
  }
}

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
  console.log('🔌 Agent connecté:', socket.id);
  
  // Enregistrement de l'agent
  socket.on('agent:register', (data = {}) => {
    const { agentId, platform, indesignVersion } = data;
    const userId = socket.auth?.userId || data.userId || null;
    if (!agentId) {
      socket.emit('agent:error', { error: 'agentId is required' });
      return;
    }
    console.log(`✅ Agent enregistré: ${agentId} (${platform}, ${indesignVersion})`);
    
    // Stocker l'agent par agentId (et aussi par userId si disponible)
    connectedAgents.set(agentId, {
      socketId: socket.id,
      agentId,
      userId,
      platform,
      indesignVersion,
      connectedAt: new Date()
    });
    
    socket.agentId = agentId;
    socket.userId = userId;
  });
  
  // Mise à jour du statut d'un job
  socket.on('job:status', async (data = {}) => {
    console.log(`📊 Job ${data.jobId}: ${data.status}`);
    if (data.status === 'processing') {
      await updateGeneration(data.jobId, { status: 'processing' });
    }
  });
  
  // Job terminé
  socket.on('job:complete', async (data = {}) => {
    console.log(`✅ Job ${data.jobId} terminé:`, data.success ? 'Succès' : 'Erreur');
    await updateGeneration(data.jobId, data.success ? {
      status: 'completed',
      flask_project_id: data.projectId || null,
      completed_at: new Date().toISOString(),
      error_message: null
    } : {
      status: 'error',
      error_message: data.error || 'Erreur de rendu inconnue',
      completed_at: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Agent déconnecté:', socket.id);
    // Ne supprimer que si c'est bien le même socket (évite de supprimer un agent reconnecté)
    if (socket.agentId) {
      const agent = connectedAgents.get(socket.agentId);
      if (agent && agent.socketId === socket.id) {
        connectedAgents.delete(socket.agentId);
      }
    }
  });
});

// Fonction pour envoyer un job à un agent
export function dispatchJobToAgent(agentId, job) {
  return sendJobToAgent(io, connectedAgents, agentId, job);
}

// Fonction pour vérifier si un agent est connecté
export function hasConnectedAgent(agentId) {
  return isAgentConnected(connectedAgents, agentId);
}

// Exposer io pour les routes
app.set('io', io);
app.set('connectedAgents', connectedAgents);
app.set('sendJobToAgent', dispatchJobToAgent);

// Middleware
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', requireUserAuth, express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', requireUserAuth);
app.use('/api/content', contentRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/templates', templateUploadRoutes); // Upload routes under /api/templates
app.use('/api/magazine', magazineRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server with WebSocket support
httpServer.listen(PORT, () => {
  console.log(`\n🚀 MagFlow Backend démarré`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}\n`);
});

export default app;
