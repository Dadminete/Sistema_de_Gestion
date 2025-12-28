const express = require('express');
const router = express.Router();
const { PrismaClient, Prisma } = require('@prisma/client');
const CajaService = require('../services/cajaService');
const { CuentaContableService } = require('../services/cuentaContableService');
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
    // Calcular fechas del mes actual
    const now = new Date();
    const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      totalPorPagar,
      totalVencidas,
      totalProximasVencer,
      cuentasPendientes,
      cuentasVencidas,
      totalPagadoMes
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
      }),
      // Total pagado en el mes actual
      prisma.pagoCuentaPorPagar.aggregate({
        _sum: { monto: true },
        where: {
          fechaPago: {
            gte: primerDiaMes,
            lte: ultimoDiaMes
          }
        }
      })
    ]);

    const resumen = {
      totalPorPagar: totalPorPagar._sum.montoPendiente || 0,
      totalVencidas: totalVencidas._sum.montoPendiente || 0,
      totalProximasVencer: totalProximasVencer._sum.montoPendiente || 0,
      cuentasPendientes,
      cuentasVencidas,
      totalPagadoMes: totalPagadoMes._sum.monto || 0
    };

    // Calculate total monthly quotas
    const totalCuotasResult = await prisma.cuentaPorPagar.aggregate({
      _sum: { cuotaMensual: true },
      where: { estado: { in: ['pendiente', 'vencida'] } }
    });

    resumen.totalCuotasMensuales = totalCuotasResult._sum.cuotaMensual || 0;

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
      cuotaMensual,
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
        cuotaMensual: cuotaMensual ? parseFloat(cuotaMensual) : null,
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

    if (updateData.cuotaMensual) {
      updateData.cuotaMensual = parseFloat(updateData.cuotaMensual);
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
router.post('/:id/pagar', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { monto, fechaPago, metodoPago, numeroReferencia, observaciones, cajaId, cuentaBancariaId } = req.body;
  const userId = req.user.userId;

  try {
    const pago = await prisma.$transaction(async (tx) => {
      // 1. Verificar que la cuenta existe
      const cuenta = await tx.cuentaPorPagar.findUnique({
        where: { id },
        include: { proveedor: true }
      });

      if (!cuenta) {
        throw new Error('Cuenta por pagar no encontrada');
      }

      const montoPago = new Prisma.Decimal(monto);
      const nuevoSaldo = new Prisma.Decimal(cuenta.montoPendiente).minus(montoPago);

      if (nuevoSaldo.lessThan(0)) {
        throw new Error('El monto del pago excede el saldo pendiente');
      }

      // 2. Buscar categoría para el movimiento
      let categoria = await tx.categoriaCuenta.findFirst({
        where: {
          OR: [
            { nombre: { contains: 'Pago a Proveedores', mode: 'insensitive' } },
            { nombre: { contains: 'Cuentas por Pagar', mode: 'insensitive' } },
            { nombre: { contains: 'Gastos', mode: 'insensitive' } }
          ],
          tipo: 'gasto'
        }
      });

      if (!categoria) {
        categoria = await tx.categoriaCuenta.findFirst({ where: { tipo: 'gasto' } });
      }

      if (!categoria) {
        throw new Error('No se encontró una categoría de gasto válida para registrar el movimiento.');
      }

      // 3. Crear el registro del pago
      const nuevoPago = await tx.pagoCuentaPorPagar.create({
        data: {
          cuentaPorPagarId: id,
          monto: montoPago,
          fechaPago: new Date(fechaPago),
          metodoPago,
          numeroReferencia,
          observaciones,
          creadoPorId: userId
        }
      });

      // 4. Actualizar la cuenta por pagar
      const estado = nuevoSaldo.equals(0) ? 'pagada' : 'pendiente';
      await tx.cuentaPorPagar.update({
        where: { id },
        data: {
          montoPendiente: nuevoSaldo,
          estado,
          updatedAt: new Date()
        }
      });

      // 5. Crear Movimiento Contable (Gasto)
      if (metodoPago === 'caja' || metodoPago === 'banco' || metodoPago === 'papeleria') {
        if ((metodoPago === 'caja' && cajaId) || (metodoPago === 'banco' && cuentaBancariaId)) {
          await tx.movimientoContable.create({
            data: {
              descripcion: `Pago Factura Prov. ${cuenta.proveedor?.nombre || ''} - ${observaciones || 'Pago Cuentas por Pagar'}`,
              monto: montoPago,
              tipo: 'gasto',
              fecha: new Date(fechaPago),
              metodo: metodoPago,
              cajaId: cajaId || null,
              cuentaBancariaId: cuentaBancariaId || null,
              categoriaId: categoria.id,
              usuarioId: userId
            }
          });
        }
      }

      return nuevoPago;
    });

    // Post-transaction updates
    if (cajaId) {
      await CajaService.recalculateAndUpdateSaldo(cajaId);
    }
    if (cuentaBancariaId) {
      const cb = await prisma.cuentaBancaria.findUnique({ where: { id: cuentaBancariaId } });
      if (cb && cb.cuentaContableId) {
        await CuentaContableService.recalculateAndUpdateSaldo(cb.cuentaContableId);
      }
    }

    res.json(pago);
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contabilidad/cuentas-por-pagar/:id/pagos - Obtener historial de pagos
router.get('/:id/pagos', async (req, res) => {
  try {
    const { id } = req.params;

    const pagos = await prisma.pagoCuentaPorPagar.findMany({
      where: { cuentaPorPagarId: id },
      include: {
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            username: true
          }
        }
      },
      orderBy: { fechaPago: 'desc' }
    });

    res.json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

module.exports = router;