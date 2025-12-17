const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error'], // Solo errores en producción
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Configuración optimizada para Neon
  __internal: {
    engine: {
      connectTimeoutMs: 20000, // 20 segundos timeout
      requestTimeoutMs: 30000, // 30 segundos para queries
    },
  },
});

// Manejo de desconexión elegante
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;
