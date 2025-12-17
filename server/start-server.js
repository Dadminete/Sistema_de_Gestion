// Start server with better error handling
console.log('Starting server...');

try {
  require('dotenv').config();
  console.log('✓ Environment variables loaded');
  
  const express = require('express');
  console.log('✓ Express loaded');
  
  const cors = require('cors');
  console.log('✓ CORS loaded');
  
  const path = require('path');
  console.log('✓ Path loaded');
  
  console.log('Loading Prisma Client...');
  const { PrismaClient } = require('../node_modules/@prisma/client');
  console.log('✓ Prisma Client loaded');
  
  const { v4: uuidv4 } = require('uuid');
  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken');
  const rateLimit = require('express-rate-limit');
  const helmet = require('helmet');
  const crypto = require('crypto');
  console.log('✓ All dependencies loaded');

  const app = express();
  console.log('✓ Express app created');
  
  console.log('Initializing Prisma Client...');
  const prisma = new PrismaClient();
  console.log('✓ Prisma Client initialized');
  
  const PORT = process.env.PORT || 3001;

  // Fix BigInt serialization
  BigInt.prototype.toJSON = function() {
    return this.toString();
  };

  // Basic middleware
  app.use(cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://172.16.0.23:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check
  app.get('/health', async (req, res) => {
    try {
      console.log('Health check requested');
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({ status: 'unhealthy', error: error.message });
    }
  });

  // Simple categorías endpoint
  app.get('/api/categorias', async (req, res) => {
    try {
      console.log('Categorías endpoint called');
      const categorias = await prisma.categoria.findMany({
        orderBy: { createdAt: 'desc' }
      });
      console.log(`Found ${categorias.length} categorías`);
      res.json(categorias);
    } catch (error) {
      console.error('Error fetching categorías:', error);
      res.status(500).json({ error: 'Failed to fetch categorías', message: error.message });
    }
  });

  // Simple servicios endpoint
  app.get('/api/servicios', async (req, res) => {
    try {
      console.log('Servicios endpoint called');
      const servicios = await prisma.servicio.findMany({
        include: {
          categoria: {
            select: {
              id: true,
              nombre: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      console.log(`Found ${servicios.length} servicios`);
      res.json(servicios);
    } catch (error) {
      console.error('Error fetching servicios:', error);
      res.status(500).json({ error: 'Failed to fetch servicios', message: error.message });
    }
  });

  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://172.16.0.23:5173'}`);
    console.log(`📊 Available endpoints:`);
    console.log(`   - GET /health`);
    console.log(`   - GET /api/categorias`);
    console.log(`   - GET /api/servicios`);
  });

} catch (error) {
  console.error('❌ Failed to start server:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
