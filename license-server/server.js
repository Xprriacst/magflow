import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import licensesRouter from './routes/licenses.js';
import activationRouter from './routes/activation.js';
import webhooksRouter from './routes/webhooks.js';

dotenv.config();

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(helmet());
app.use(cors());

app.use('/api/webhooks', webhooksRouter);

app.use(express.json({ limit: '1mb' }));
app.use(limiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime()
  });
});

app.use('/api/licenses', licensesRouter);
app.use('/api/licenses', activationRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

app.use((err, req, res, next) => {
  console.error('[license-server] Erreur non gérée:', err);
  res.status(500).json({ error: 'Erreur interne' });
});

const port = Number(process.env.PORT) || 3002;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`MagFlow License Server démarré sur le port ${port}`);
  });
}

export default app;
