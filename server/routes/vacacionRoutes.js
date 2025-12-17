const express = require('express');
const router = express.Router();
const { VacacionService } = require('../services/vacacionService');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware de autenticación global para estas rutas
router.use(authenticateToken);

// Obtener tipos de vacaciones activos
router.get('/tipos', async (req, res) => {
    try {
        const tipos = await VacacionService.getAllTipos();
        res.json(tipos);
    } catch (error) {
        console.error('Error fetching vacation types:', error);
        res.status(500).json({ error: 'Failed to fetch vacation types' });
    }
});

// Obtener periodos (balances) de un empleado
router.get('/periodos/:empleadoId', async (req, res) => {
    try {
        const periodos = await VacacionService.getPeriodosByEmpleado(req.params.empleadoId);
        res.json(periodos);
    } catch (error) {
        console.error('Error fetching vacation periods:', error);
        res.status(500).json({ error: 'Failed to fetch vacation periods' });
    }
});

// Obtener historial de solicitudes de un empleado
router.get('/solicitudes/:empleadoId', async (req, res) => {
    try {
        const solicitudes = await VacacionService.getSolicitudesByEmpleado(req.params.empleadoId);
        res.json(solicitudes);
    } catch (error) {
        console.error('Error fetching vacation requests:', error);
        res.status(500).json({ error: 'Failed to fetch vacation requests' });
    }
});

// Obtener todas las solicitudes pendientes (Solo RRHH/Admin)
router.get('/admin/solicitudes-pendientes', async (req, res) => {
    try {
        // Aquí idealmente verificaríamos permisos de rol "Admin" o "RRHH"
        const solicitudes = await VacacionService.getPendingSolicitudes();
        res.json(solicitudes);
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        res.status(500).json({ error: 'Failed to fetch pending requests' });
    }
});

// Obtener todos los periodos (balances) - Solo Admin/RRHH
router.get('/admin/periodos', async (req, res) => {
    try {
        const periodos = await VacacionService.getAllPeriodos();
        res.json(periodos);
    } catch (error) {
        console.error('Error fetching all vacation periods:', error);
        res.status(500).json({ error: 'Failed to fetch vacation periods' });
    }
});

// Asignar periodo (balance) a empleado
router.post('/admin/asignar-periodo', async (req, res) => {
    try {
        const nuevoPeriodo = await VacacionService.assignPeriodo(req.body);
        res.status(201).json(nuevoPeriodo);
    } catch (error) {
        console.error('Error assigning vacation period:', error);
        // Check for unique constraint violation
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'El empleado ya tiene asignado este tipo de vacaciones para este año.' });
        }
        res.status(500).json({ error: 'Failed to assign vacation period' });
    }
});

// Crear nueva solicitud
router.post('/solicitar', async (req, res) => {
    try {
        const nuevaSolicitud = await VacacionService.createSolicitud(req.body);
        res.status(201).json(nuevaSolicitud);
    } catch (error) {
        console.error('Error creating vacation request:', error);
        res.status(500).json({ error: 'Failed to create vacation request' });
    }
});

// Actualizar estado (Aprobar/Rechazar)
router.patch('/solicitudes/:id/estado', async (req, res) => {
    try {
        const { estado, aprobadoPorId, observaciones } = req.body;
        const result = await VacacionService.updateSolicitudStatus(req.params.id, estado, aprobadoPorId, observaciones);
        res.json(result);
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ error: 'Failed to update request status' });
    }
});

// Editar solicitud (Solo si está pendiente)
router.put('/solicitudes/:id', async (req, res) => {
    try {
        const result = await VacacionService.updateSolicitud(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
});

// Eliminar solicitud
router.delete('/solicitudes/:id', async (req, res) => {
    try {
        const result = await VacacionService.deleteSolicitud(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ error: 'Failed to delete request' });
    }
});

module.exports = router;
