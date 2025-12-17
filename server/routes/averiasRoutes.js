const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const averiasService = require('../services/averiasService');

// Stats del día (requiere auth)
router.get('/stats/hoy', authenticateToken, async (req, res) => {
  try {
    const stats = await averiasService.getAveriasStatsHoy();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching averias stats:', error);
    // Responder seguro para no romper el frontend
    res.status(200).json({ total: 0, pendientes: 0, proceso: 0, resueltos: 0 });
  }
});

// Stats por rango personalizado: ?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/stats/range', authenticateToken, async (req, res) => {
  try {
    const { from, to } = req.query || {};
    if (!from || !to) return res.status(400).json({ error: 'Parámetros from y to son requeridos' });
    const data = await averiasService.getAveriasStatsRange(from, to);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching range stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas por rango' });
  }
});

// Agrupaciones por rango personalizado
router.get('/aggregations/range', authenticateToken, async (req, res) => {
  try {
    const { from, to } = req.query || {};
    if (!from || !to) return res.status(400).json({ error: 'Parámetros from y to son requeridos' });
    const data = await averiasService.getAveriasAggregationsRange(from, to);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching range aggregations:', error);
    res.status(500).json({ error: 'Error al obtener agrupaciones por rango' });
  }
});

// Stats del mes en curso
router.get('/stats/mes', authenticateToken, async (req, res) => {
  try {
    const raw = (req.query && req.query.offset) || '0';
    let offset = parseInt(Array.isArray(raw) ? raw[0] : String(raw), 10);
    if (Number.isNaN(offset)) offset = 0;
    const stats = await averiasService.getAveriasStatsMes(offset);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching monthly averias stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas mensuales de averías' });
  }
});

// Agrupaciones del mes por categoría y prioridad
router.get('/aggregations/mes', authenticateToken, async (req, res) => {
  try {
    const raw = (req.query && req.query.offset) || '0';
    let offset = parseInt(Array.isArray(raw) ? raw[0] : String(raw), 10);
    if (Number.isNaN(offset)) offset = 0;
    const data = await averiasService.getAveriasAggregationsMes(offset);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching monthly aggregations:', error);
    res.status(500).json({ error: 'Error al obtener agrupaciones mensuales de averías' });
  }
});

// Top clientes con más averías
router.get('/stats/top-clients', authenticateToken, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const data = await averiasService.getTopClients(limit);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching top clients:', error);
    res.status(500).json({ error: 'Error al obtener top clientes' });
  }
});

// Estadísticas por técnico
router.get('/stats/technicians', authenticateToken, async (req, res) => {
  try {
    const data = await averiasService.getTechnicianStats();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching technician stats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de técnicos' });
  }
});

// Listado de averías (tickets)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const averias = await averiasService.getAllAverias();
    res.status(200).json(averias);
  } catch (error) {
    console.error('Error fetching all averias:', error);
    res.status(500).json({ error: 'Error al obtener todas las averías' });
  }
});

// Obtener avería por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const item = await averiasService.getById(id);
    if (!item) return res.status(404).json({ error: 'Avería no encontrada' });
    res.status(200).json(item);
  } catch (error) {
    console.error('Error fetching averia by id:', error);
    res.status(500).json({ error: 'Error al obtener la avería' });
  }
});

// Actualizar avería
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await averiasService.update(id, req.body);
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error updating averia:', error);
    res.status(500).json({ error: 'Error al actualizar la avería' });
  }
});

// Eliminar avería
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await averiasService.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting averia:', error);
    res.status(500).json({ error: 'Error al eliminar la avería' });
  }
});

// Cerrar avería (cambia estado a 'resuelto')
router.post('/:id/cerrar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { mensaje, imagenUrl, estado } = req.body || {};
    const result = await require('../prismaClient').$transaction(async (tx) => {
      // Crear respuesta de ticket (bitácora de cierre)
      const resp = await tx.respuestaTicket.create({
        data: {
          ticketId: id,
          usuarioId: req.user?.id || req.user?.userId, // desde token
          mensaje: mensaje || 'Ticket cerrado',
          esInterno: false,
          ...(imagenUrl ? { imagenUrl } : {}),
        }
      });

      // Marcar ticket como resuelto con fechaCierre
      const updateData = {
        ...(estado ? { estado } : {}),
        ...(estado === 'resuelto' ? { fechaCierre: new Date() } : {}),
      };
      const updated = await tx.ticket.update({
        where: { id },
        data: updateData,
      });

      return { updated, respuesta: resp };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error closing averia:', error);
    res.status(500).json({ error: 'Error al cerrar la avería' });
  }
});

module.exports = router;
