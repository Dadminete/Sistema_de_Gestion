// Simple test server to verify Node.js is working
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/categorias', (req, res) => {
  console.log('Categorias endpoint called');
  res.json([
    { id: 1, nombre: 'Test Category', descripcion: 'Test description' }
  ]);
});

app.get('/api/servicios', (req, res) => {
  console.log('Servicios endpoint called');
  res.json([
    { id: 1, nombre: 'Test Service', descripcion: 'Test service description' }
  ]);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on http://0.0.0.0:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`- GET /health`);
  console.log(`- GET /api/categorias`);
  console.log(`- GET /api/servicios`);
});
