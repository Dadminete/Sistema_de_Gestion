const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Health check básico
router.get('/health', async (req, res) => {
  try {
    const start = Date.now();
    
    // Test simple de conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    
    const dbTime = Date.now() - start;
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        responseTime: `${dbTime}ms`
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        connected: false
      }
    });
  }
});

// Diagnóstico de rendimiento para cajas
router.get('/performance/cajas', async (req, res) => {
  try {
    const start = Date.now();
    
    // Contar cajas total
    const totalCajas = await prisma.caja.count();
    const countTime = Date.now() - start;
    
    const start2 = Date.now();
    // Query simple sin includes
    const cajasSimple = await prisma.caja.findMany({
      select: { id: true, nombre: true, saldoActual: true },
      take: 5
    });
    const simpleTime = Date.now() - start2;
    
    const start3 = Date.now();
    // Query con includes (como el endpoint actual)
    const cajasCompletas = await prisma.caja.findMany({
      include: {
        responsable: {
          select: { id: true, nombre: true, apellido: true }
        }
      },
      take: 5
    });
    const fullTime = Date.now() - start3;
    
    res.json({
      totalCajas,
      performance: {
        count: `${countTime}ms`,
        simple: `${simpleTime}ms`,
        withIncludes: `${fullTime}ms`
      },
      samples: {
        simple: cajasSimple,
        full: cajasCompletas
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Diagnóstico de rendimiento para eventos
router.get('/performance/eventos', async (req, res) => {
  try {
    const start = Date.now();
    
    // Contar eventos total
    const totalEventos = await prisma.evento.count();
    const countTime = Date.now() - start;
    
    const start2 = Date.now();
    // Query limitada
    const eventosLimited = await prisma.evento.findMany({
      orderBy: { fechaInicio: 'asc' },
      take: 10
    });
    const limitedTime = Date.now() - start2;
    
    const start3 = Date.now();
    // Query sin límite (como el endpoint original)
    const eventosAll = await prisma.evento.findMany({
      orderBy: { fechaInicio: 'asc' }
    });
    const allTime = Date.now() - start3;
    
    res.json({
      totalEventos,
      performance: {
        count: `${countTime}ms`,
        limited: `${limitedTime}ms (10 registros)`,
        all: `${allTime}ms (todos los registros)`
      },
      dataSize: {
        limited: eventosLimited.length,
        all: eventosAll.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;