const express = require('express');
const router = express.Router();
const bankService = require('../services/bankService');
const cuentaBancariaService = require('../services/cuentaBancariaService');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware de autenticación para todas las rutas
// TEMPORAL: Deshabilitado para testing
// router.use(authenticateToken);

// Debug: Log all requests hitting bankRoutes
router.use((req, res, next) => {
  console.log(`[bankRoutes] ${req.method} ${req.originalUrl} -> ${req.path}`);
  next();
});

// Rutas para Bancos (Instituciones Financieras)

// GET /api/banks/stats/monthly - Obtener estadísticas mensuales
router.get('/stats/monthly', async (req, res) => {
  try {
    const stats = await bankService.getMonthlyStats();
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas mensuales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/banks - Obtener todos los bancos
router.get('/', async (req, res) => {
  try {
    const banks = await bankService.getAllBanks();
    res.json(banks);
  } catch (error) {
    console.error('Error al obtener bancos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/banks/:id - Obtener un banco por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bank = await bankService.getBankById(id);
    if (!bank) {
      return res.status(404).json({ error: 'Banco no encontrado' });
    }
    res.json(bank);
  } catch (error) {
    console.error('Error al obtener banco:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/banks - Crear un nuevo banco
router.post('/', async (req, res) => {
  try {
    const bankData = req.body;
    const newBank = await bankService.createBank(bankData);
    res.status(201).json(newBank);
  } catch (error) {
    console.error('Error al crear banco:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'El código del banco ya existe' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// PUT /api/banks/:id - Actualizar un banco
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedBank = await bankService.updateBank(id, updateData);
    if (!updatedBank) {
      return res.status(404).json({ error: 'Banco no encontrado' });
    }
    res.json(updatedBank);
  } catch (error) {
    console.error('Error al actualizar banco:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'El código del banco ya existe' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// DELETE /api/banks/:id - Eliminar un banco
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await bankService.deleteBank(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Banco no encontrado' });
    }
    res.json({ message: 'Banco eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar banco:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Rutas para Cuentas Bancarias

// GET /api/banks/:bankId/accounts - Obtener cuentas de un banco
router.get('/:bankId/accounts', async (req, res) => {
  try {
    const { bankId } = req.params;
    const accounts = await cuentaBancariaService.getAccountsByBankId(bankId);
    res.json(accounts);
  } catch (error) {
    console.error('Error al obtener cuentas bancarias:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/banks/:bankId/client-payments - Obtener pagos de clientes por banco
router.get('/:bankId/client-payments', async (req, res) => {
  try {
    const { bankId } = req.params;
    const payments = await bankService.getClientPaymentsByBank(bankId);
    res.json(payments);
  } catch (error) {
    console.error('Error al obtener pagos de clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/banks/accounts/:id - Obtener una cuenta bancaria por ID
router.get('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const account = await cuentaBancariaService.getAccountById(id);
    if (!account) {
      return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
    }
    res.json(account);
  } catch (error) {
    console.error('Error al obtener cuenta bancaria:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/banks/:bankId/accounts - Crear una nueva cuenta bancaria
router.post('/:bankId/accounts', async (req, res) => {
  try {
    const { bankId } = req.params;
    const accountData = { ...req.body, bankId };
    const newAccount = await cuentaBancariaService.createAccount(accountData);
    res.status(201).json(newAccount);
  } catch (error) {
    console.error('Error al crear cuenta bancaria:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'El número de cuenta ya existe' });
    } else {
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }
});

// PUT /api/banks/accounts/:id - Actualizar una cuenta bancaria
router.put('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedAccount = await cuentaBancariaService.updateAccount(id, updateData);
    if (!updatedAccount) {
      return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
    }
    res.json(updatedAccount);
  } catch (error) {
    console.error('Error al actualizar cuenta bancaria:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'El número de cuenta ya existe' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
});

// DELETE /api/banks/accounts/:id - Eliminar una cuenta bancaria
router.delete('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await cuentaBancariaService.deleteAccount(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
    }
    res.json({ message: 'Cuenta bancaria eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar cuenta bancaria:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;