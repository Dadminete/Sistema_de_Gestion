const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

// Función para manejar errores de Prisma
const handlePrismaError = (error) => {
  console.error('Error de Prisma:', error);
  if (error.code === 'P2002') {
    return { message: 'Este registro ya existe', code: error.code };
  }
  if (error.code === 'P2025') {
    return { message: 'Registro no encontrado', code: error.code };
  }
  return { message: error.message || 'Error interno del servidor' };
};

// Función para calcular días vencidos
const calcularDiasVencidos = (fechaVencimiento) => {
  const hoy = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diffTime = hoy - vencimiento;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Función para determinar el estado basado en días vencidos
const determinarEstado = (diasVencido, montoPendiente) => {
  if (montoPendiente <= 0) return 'pagada';
  if (diasVencido > 0) return 'vencida';
  return 'pendiente';
};

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// GET /api/contabilidad/cuentas-por-pagar - Obtener todas las cuentas por pagar
router.get('/', async (req, res) => {
  try {
    const {
      proveedorId,
      estado,
      fechaDesde,
      fechaHasta,
      montoMinimo,
      montoMaximo,
      diasVencidoDesde,
      diasVencidoHasta,
      page = 1,
      limit = 50
    } = req.query;

    const where = {
      AND: []
    };

    // Filtros
    if (proveedorId) {
      where.AND.push({ proveedorId });
    }

    if (estado) {
      where.AND.push({ estado });
    }

    if (fechaDesde || fechaHasta) {
      const fechaFiltro = {};
      if (fechaDesde) fechaFiltro.gte = new Date(fechaDesde);
      if (fechaHasta) fechaFiltro.lte = new Date(fechaHasta);
      where.AND.push({ fechaVencimiento: fechaFiltro });
    }

    if (montoMinimo || montoMaximo) {
      const montoFiltro = {};
      if (montoMinimo) montoFiltro.gte = parseFloat(montoMinimo);
      if (montoMaximo) montoFiltro.lte = parseFloat(montoMaximo);
      where.AND.push({ montoPendiente: montoFiltro });
    }

    if (diasVencidoDesde || diasVencidoHasta) {
      const diasFiltro = {};
      if (diasVencidoDesde) diasFiltro.gte = parseInt(diasVencidoDesde);
      if (diasVencidoHasta) diasFiltro.lte = parseInt(diasVencidoHasta);
      where.AND.push({ diasVencido: diasFiltro });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [cuentas, total] = await Promise.all([
      prisma.cuentaPorPagar.findMany({
        where: where.AND.length > 0 ? where : {},
        include: {
          proveedor: {
            select: {
              id: true,
              nombre: true,
              razonSocial: true,
              telefono: true,
              email: true
            }
          }
        },
        orderBy: { fechaVencimiento: 'desc' },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.cuentaPorPagar.count({
        where: where.AND.length > 0 ? where : {}
      })
    ]);

    // Actualizar días vencidos y estado para cada cuenta
    const cuentasActualizadas = cuentas.map(cuenta => {
      const diasVencido = calcularDiasVencidos(cuenta.fechaVencimiento);
      const estadoCalculado = determinarEstado(diasVencido, cuenta.montoPendiente);
      
      return {
        ...cuenta,
        diasVencido: diasVencido,
        estado: estadoCalculado
      };
    });

    res.json({
      data: cuentasActualizadas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener cuentas por pagar:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// GET /api/contabilidad/cuentas-por-pagar/dashboard/resumen - Resumen para dashboard
router.get('/dashboard/resumen', async (req, res) => {
  try {
    const [
      totalPorPagar,
      totalVencidas,
      totalProximasVencer,
      cuentasPendientes,
      cuentasVencidas
    ] = await Promise.all([
      // Total por pagar
      prisma.cuentaPorPagar.aggregate({
        _sum: { montoPendiente: true },
        where: { estado: { in: ['pendiente', 'vencida'] } }
      }),
      // Total vencidas
      prisma.cuentaPorPagar.aggregate({
        _sum: { montoPendiente: true },
        where: { estado: 'vencida' }
      }),
      // Total próximas a vencer (próximos 7 días)
      prisma.cuentaPorPagar.aggregate({
        _sum: { montoPendiente: true },
        where: {
          fechaVencimiento: {
            gte: new Date(),
            lte: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
          },
          estado: 'pendiente'
        }
      }),
      // Cantidad de cuentas pendientes
      prisma.cuentaPorPagar.count({
        where: { estado: 'pendiente' }
      }),
      // Cantidad de cuentas vencidas
      prisma.cuentaPorPagar.count({
        where: { estado: 'vencida' }
      })
    ]);

    const resumen = {
      totalPorPagar: totalPorPagar._sum.montoPendiente || 0,
      totalVencidas: totalVencidas._sum.montoPendiente || 0,
      totalProximasVencer: totalProximasVencer._sum.montoPendiente || 0,
      cuentasPendientes,
      cuentasVencidas
    };

    res.json(resumen);
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// GET /api/contabilidad/cuentas-por-pagar/vencidas - Cuentas vencidas
router.get('/vencidas', async (req, res) => {
  try {
    const cuentasVencidas = await prisma.cuentaPorPagar.findMany({
      where: { estado: 'vencida' },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            razonSocial: true,
            telefono: true,
            email: true
          }
        }
      },
      orderBy: { diasVencido: 'desc' }
    });

    res.json(cuentasVencidas);
  } catch (error) {
    console.error('Error al obtener cuentas vencidas:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// GET /api/contabilidad/cuentas-por-pagar/proximas-vencer - Próximas a vencer
router.get('/proximas-vencer', async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    const hoy = new Date();
    const fechaLimite = new Date(hoy.getTime() + (parseInt(dias) * 24 * 60 * 60 * 1000));

    const cuentasProximas = await prisma.cuentaPorPagar.findMany({
      where: {
        fechaVencimiento: { lte: fechaLimite, gte: hoy },
        estado: 'pendiente'
      },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            razonSocial: true,
            telefono: true,
            email: true
          }
        }
      },
      orderBy: { fechaVencimiento: 'asc' }
    });

    res.json(cuentasProximas);
  } catch (error) {
    console.error('Error al obtener cuentas próximas a vencer:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// GET /api/contabilidad/cuentas-por-pagar/:id - Obtener una cuenta específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const cuenta = await prisma.cuentaPorPagar.findUnique({
      where: { id },
      include: {
        proveedor: true
      }
    });

    if (!cuenta) {
      return res.status(404).json({ message: 'Cuenta por pagar no encontrada' });
    }

    // Actualizar días vencidos
    const diasVencido = calcularDiasVencidos(cuenta.fechaVencimiento);
    const estadoCalculado = determinarEstado(diasVencido, cuenta.montoPendiente);

    // Actualizar en la base de datos si es necesario
    if (cuenta.diasVencido !== diasVencido || cuenta.estado !== estadoCalculado) {
      await prisma.cuentaPorPagar.update({
        where: { id },
        data: {
          diasVencido: diasVencido,
          estado: estadoCalculado
        }
      });
    }

    res.json({
      ...cuenta,
      diasVencido: diasVencido,
      estado: estadoCalculado
    });
  } catch (error) {
    console.error('Error al obtener cuenta por pagar:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// POST /api/contabilidad/cuentas-por-pagar - Crear nueva cuenta por pagar
router.post('/', async (req, res) => {
  try {
    const {
      numeroDocumento,
      proveedorId,
      tipoDocumento,
      fechaEmision,
      fechaVencimiento,
      concepto,
      montoOriginal,
      moneda = 'DOP',
      observaciones
    } = req.body;

    // Validar campos requeridos
    if (!numeroDocumento || !fechaEmision || !fechaVencimiento || !concepto || !montoOriginal) {
      return res.status(400).json({
        message: 'Campos requeridos: numeroDocumento, fechaEmision, fechaVencimiento, concepto, montoOriginal'
      });
    }

    // Calcular días vencidos y estado inicial
    const diasVencido = calcularDiasVencidos(fechaVencimiento);
    const estado = determinarEstado(diasVencido, montoOriginal);

    const nuevaCuenta = await prisma.cuentaPorPagar.create({
      data: {
        numeroDocumento,
        proveedorId: proveedorId || null,
        tipoDocumento: tipoDocumento || 'factura',
        fechaEmision: new Date(fechaEmision),
        fechaVencimiento: new Date(fechaVencimiento),
        concepto,
        montoOriginal: parseFloat(montoOriginal),
        montoPendiente: parseFloat(montoOriginal),
        moneda,
        estado,
        diasVencido,
        observaciones
      },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            razonSocial: true,
            telefono: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(nuevaCuenta);
  } catch (error) {
    console.error('Error al crear cuenta por pagar:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// PUT /api/contabilidad/cuentas-por-pagar/:id - Actualizar cuenta por pagar
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Si se actualiza el monto original, actualizar también el monto pendiente
    if (updateData.montoOriginal) {
      const cuentaActual = await prisma.cuentaPorPagar.findUnique({
        where: { id }
      });

      if (!cuentaActual) {
        return res.status(404).json({ message: 'Cuenta por pagar no encontrada' });
      }

      // Calcular la diferencia y ajustar el monto pendiente
      const diferencia = parseFloat(updateData.montoOriginal) - cuentaActual.montoOriginal;
      updateData.montoPendiente = parseFloat(cuentaActual.montoPendiente) + diferencia;
      updateData.montoOriginal = parseFloat(updateData.montoOriginal);
    }

    // Recalcular días vencidos y estado si se actualiza la fecha de vencimiento
    if (updateData.fechaVencimiento) {
      const diasVencido = calcularDiasVencidos(updateData.fechaVencimiento);
      updateData.diasVencido = diasVencido;
      updateData.estado = determinarEstado(diasVencido, updateData.montoPendiente || 0);
      updateData.fechaVencimiento = new Date(updateData.fechaVencimiento);
    }

    if (updateData.fechaEmision) {
      updateData.fechaEmision = new Date(updateData.fechaEmision);
    }

    const cuentaActualizada = await prisma.cuentaPorPagar.update({
      where: { id },
      data: updateData,
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            razonSocial: true,
            telefono: true,
            email: true
          }
        }
      }
    });

    res.json(cuentaActualizada);
  } catch (error) {
    console.error('Error al actualizar cuenta por pagar:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// DELETE /api/contabilidad/cuentas-por-pagar/:id - Eliminar cuenta
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.cuentaPorPagar.delete({
      where: { id }
    });

    res.json({ message: 'Cuenta por pagar eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar cuenta por pagar:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// POST /api/contabilidad/cuentas-por-pagar/:id/pagar - Registrar pago
router.post('/:id/pagar', async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, fechaPago, metodoPago, numeroReferencia, observaciones } = req.body;

    if (!monto || !fechaPago || !metodoPago) {
      return res.status(400).json({
        message: 'Campos requeridos: monto, fechaPago, metodoPago'
      });
    }

    const cuenta = await prisma.cuentaPorPagar.findUnique({
      where: { id }
    });

    if (!cuenta) {
      return res.status(404).json({ message: 'Cuenta por pagar no encontrada' });
    }

    const montoPago = parseFloat(monto);

    if (montoPago > cuenta.montoPendiente) {
      return res.status(400).json({
        message: 'El monto del pago no puede ser mayor al monto pendiente'
      });
    }

    // Actualizar el monto pendiente
    const nuevoMontoPendiente = cuenta.montoPendiente - montoPago;
    const diasVencido = calcularDiasVencidos(cuenta.fechaVencimiento);
    const nuevoEstado = determinarEstado(diasVencido, nuevoMontoPendiente);

    const cuentaActualizada = await prisma.cuentaPorPagar.update({
      where: { id },
      data: {
        montoPendiente: nuevoMontoPendiente,
        estado: nuevoEstado,
        diasVencido
      },
      include: {
        proveedor: {
          select: {
            id: true,
            nombre: true,
            razonSocial: true,
            telefono: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Pago registrado correctamente',
      cuenta: cuentaActualizada,
      pago: {
        monto: montoPago,
        fechaPago,
        metodoPago,
        numeroReferencia,
        observaciones
      }
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

module.exports = router;