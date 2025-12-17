const express = require('express');
const router = express.Router();
const commissionService = require('../services/commissionService');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ============ COMMISSION TYPES ROUTES ============

// GET /api/commissions/types - Get all commission types
router.get('/types', async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const types = await commissionService.getCommissionTypes(includeInactive);
        res.json(types);
    } catch (error) {
        console.error('Error getting commission types:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/commissions/types - Create a new commission type
router.post('/types', async (req, res) => {
    try {
        console.log('[Commission Routes] POST /types with data:', req.body);
        const newType = await commissionService.createCommissionType(req.body);
        res.status(201).json(newType);
    } catch (error) {
        console.error('Error creating commission type:', error);
        if (error.message.includes('requerido') || error.message.includes('válido')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
});

// PUT /api/commissions/types/:id - Update a commission type
router.put('/types/:id', async (req, res) => {
    try {
        const updated = await commissionService.updateCommissionType(req.params.id, req.body);
        res.json(updated);
    } catch (error) {
        console.error('Error updating commission type:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Tipo de comisión no encontrado' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
});

// DELETE /api/commissions/types/:id - Delete (deactivate) a commission type
router.delete('/types/:id', async (req, res) => {
    try {
        const deleted = await commissionService.deleteCommissionType(req.params.id);
        res.json({ message: 'Tipo de comisión desactivado exitosamente', data: deleted });
    } catch (error) {
        console.error('Error deleting commission type:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Tipo de comisión no encontrado' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
});

// ============ COMMISSIONS ROUTES ============

// GET /api/commissions/stats - Get commission statistics
router.get('/stats', async (req, res) => {
    try {
        const { year, month } = req.query;
        const stats = await commissionService.getStatistics(year, month);
        res.json(stats);
    } catch (error) {
        console.error('Error getting commission stats:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET /api/commissions/employee/:employeeId - Get commissions for a specific employee
router.get('/employee/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { year, month } = req.query;
        const commissions = await commissionService.getEmployeeCommissions(employeeId, year, month);
        res.json(commissions);
    } catch (error) {
        console.error('Error getting employee commissions:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET /api/commissions/:id - Get a single commission by ID
router.get('/:id', async (req, res) => {
    try {
        const commission = await commissionService.getCommissionById(req.params.id);
        if (!commission) {
            return res.status(404).json({ error: 'Comisión no encontrada' });
        }
        res.json(commission);
    } catch (error) {
        console.error('Error getting commission:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET /api/commissions - Get all commissions with optional filters
router.get('/', async (req, res) => {
    try {
        const filters = {
            empleadoId: req.query.empleadoId,
            tipoComisionId: req.query.tipoComisionId,
            periodoAno: req.query.periodoAno,
            periodoMes: req.query.periodoMes,
            estado: req.query.estado
        };

        console.log('[Commission Service] Fetching commissions with filters:', filters);
        const commissions = await commissionService.getCommissions(filters);
        console.log('[Commission Service] Successfully fetched', commissions.length, 'commissions');
        res.json(commissions);
    } catch (error) {
        console.error('[Commission Service] Error getting commissions:', error);
        console.error('[Commission Service] Error stack:', error.stack);
        console.error('[Commission Service] Request query:', req.query);
        res.status(500).json({
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// POST /api/commissions/calculate - Calculate commission amount
router.post('/calculate', async (req, res) => {
    try {
        const { tipoComisionId, montoBase } = req.body;

        if (!tipoComisionId || !montoBase) {
            return res.status(400).json({ error: 'Tipo de comisión y monto base son requeridos' });
        }

        const calculation = await commissionService.calculateCommission(tipoComisionId, montoBase);
        res.json(calculation);
    } catch (error) {
        console.error('Error calculating commission:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
});

// POST /api/commissions - Create a new commission
router.post('/', async (req, res) => {
    try {
        console.log('[Commission Service] Creating commission with data:', JSON.stringify(req.body, null, 2));
        
        // Validaciones básicas antes de procesar
        const { empleadoId, tipoComisionId, montoBase, montoComision, porcentajeAplicado, periodoAno, periodoMes } = req.body;
        
        if (!empleadoId || !tipoComisionId || montoBase === undefined || 
            montoComision === undefined || porcentajeAplicado === undefined || 
            !periodoAno || !periodoMes) {
            return res.status(400).json({ 
                error: 'Faltan campos requeridos para crear la comisión' 
            });
        }

        const newCommission = await commissionService.createCommission(req.body);
        console.log('[Commission Service] Commission created successfully:', newCommission.id);
        res.status(201).json(newCommission);
    } catch (error) {
        console.error('Error creating commission:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
});

// PUT /api/commissions/:id/pay - Mark commission as paid
router.put('/:id/pay', async (req, res) => {
    try {
        console.log('[Commission Routes] PUT /:id/pay called with:', {
            id: req.params.id,
            body: req.body,
            userId: req.user?.id
        });
        
        const { fechaPago } = req.body;
        const usuarioId = req.user?.id; // Obtener ID del usuario autenticado
        const updated = await commissionService.markAsPaid(req.params.id, fechaPago, usuarioId);
        res.json(updated);
    } catch (error) {
        console.error('Error marking commission as paid:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Comisión no encontrada' });
        } else if (error.message.includes('no encontrada') || 
                   error.message.includes('ya está marcada') ||
                   error.message.includes('inválido')) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
        }
    }
});

// PUT /api/commissions/:id - Update a commission
router.put('/:id', async (req, res) => {
    try {
        const updated = await commissionService.updateCommission(req.params.id, req.body);
        res.json(updated);
    } catch (error) {
        console.error('Error updating commission:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Comisión no encontrada' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
});

// DELETE /api/commissions/:id - Delete a commission
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await commissionService.deleteCommission(req.params.id);
        res.json({ message: 'Comisión eliminada exitosamente', data: deleted });
    } catch (error) {
        console.error('Error deleting commission:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Comisión no encontrada' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
});

module.exports = router;
