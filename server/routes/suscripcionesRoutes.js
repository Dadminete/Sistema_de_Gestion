const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Utilidad: generar numeroContrato CT-YYYYMM-#### por mes (fechaInicio)
async function generarNumeroContrato(fechaInicio) {
  const start = new Date(fechaInicio);
  const period = `${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}`;
  const last = await prisma.suscripcion.findFirst({
    where: { numeroContrato: { startsWith: `CT-${period}-` } },
    orderBy: { numeroContrato: 'desc' }
  });
  let next = 1;
  if (last?.numeroContrato) {
    const parsed = parseInt(last.numeroContrato.split('-')[2]);
    if (!Number.isNaN(parsed)) next = parsed + 1;
  }
  return `CT-${period}-${String(next).padStart(4, '0')}`;
}

// GET /api/suscripciones
router.get('/', async (req, res) => {
  try {
    const suscripciones = await prisma.suscripcion.findMany({
      include: {
        cliente: true,
        servicio: true,
        plan: true,
        usuario: {
          select: { id: true, username: true, nombre: true, apellido: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(suscripciones);
  } catch (error) {
    console.error('Error fetching suscripciones:', error);
    res.status(500).json({ error: 'Failed to fetch suscripciones', message: error.message });
  }
});

// POST /api/suscripciones
router.post('/', async (req, res) => {
  try {
    const {
      clienteId,
      servicioId,
      planId,
      fechaInicio,
      fechaVencimiento,
      estado,
      precioMensual,
      descuentoAplicado,
      fechaProximoPago,
      diaFacturacion,
      notasInstalacion,
      notasServicio
    } = req.body || {};

    if (!clienteId) {
      return res.status(400).json({ error: 'clienteId es requerido' });
    }
    if (!fechaInicio) {
      return res.status(400).json({ error: 'fechaInicio es requerida' });
    }
    if (precioMensual === undefined || precioMensual === null) {
      return res.status(400).json({ error: 'precioMensual es requerido' });
    }

    const numeroContrato = await generarNumeroContrato(fechaInicio);

    const data = {
      numeroContrato,
      fechaInicio: new Date(fechaInicio),
      estado: (estado || 'pendiente').toLowerCase(),
      precioMensual: parseFloat(precioMensual),
      descuentoAplicado: descuentoAplicado !== undefined ? parseFloat(descuentoAplicado) : 0,
      diaFacturacion: diaFacturacion !== undefined ? parseInt(diaFacturacion) : 1,
      ...(fechaVencimiento ? { fechaVencimiento: new Date(fechaVencimiento) } : {}),
      ...(fechaProximoPago ? { fechaProximoPago: new Date(fechaProximoPago) } : {}),
      ...(notasInstalacion ? { notasInstalacion } : {}),
      ...(notasServicio ? { notasServicio } : {}),
      cliente: { connect: { id: clienteId } },
      ...(servicioId ? { servicio: { connect: { id: servicioId } } } : {}),
      ...(planId ? { plan: { connect: { id: BigInt(planId) } } } : {}),
      // usuario opcional: conectar si lo pasó el gateway (x-user-id) o si el middleware lo añadió en req.user
      ...((req.user?.id || req.user?.userId) ? { usuario: { connect: { id: (req.user.id || req.user.userId) } } } : {}),
    };

    const suscripcion = await prisma.suscripcion.create({
      data,
      include: { cliente: true, servicio: true, plan: true, usuario: true }
    });

    try {
      if (global.eventSystem) {
        global.eventSystem.emitEntityChange('suscripcion', 'create', suscripcion.id, {
          clienteId: suscripcion.clienteId,
          estado: suscripcion.estado,
          numeroContrato: suscripcion.numeroContrato,
          precioMensual: suscripcion.precioMensual
        });
      }
    } catch (_) {}

    res.status(201).json(suscripcion);
  } catch (error) {
    console.error('Error creating suscripcion:', error);
    res.status(500).json({ error: 'Error al crear suscripción', message: error.message });
  }
});

// PATCH /api/suscripciones/:id
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, fechaProximoPago, notasServicio, notasInstalacion } = req.body || {};

    const data = {
      ...(estado ? { estado: estado.toLowerCase() } : {}),
      ...(fechaProximoPago ? { fechaProximoPago: new Date(fechaProximoPago) } : {}),
      ...(notasServicio ? { notasServicio } : {}),
      ...(notasInstalacion ? { notasInstalacion } : {}),
    };

    const suscripcion = await prisma.suscripcion.update({ where: { id }, data });

    try {
      if (global.eventSystem) {
        global.eventSystem.emitEntityChange('suscripcion', 'update', suscripcion.id, {
          clienteId: suscripcion.clienteId,
          estado: suscripcion.estado
        });
      }
    } catch (_) {}

    res.json(suscripcion);
  } catch (error) {
    console.error('Error updating suscripcion status:', error);
    res.status(500).json({ error: 'Error al actualizar estado de suscripción' });
  }
});

// PUT /api/suscripciones/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.suscripcion.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    const {
      clienteId,
      servicioId,
      planId,
      usuarioId,
      numeroContrato,
      fechaInicio,
      fechaVencimiento,
      fechaInstalacion,
      estado,
      precioMensual,
      descuentoAplicado,
      fechaProximoPago,
      diaFacturacion,
      notasInstalacion,
      notasServicio
    } = req.body || {};

    const data = {
      ...(numeroContrato ? { numeroContrato } : {}),
      ...(fechaInicio ? { fechaInicio: new Date(fechaInicio) } : {}),
      ...(fechaVencimiento ? { fechaVencimiento: new Date(fechaVencimiento) } : {}),
      ...(fechaInstalacion ? { fechaInstalacion: new Date(fechaInstalacion) } : {}),
      ...(estado ? { estado: estado.toLowerCase() } : {}),
      ...(precioMensual !== undefined ? { precioMensual: parseFloat(precioMensual) } : {}),
      ...(descuentoAplicado !== undefined ? { descuentoAplicado: parseFloat(descuentoAplicado) } : {}),
      ...(fechaProximoPago ? { fechaProximoPago: new Date(fechaProximoPago) } : {}),
      ...(diaFacturacion !== undefined ? { diaFacturacion: parseInt(diaFacturacion) } : {}),
      ...(notasInstalacion ? { notasInstalacion } : {}),
      ...(notasServicio ? { notasServicio } : {}),
      ...(clienteId ? { cliente: { connect: { id: clienteId } } } : {}),
      ...(servicioId !== undefined ? (servicioId ? { servicio: { connect: { id: servicioId } } } : { servicio: { disconnect: true } }) : {}),
      ...(planId !== undefined ? (planId ? { plan: { connect: { id: BigInt(planId) } } } : { plan: { disconnect: true } }) : {}),
      ...(usuarioId !== undefined ? (usuarioId ? { usuario: { connect: { id: usuarioId } } } : { usuario: { disconnect: true } }) : {}),
    };

    const updated = await prisma.suscripcion.update({
      where: { id },
      data,
      include: { cliente: true, servicio: true, plan: true, usuario: true }
    });

    try {
      if (global.eventSystem) {
        global.eventSystem.emitEntityChange('suscripcion', 'update', updated.id, {
          clienteId: updated.clienteId,
          numeroContrato: updated.numeroContrato,
          precioMensual: updated.precioMensual
        });
      }
    } catch (_) {}

    res.json(updated);
  } catch (error) {
    console.error('Error updating suscripcion:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Suscripción no encontrada' });
    } else {
      res.status(500).json({ error: 'Error al actualizar suscripción' });
    }
  }
});

// DELETE /api/suscripciones/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await prisma.suscripcion.findUnique({ where: { id } });
    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    const equipmentCount = await prisma.equipoCliente.count({ where: { suscripcionId: id } });
    if (equipmentCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar la suscripción.',
        message: `Esta suscripción tiene ${equipmentCount} equipo(s) asociado(s). Por favor, reasigne o elimine los equipos antes de eliminar la suscripción.`
      });
    }

    const ticketCount = await prisma.ticket.count({ where: { suscripcionId: id } });
    if (ticketCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar la suscripción.',
        message: `Esta suscripción tiene ${ticketCount} ticket(s) asociado(s). Por favor, reasigne o elimine los tickets antes de eliminar la suscripción.`
      });
    }

    const invoiceCount = await prisma.facturaCliente.count({ where: { suscripcionId: id } });
    if (invoiceCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar la suscripción.',
        message: `Esta suscripción tiene ${invoiceCount} factura(s) asociada(s). Por favor, reasigne o elimine las facturas antes de eliminar la suscripción.`
      });
    }

    await prisma.suscripcion.delete({ where: { id } });

    try {
      if (global.eventSystem) {
        global.eventSystem.emitEntityChange('suscripcion', 'delete', id, { clienteId: subscription.clienteId });
      }
    } catch (_) {}

    res.json({ message: 'Suscripción eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting suscripcion:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Suscripción no encontrada' });
    } else {
      res.status(500).json({ error: 'Error al eliminar suscripción' });
    }
  }
});

module.exports = router;
