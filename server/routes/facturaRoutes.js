const express = require('express');
const router = express.Router();
const facturaService = require('../services/facturaService');
const { authenticateToken } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener estadísticas del dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const { año, mes } = req.query;
        const estadisticas = await facturaService.obtenerEstadisticas({
            año: año ? parseInt(año) : undefined,
            mes: mes ? parseInt(mes) : undefined
        });
        res.json(estadisticas);
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener pagos por mes
router.get('/pagos-mes/:anio', async (req, res) => {
    try {
        console.log('Endpoint /pagos-mes/:anio hit', req.params);
        const { anio } = req.params;
        const pagosPorMes = await facturaService.obtenerPagosPorMes(parseInt(anio));
        res.json(pagosPorMes);
    } catch (error) {
        console.error('Error al obtener pagos por mes:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener suscripciones de un cliente
router.get('/cliente/:clienteId/suscripciones', async (req, res) => {
    try {
        const { clienteId } = req.params;
        const suscripciones = await facturaService.obtenerSuscripcionesCliente(clienteId);
        res.json(suscripciones);
    } catch (error) {
        console.error('Error al obtener suscripciones:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generar número de factura
router.get('/generar-numero', async (req, res) => {
    try {
        const numeroFactura = await facturaService.generarNumeroFactura();
        res.json({ numeroFactura });
    } catch (error) {
        console.error('Error al generar número de factura:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener todas las facturas con filtros
router.get('/', async (req, res) => {
    try {
        const { estado, clienteId, fechaDesde, fechaHasta, page, limit } = req.query;
        const resultado = await facturaService.obtenerFacturas({
            estado,
            clienteId,
            fechaDesde,
            fechaHasta,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50
        });
        res.json(resultado);
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener factura por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const factura = await facturaService.obtenerFacturaPorId(id);

        if (!factura) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        res.json(factura);
    } catch (error) {
        console.error('Error al obtener factura:', error);
        res.status(500).json({ error: error.message });
    }
});

// Crear nueva factura
router.post('/', async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const factura = await facturaService.crearFactura({
            ...req.body,
            usuarioId
        });
        res.status(201).json(factura);
    } catch (error) {
        console.error('Error al crear factura:', error);
        res.status(500).json({ error: error.message });
    }
});

// Actualizar factura
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const factura = await facturaService.actualizarFactura(id, req.body);
        res.json(factura);
    } catch (error) {
        console.error('Error al actualizar factura:', error);
        res.status(500).json({ error: error.message });
    }
});

// Pagar factura
router.post('/:id/pagar', async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;
        const pago = await facturaService.pagarFactura(id, {
            ...req.body,
            usuarioId
        });
        res.json(pago);
    } catch (error) {
        console.error('Error al pagar factura:', error);
        res.status(500).json({ error: error.message });
    }
});

// Anular factura
router.post('/:id/anular', async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo } = req.body;
        const usuarioId = req.user.id;

        if (!motivo) {
            return res.status(400).json({ error: 'El motivo de anulación es requerido' });
        }

        await facturaService.anularFactura(id, usuarioId, motivo);
        res.json({ message: 'Factura anulada exitosamente' });
    } catch (error) {
        console.error('Error al anular factura:', error);
        res.status(500).json({ error: error.message });
    }
});

// Reactivar factura
router.post('/:id/reactivar', async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;

        await facturaService.reactivarFactura(id, usuarioId);
        res.json({ message: 'Factura reactivada exitosamente' });
    } catch (error) {
        console.error('Error al reactivar factura:', error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar factura individual
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await facturaService.eliminarFactura(id);
        res.json({ message: 'Factura eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar factura:', error);
        res.status(500).json({ error: error.message });
    }
});

// Eliminar facturas masivamente
router.post('/eliminar-masivo', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        const resultados = await facturaService.eliminarFacturas(ids);
        res.json(resultados);
    } catch (error) {
        console.error('Error al eliminar facturas:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
