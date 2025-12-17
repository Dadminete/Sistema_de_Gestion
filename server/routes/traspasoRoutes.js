const express = require('express');
const router = express.Router();
const traspasoService = require('../services/traspasoService');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * GET /api/traspasos
 * Obtener todos los traspasos con paginación
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;

        const result = await traspasoService.getAllTraspasos(page, limit);
        res.json(result);
    } catch (error) {
        console.error('Error al obtener traspasos:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/traspasos/:id
 * Obtener un traspaso por ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const traspaso = await traspasoService.getTraspasoById(id);

        if (!traspaso) {
            return res.status(404).json({ error: 'Traspaso no encontrado' });
        }

        res.json(traspaso);
    } catch (error) {
        console.error('Error al obtener traspaso:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/traspasos
 * Crear un nuevo traspaso
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const traspasoData = {
            ...req.body,
            autorizadoPorId: userId,
        };

        const traspaso = await traspasoService.createTraspaso(traspasoData);
        res.status(201).json(traspaso);
    } catch (error) {
        console.error('Error al crear traspaso:', error);
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/traspasos/filtro/fecha
 * Filtrar traspasos por rango de fechas
 */
router.get('/filtro/fecha', authenticateToken, async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({
                error: 'Se requieren fechaInicio y fechaFin'
            });
        }

        const traspasos = await traspasoService.getTraspasosByFecha(
            fechaInicio,
            fechaFin
        );
        res.json(traspasos);
    } catch (error) {
        console.error('Error al filtrar traspasos:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/traspasos/cuenta/:cuentaId/:tipo
 * Filtrar traspasos por cuenta (caja o banco)
 */
router.get('/cuenta/:cuentaId/:tipo', authenticateToken, async (req, res) => {
    try {
        const { cuentaId, tipo } = req.params;

        if (!['caja', 'banco'].includes(tipo)) {
            return res.status(400).json({
                error: 'El tipo debe ser "caja" o "banco"'
            });
        }

        const traspasos = await traspasoService.getTraspasosByCuenta(cuentaId, tipo);
        res.json(traspasos);
    } catch (error) {
        console.error('Error al filtrar traspasos por cuenta:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/traspasos/cuentas/cajas
 * Obtener todas las cajas activas
 */
router.get('/cuentas/cajas', authenticateToken, async (req, res) => {
    try {
        const cajas = await traspasoService.getCajasActivas();
        res.json(cajas);
    } catch (error) {
        console.error('Error al obtener cajas:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/traspasos/cuentas/bancos
 * Obtener todas las cuentas bancarias activas
 */
router.get('/cuentas/bancos', authenticateToken, async (req, res) => {
    try {
        const cuentas = await traspasoService.getCuentasBancariasActivas();
        res.json(cuentas);
    } catch (error) {
        console.error('Error al obtener cuentas bancarias:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
