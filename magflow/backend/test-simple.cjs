const express = require('express');
const app = express();
const PORT = 3001;

app.get('/health', (req, res) => {
  console.log('✅ Health check');
  res.json({ status: 'ok' });
});

console.log('🔄 Starting...');
app.listen(PORT, () => {
  console.log(`✅ Server on port ${PORT}`);
});
