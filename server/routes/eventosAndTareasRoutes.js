const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/authMiddleware');

// ========== EVENTOS ENDPOINTS ==========

/**
 * GET /api/eventos
 * Obtener todos los eventos
 */
router.get('/eventos', authenticateToken, async (req, res) => {
  try {
    const { start, end, limit = '100' } = req.query;
    
    // Construir filtros de fecha si se proporcionan
    let whereClause = {};
    if (start && end) {
      whereClause.fechaInicio = {
        gte: new Date(start),
        lte: new Date(end)
      };
    } else if (start) {
      whereClause.fechaInicio = {
        gte: new Date(start)
      };
    } else if (end) {
      whereClause.fechaInicio = {
        lte: new Date(end)
      };
    }

    const eventos = await prisma.evento.findMany({
      where: whereClause,
      orderBy: { fechaInicio: 'asc' },
      take: parseInt(limit) // Limitar resultados para mejorar rendimiento
    });

    res.json(eventos);
  } catch (error) {
    console.error('Error fetching eventos:', error);
    res.status(500).json({ error: 'Error al obtener eventos', message: error.message });
  }
});

/**
 * GET /api/eventos/:id
 * Obtener evento por ID
 */
router.get('/eventos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const evento = await prisma.evento.findUnique({
      where: { id }
    });

    if (!evento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    res.json(evento);
  } catch (error) {
    console.error('Error fetching evento:', error);
    res.status(500).json({ error: 'Error al obtener evento', message: error.message });
  }
});

/**
 * POST /api/eventos
 * Crear nuevo evento
 */
router.post('/eventos', authenticateToken, async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      fechaInicio,
      fechaFin,
      todoElDia,
      color,
      ubicacion,
      creadoPorId
    } = req.body;

    // Validación básica
    if (!titulo || !fechaInicio) {
      return res.status(400).json({ error: 'Título y fecha de inicio son requeridos' });
    }

    const evento = await prisma.evento.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : new Date(new Date(fechaInicio).getTime() + 60 * 60 * 1000),
        todoElDia: todoElDia || false,
        color: color || '#3788d8',
        ubicacion: ubicacion || null,
        creadoPorId: creadoPorId || req.user.id
      }
    });

    console.log('✅ Evento creado exitosamente:', evento.id);
    res.status(201).json(evento);
  } catch (error) {
    console.error('Error creating evento:', error);
    res.status(500).json({ error: 'Error al crear evento', message: error.message });
  }
});

/**
 * PUT /api/eventos/:id
 * Actualizar evento
 */
router.put('/eventos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      fechaInicio,
      fechaFin,
      todoElDia,
      color,
      ubicacion
    } = req.body;

    // Verificar que el evento exista
    const existingEvento = await prisma.evento.findUnique({
      where: { id }
    });

    if (!existingEvento) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const evento = await prisma.evento.update({
      where: { id },
      data: {
        titulo: titulo !== undefined ? titulo : undefined,
        descripcion: descripcion !== undefined ? descripcion : undefined,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        fechaFin: fechaFin ? new Date(fechaFin) : undefined,
        todoElDia: todoElDia !== undefined ? todoElDia : undefined,
        color: color !== undefined ? color : undefined,
        ubicacion: ubicacion !== undefined ? ubicacion : undefined
      }
    });

    console.log('✅ Evento actualizado exitosamente:', id);
    res.json(evento);
  } catch (error) {
    console.error('Error updating evento:', error);
    res.status(500).json({ error: 'Error al actualizar evento', message: error.message });
  }
});

/**
 * DELETE /api/eventos/:id
 * Eliminar evento (ya existe, pero lo dejamos aquí por coherencia)
 */
router.delete('/eventos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Server: Deleting event with ID:', id);

    const existingEvent = await prisma.evento.findUnique({
      where: { id }
    });

    if (!existingEvent) {
      console.log('❌ Server: Event not found in database:', id);
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    console.log('✅ Server: Event found, proceeding with deletion:', existingEvent);

    await prisma.evento.delete({
      where: { id }
    });

    console.log('✅ Server: Event deleted successfully:', id);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Server: Error deleting event:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    res.status(500).json({ error: 'Error al eliminar evento', message: error.message });
  }
});

// ========== TAREAS ENDPOINTS ==========

/**
 * GET /api/tareas
 * Obtener todas las tareas
 */
router.get('/tareas', authenticateToken, async (req, res) => {
  try {
    const tareas = await prisma.tarea.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json(tareas);
  } catch (error) {
    console.error('Error fetching tareas:', error);
    res.status(500).json({ error: 'Error al obtener tareas', message: error.message });
  }
});

/**
 * GET /api/tareas/:creadoPorId
 * Obtener tareas por usuario (del mes actual)
 */
router.get('/tareas/:creadoPorId', authenticateToken, async (req, res) => {
  try {
    const { creadoPorId } = req.params;

    const tareas = await prisma.tarea.findMany({
      where: { creadoPorId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tareas);
  } catch (error) {
    console.error('Error fetching tareas:', error);
    res.status(500).json({ error: 'Error al obtener tareas', message: error.message });
  }
});

/**
 * POST /api/tareas
 * Crear nueva tarea
 */
router.post('/tareas', authenticateToken, async (req, res) => {
  try {
    const {
      titulo,
      descripcion,
      color,
      creadoPorId
    } = req.body;

    // Validación básica
    if (!titulo) {
      return res.status(400).json({ error: 'El título es requerido' });
    }

    const tarea = await prisma.tarea.create({
      data: {
        titulo,
        descripcion: descripcion || null,
        color: color || '#5d4f73',
        creadoPorId: creadoPorId || req.user.id
      }
    });

    console.log('✅ Tarea creada exitosamente:', tarea.id);
    res.status(201).json(tarea);
  } catch (error) {
    console.error('Error creating tarea:', error);
    res.status(500).json({ error: 'Error al crear tarea', message: error.message });
  }
});

/**
 * PUT /api/tareas/:id
 * Actualizar tarea
 */
router.put('/tareas/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descripcion,
      color
    } = req.body;

    // Verificar que la tarea exista
    const existingTarea = await prisma.tarea.findUnique({
      where: { id }
    });

    if (!existingTarea) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const tarea = await prisma.tarea.update({
      where: { id },
      data: {
        titulo: titulo !== undefined ? titulo : undefined,
        descripcion: descripcion !== undefined ? descripcion : undefined,
        color: color !== undefined ? color : undefined
      }
    });

    console.log('✅ Tarea actualizada exitosamente:', id);
    res.json(tarea);
  } catch (error) {
    console.error('Error updating tarea:', error);
    res.status(500).json({ error: 'Error al actualizar tarea', message: error.message });
  }
});

/**
 * PATCH /api/tareas/:id/completar
 * Toggle task completion status
 */
router.patch('/tareas/:id/completar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { completada } = req.body;

    // Verificar que la tarea exista
    const existingTarea = await prisma.tarea.findUnique({
      where: { id }
    });

    if (!existingTarea) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    const tarea = await prisma.tarea.update({
      where: { id },
      data: { completada }
    });

    console.log(`✅ Tarea ${completada ? 'completada' : 'marcada como pendiente'}:`, id);
    res.json(tarea);
  } catch (error) {
    console.error('Error toggling task completion:', error);
    res.status(500).json({ error: 'Error al actualizar estado de tarea', message: error.message });
  }
});

/**
 * DELETE /api/tareas/:id
 * Eliminar tarea
 */
router.delete('/tareas/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting tarea with ID:', id);

    // Try to delete the task. If it doesn't exist, Prisma will throw P2025
    await prisma.tarea.delete({
      where: { id }
    });

    console.log('✅ Tarea deleted successfully:', id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting tarea:', error);
    if (error.code === 'P2025') {
      // Task doesn't exist, but that's okay - the goal was to delete it
      console.log('ℹ️ Task was already deleted or never existed:', id);
      res.status(204).send();
    } else {
      res.status(500).json({ error: 'Error al eliminar tarea', message: error.message });
    }
  }
});

module.exports = router;
