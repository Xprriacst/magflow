import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  console.log('✅ Health check called');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

console.log('🔄 Starting server...');
app.listen(PORT, () => {
  console.log(`\n🚀 Test Server started on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}/health\n`);
}).on('error', (err) => {
  console.error('❌ Server error:', err);
});
