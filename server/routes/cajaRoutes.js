const express = require('express');
const router = express.Router();
const { CajaService } = require('../services/cajaService');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

// Obtener todas las cajas
router.get('/', async (req, res) => {
  try {
    const cajas = await CajaService.getAll();
    res.json(cajas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// NUEVA RUTA: Obtener datos consolidados para el dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { filter, customMonth } = req.query;
    const data = await CajaService.getDashboardStats(filter, customMonth);
    res.json(data);
  } catch (error) {
    console.error('Error en /api/cajas/dashboard:', error);
    res.status(500).json({ message: error.message });
  }
});

// NUEVA RUTA: Obtener resumen financiero para gráfica
router.get('/dashboard/financial-summary', async (req, res) => {
  try {
    const data = await CajaService.getFinancialSummary();
    res.json(data);
  } catch (error) {
    console.error('Error en /api/cajas/dashboard/financial-summary:', error);
    res.status(500).json({ message: error.message });
  }
});

// NUEVA RUTA: Obtener fuentes de ingreso top
router.get('/dashboard/top-sources', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await CajaService.getTopIncomeSources(startDate, endDate);
    res.json(data);
  } catch (error) {
    console.error('Error en /api/cajas/dashboard/top-sources:', error);
    res.status(500).json({ message: error.message });
  }
});

// NUEVA RUTA: Obtener transacciones recientes
router.get('/dashboard/recent-transactions', async (req, res) => {
  try {
    const { limit } = req.query;
    const data = await CajaService.getRecentTransactions(limit ? parseInt(limit) : 10);
    res.json(data);
  } catch (error) {
    console.error('Error en /api/cajas/dashboard/recent-transactions:', error);
    res.status(500).json({ message: error.message });
  }
});


// NUEVA RUTA: Obtener análisis de ahorro personalizado
router.get('/dashboard/savings-analysis', async (req, res) => {
  try {
    const data = await CajaService.getSavingsAnalysis();
    res.json(data);
  } catch (error) {
    console.error('Error en /api/cajas/dashboard/savings-analysis:', error);
    res.status(500).json({ message: error.message });
  }
});


// Obtener una caja específica
router.get('/:id', async (req, res) => {
  try {
    const caja = await CajaService.getById(req.params.id);
    if (!caja) {
      return res.status(404).json({ message: 'Caja no encontrada' });
    }
    res.json(caja);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Crear nueva caja
router.post('/', async (req, res) => {
  try {
    const newCaja = await CajaService.create(req.body);
    res.status(201).json(newCaja);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Actualizar caja
router.put('/:id', async (req, res) => {
  try {
    const updatedCaja = await CajaService.update(req.params.id, req.body);
    res.json(updatedCaja);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Eliminar caja
router.delete('/:id', async (req, res) => {
  try {
    await CajaService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener balance de una caja
router.get('/:id/balance', async (req, res) => {
  try {
    const balance = await CajaService.getBalance(req.params.id);
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Apertura de caja
router.post('/apertura', async (req, res) => {
  try {
    const apertura = await CajaService.abrirCaja(req.body);
    res.status(201).json(apertura);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cierre de caja
router.post('/cierre', async (req, res) => {
  try {
    const cierre = await CajaService.cerrarCaja(req.body);
    res.status(201).json(cierre);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Obtener movimientos de una caja
router.get('/:id/movimientos', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const movimientos = await CajaService.getMovimientos(req.params.id, fechaInicio, fechaFin);
    res.json(movimientos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener historial de aperturas y cierres
router.get('/:id/historial', async (req, res) => {
  try {
    const historial = await CajaService.getHistorial(req.params.id);
    res.json(historial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener estadísticas de una caja
router.get('/:id/estadisticas', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    const estadisticas = await CajaService.getEstadisticasCaja(req.params.id, fechaInicio, fechaFin);
    res.json(estadisticas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/resumen-diario', async (req, res) => {
  try {
    const { fecha } = req.query;
    const resumen = await CajaService.getResumenDiario(req.params.id, fecha);
    res.json(resumen);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id/ultima-apertura', async (req, res) => {
  try {
    const apertura = await CajaService.getUltimaApertura(req.params.id);
    res.json(apertura);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/saldo-inicial', authenticateToken, async (req, res) => {
  try {
    const { cuentaContableId, monto } = req.body;
    if (!cuentaContableId || monto === undefined) {
      return res.status(400).json({ message: 'Se requieren cuentaContableId y monto' });
    }

    // Authorization logic
    const user = req.user;
    const isAdmin = user.roles.includes('Administrador');
    const isAssistant = user.roles.includes('Asistente');
    const isAccountant = user.roles.includes('Contable');

    let isAllowed = false;
    if (isAdmin) {
      isAllowed = true;
    } else if (isAssistant || isAccountant) {
      const today = new Date();
      const isFirstDay = today.getDate() === 1;
      const cajas = await CajaService.getAll();
      const needsSetup = cajas.some(caja => caja.saldoInicial === 0);
      if (isFirstDay || needsSetup) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return res.status(403).json({ message: 'No tiene permiso para realizar esta acción en este momento.' });
    }

    const usuarioId = req.user.id;
    const updatedCaja = await CajaService.setSaldoInicial(cuentaContableId, parseFloat(monto), usuarioId);
    res.json(updatedCaja);
  } catch (error) {
    console.error('Error en /api/cajas/saldo-inicial:', error);
    res.status(400).json({ message: error.message || 'Error al actualizar el saldo inicial' });
  }
});

module.exports = router;
