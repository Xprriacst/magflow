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
import stripeRoutes from './routes/stripe.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Socket.io pour la communication avec les Desktop Agents
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store des agents connectés (userId -> socketId)
const connectedAgents = new Map();

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
  console.log('🔌 Agent connecté:', socket.id);
  
  // Enregistrement de l'agent
  socket.on('agent:register', (data) => {
    const { agentId, userId, platform, indesignVersion } = data;
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
  socket.on('job:status', (data) => {
    console.log(`📊 Job ${data.jobId}: ${data.status}`);
    // TODO: Mettre à jour en base de données
  });
  
  // Job terminé
  socket.on('job:complete', (data) => {
    console.log(`✅ Job ${data.jobId} terminé:`, data.success ? 'Succès' : 'Erreur');
    // TODO: Notifier le frontend, stocker le résultat
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
export function sendJobToAgent(userId, job) {
  const agent = connectedAgents.get(userId);
  if (agent) {
    io.to(agent.socketId).emit('job:generate', job);
    return true;
  }
  return false;
}

// Fonction pour vérifier si un agent est connecté
export function isAgentConnected(userId) {
  return connectedAgents.has(userId);
}

// Exposer io pour les routes
app.set('io', io);
app.set('connectedAgents', connectedAgents);

// Middleware
const devAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:4028'
];

function normalizeOrigin(origin) {
  if (!origin) return '';
  return origin.endsWith('/') ? origin.slice(0, -1) : origin;
}

const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter(Boolean);

const configuredOrigins = [process.env.FRONTEND_URL, ...envAllowedOrigins]
  .map((origin) => normalizeOrigin(origin))
  .filter(Boolean);

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? Array.from(new Set(configuredOrigins))
  : Array.from(new Set([...devAllowedOrigins, ...configuredOrigins]));

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    const isAllowed =
      allowedOrigins.includes(normalizedOrigin) ||
      /^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin) ||
      /^https?:\/\/localhost(?::\d+)?$/.test(origin);

    if (isAllowed) {
      return callback(null, true);
    }

    console.warn('[CORS] Origin not allowed:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Stripe webhook needs raw body - must be before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/content', contentRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/templates', templateUploadRoutes); // Upload routes under /api/templates
app.use('/api/magazine', magazineRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/stripe', stripeRoutes);

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
