const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Middleware para manejar errores de Prisma
const handlePrismaError = (error) => {
  console.error('Prisma Error:', error);
  if (error.code === 'P2002') {
    return { message: 'Ya existe un registro con estos datos únicos', code: 'DUPLICATE_ENTRY' };
  }
  if (error.code === 'P2025') {
    return { message: 'Registro no encontrado', code: 'NOT_FOUND' };
  }
  return { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' };
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

// GET /api/contabilidad/cuentas-por-cobrar - Obtener todas las cuentas por cobrar
router.get('/', async (req, res) => {
  try {
    const {
      clienteId,
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
    if (clienteId) {
      where.AND.push({ clienteId: clienteId });
    }

    if (estado) {
      where.AND.push({ estado: estado });
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

    // Si no hay filtros AND, remover la condición
    if (where.AND.length === 0) {
      delete where.AND;
    }

    const [cuentas, total] = await Promise.all([
      prisma.cuentaPorCobrar.findMany({
        where,
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              email: true
            }
          },
          factura: {
            select: {
              numeroFactura: true,
              tipoFactura: true
            }
          }
        },
        orderBy: [
          { diasVencido: 'desc' },
          { fechaVencimiento: 'asc' }
        ],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      }),
      prisma.cuentaPorCobrar.count({ where })
    ]);

    // Actualizar días vencidos y estado para cada cuenta
    const cuentasActualizadas = await Promise.all(
      cuentas.map(async (cuenta) => {
        const diasVencido = calcularDiasVencidos(cuenta.fechaVencimiento);
        const estadoCalculado = determinarEstado(diasVencido, cuenta.montoPendiente);

        // Actualizar en BD si es diferente
        if (cuenta.diasVencido !== diasVencido || cuenta.estado !== estadoCalculado) {
          await prisma.cuentaPorCobrar.update({
            where: { id: cuenta.id },
            data: {
              diasVencido: diasVencido,
              estado: estadoCalculado
            }
          });
        }

        return {
          ...cuenta,
          diasVencido: diasVencido,
          estado: estadoCalculado
        };
      })
    );

    res.json({
      data: cuentasActualizadas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// GET /api/contabilidad/cuentas-por-cobrar/dashboard/resumen - Resumen para dashboard
router.get('/dashboard/resumen', async (req, res) => {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    // Usar el primer día del mes siguiente para incluir todo el mes actual con operador lt
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
    const proximosSieteDias = new Date(hoy.getTime() + (7 * 24 * 60 * 60 * 1000));

    const [
      totalPorCobrar,
      totalVencidas,
      totalProximasVencer,
      totalCobradas,
      cuentasPendientes,
      cuentasVencidas,
      promedioTiempoCobro
    ] = await Promise.all([
      // Total por cobrar (pendientes + vencidas)
      prisma.cuentaPorCobrar.aggregate({
        where: {
          estado: { 'in': ['pendiente', 'vencida', 'parcial'] }
        },
        _sum: { montoPendiente: true }
      }),

      // Total vencidas
      prisma.cuentaPorCobrar.aggregate({
        where: { estado: 'vencida' },
        _sum: { montoPendiente: true }
      }),

      // Total próximas a vencer (próximos 7 días)
      prisma.cuentaPorCobrar.aggregate({
        where: {
          fechaVencimiento: { lte: proximosSieteDias, gte: hoy },
          estado: 'pendiente'
        },
        _sum: { montoPendiente: true }
      }),

      // Total cobradas este mes - Sumar pagos confirmados del mes
      prisma.pagoCliente.aggregate({
        where: {
          estado: 'confirmado',
          fechaPago: { gte: inicioMes, lt: finMes }
        },
        _sum: { monto: true }
      }),

      // Conteo de cuentas pendientes
      prisma.cuentaPorCobrar.count({
        where: {
          estado: { 'in': ['pendiente', 'parcial'] }
        }
      }),

      // Conteo de cuentas vencidas
      prisma.cuentaPorCobrar.count({
        where: { estado: 'vencida' }
      }),

      // Promedio tiempo de cobro (simulado por ahora)
      Promise.resolve(25) // Implementar cálculo real después
    ]);

    const resumen = {
      totalPorCobrar: totalPorCobrar._sum.montoPendiente || 0,
      totalVencidas: totalVencidas._sum.montoPendiente || 0,
      totalProximasVencer: totalProximasVencer._sum.montoPendiente || 0,
      totalCobradas: totalCobradas._sum.monto || 0,
      cuentasPendientes,
      cuentasVencidas,
      promedioTiempoCobro
    };

    res.json(resumen);
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// GET /api/contabilidad/cuentas-por-cobrar/analytics/edad-cartera - Análisis de edad de cartera
router.get('/analytics/edad-cartera', async (req, res) => {
  try {
    const cuentas = await prisma.cuentaPorCobrar.findMany({
      where: {
        estado: { in: ['pendiente', 'vencida', 'parcial'] }
      },
      select: {
        diasVencido: true,
        montoPendiente: true
      }
    });

    const edadCartera = {
      alDia: { count: 0, monto: 0 },
      dias1a30: { count: 0, monto: 0 },
      dias31a60: { count: 0, monto: 0 },
      dias61a90: { count: 0, monto: 0 },
      mas90dias: { count: 0, monto: 0 }
    };

    cuentas.forEach(cuenta => {
      const dias = cuenta.diasVencido;
      const monto = parseFloat(cuenta.montoPendiente);

      if (dias <= 0) {
        edadCartera.alDia.count++;
        edadCartera.alDia.monto += monto;
      } else if (dias <= 30) {
        edadCartera.dias1a30.count++;
        edadCartera.dias1a30.monto += monto;
      } else if (dias <= 60) {
        edadCartera.dias31a60.count++;
        edadCartera.dias31a60.monto += monto;
      } else if (dias <= 90) {
        edadCartera.dias61a90.count++;
        edadCartera.dias61a90.monto += monto;
      } else {
        edadCartera.mas90dias.count++;
        edadCartera.mas90dias.monto += monto;
      }
    });

    res.json(edadCartera);
  } catch (error) {
    console.error('Error al obtener edad de cartera:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// GET /api/contabilidad/cuentas-por-cobrar/vencidas - Cuentas vencidas
router.get('/vencidas', async (req, res) => {
  try {
    const cuentasVencidas = await prisma.cuentaPorCobrar.findMany({
      where: { estado: 'vencida' },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
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

// GET /api/contabilidad/cuentas-por-cobrar/proximas-vencer - Próximas a vencer
router.get('/proximas-vencer', async (req, res) => {
  try {
    const { dias = 7 } = req.query;
    const hoy = new Date();
    const fechaLimite = new Date(hoy.getTime() + (parseInt(dias) * 24 * 60 * 60 * 1000));

    const cuentasProximas = await prisma.cuentaPorCobrar.findMany({
      where: {
        fechaVencimiento: { lte: fechaLimite, gte: hoy },
        estado: 'pendiente'
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
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

// GET /api/contabilidad/cuentas-por-cobrar/alertas - Obtener alertas
router.get('/alertas', async (req, res) => {
  try {
    const hoy = new Date();
    const proximosSieteDias = new Date(hoy.getTime() + (7 * 24 * 60 * 60 * 1000));

    const [vencidas, proximasVencer, morosos] = await Promise.all([
      prisma.cuentaPorCobrar.count({
        where: { estado: 'vencida' }
      }),
      prisma.cuentaPorCobrar.count({
        where: {
          fechaVencimiento: { lte: proximosSieteDias, gte: hoy },
          estado: 'pendiente'
        }
      }),
      prisma.cuentaPorCobrar.count({
        where: {
          diasVencido: { gt: 60 },
          estado: 'vencida'
        }
      })
    ]);

    const alertas = [];

    if (vencidas > 0) {
      alertas.push({
        tipo: 'critica',
        titulo: 'Cuentas Vencidas',
        descripcion: 'Tienes cuentas por cobrar vencidas que requieren seguimiento inmediato',
        cantidad: vencidas
      });
    }

    if (proximasVencer > 0) {
      alertas.push({
        tipo: 'advertencia',
        titulo: 'Próximas a Vencer',
        descripcion: 'Cuentas que vencen en los próximos 7 días',
        cantidad: proximasVencer
      });
    }

    if (morosos > 0) {
      alertas.push({
        tipo: 'critica',
        titulo: 'Clientes Morosos',
        descripcion: 'Clientes con más de 60 días de atraso',
        cantidad: morosos
      });
    }

    res.json(alertas);
  } catch (error) {
    console.error('Error al obtener alertas:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// GET /api/contabilidad/cuentas-por-cobrar/:id - Obtener una cuenta específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const cuenta = await prisma.cuentaPorCobrar.findUnique({
      where: { id },
      include: {
        cliente: true,
        factura: true
      }
    });

    if (!cuenta) {
      return res.status(404).json({ message: 'Cuenta por cobrar no encontrada' });
    }

    // Actualizar días vencidos
    const diasVencido = calcularDiasVencidos(cuenta.fechaVencimiento);
    const estadoCalculado = determinarEstado(diasVencido, cuenta.montoPendiente);

    if (cuenta.diasVencido !== diasVencido || cuenta.estado !== estadoCalculado) {
      await prisma.cuentaPorCobrar.update({
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
    console.error('Error al obtener cuenta por cobrar:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// POST /api/contabilidad/cuentas-por-cobrar - Crear nueva cuenta por cobrar
router.post('/', async (req, res) => {
  try {
    const {
      numeroDocumento,
      clienteId,
      facturaId,
      fechaEmision,
      fechaVencimiento,
      montoOriginal,
      moneda = 'DOP',
      observaciones
    } = req.body;

    // Validaciones
    if (!numeroDocumento || !clienteId || !fechaEmision || !fechaVencimiento || !montoOriginal) {
      return res.status(400).json({
        message: 'Campos requeridos: numeroDocumento, clienteId, fechaEmision, fechaVencimiento, montoOriginal'
      });
    }

    // Calcular días vencidos y estado
    const diasVencido = calcularDiasVencidos(fechaVencimiento);
    const estado = determinarEstado(diasVencido, montoOriginal);

    const nuevaCuenta = await prisma.cuentaPorCobrar.create({
      data: {
        numeroDocumento,
        clienteId,
        facturaId: facturaId || null,
        fechaEmision: new Date(fechaEmision),
        fechaVencimiento: new Date(fechaVencimiento),
        montoOriginal: parseFloat(montoOriginal),
        montoPendiente: parseFloat(montoOriginal),
        moneda,
        estado,
        diasVencido,
        observaciones
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            telefono: true,
            email: true
          }
        },
        factura: {
          select: {
            numeroFactura: true,
            tipoFactura: true
          }
        }
      }
    });

    res.status(201).json(nuevaCuenta);
  } catch (error) {
    console.error('Error al crear cuenta por cobrar:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// POST /api/contabilidad/cuentas-por-cobrar/:id/pagos - Registrar pago
router.post('/:id/pagos', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      monto,
      fechaPago,
      metodoPago,
      numeroReferencia,
      observaciones
    } = req.body;

    if (!monto || !fechaPago || !metodoPago) {
      return res.status(400).json({
        message: 'Campos requeridos: monto, fechaPago, metodoPago'
      });
    }

    // Verificar que la cuenta existe
    const cuenta = await prisma.cuentaPorCobrar.findUnique({
      where: { id },
      include: { cliente: true }
    });

    if (!cuenta) {
      return res.status(404).json({ message: 'Cuenta por cobrar no encontrada' });
    }

    const montoPago = parseFloat(monto);

    if (montoPago > cuenta.montoPendiente) {
      return res.status(400).json({
        message: 'El monto del pago no puede ser mayor al monto pendiente'
      });
    }

    // Usar transacción para registrar el pago y actualizar la cuenta
    const resultado = await prisma.$transaction(async (prisma) => {
      // Crear el pago
      const pago = await prisma.pagoCliente.create({
        data: {
          numeroPago: `PAG-${Date.now()}`, // Generar número único
          clienteId: cuenta.clienteId,
          facturaId: cuenta.facturaId,
          fechaPago: new Date(fechaPago),
          monto: montoPago,
          moneda: cuenta.moneda,
          metodoPago,
          numeroReferencia,
          observaciones,
          estado: 'confirmado'
        }
      });

      // Actualizar la cuenta por cobrar
      const nuevoMontoPendiente = cuenta.montoPendiente - montoPago;
      const diasVencido = calcularDiasVencidos(cuenta.fechaVencimiento);
      const nuevoEstado = determinarEstado(diasVencido, nuevoMontoPendiente);

      const cuentaActualizada = await prisma.cuentaPorCobrar.update({
        where: { id },
        data: {
          montoPendiente: nuevoMontoPendiente,
          estado: nuevoEstado,
          diasVencido
        },
        include: {
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              email: true
            }
          }
        }
      });

      return { pago, cuenta: cuentaActualizada };
    });

    res.json(resultado);
  } catch (error) {
    console.error('Error al registrar pago:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// POST /api/contabilidad/cuentas-por-cobrar/:id/recordatorio - Enviar recordatorio
router.post('/:id/recordatorio', async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, mensaje } = req.body;

    if (!tipo || !['email', 'whatsapp', 'sms'].includes(tipo)) {
      return res.status(400).json({
        message: 'Tipo de recordatorio inválido. Debe ser: email, whatsapp o sms'
      });
    }

    const cuenta = await prisma.cuentaPorCobrar.findUnique({
      where: { id },
      include: { cliente: true }
    });

    if (!cuenta) {
      return res.status(404).json({ message: 'Cuenta por cobrar no encontrada' });
    }

    // Aquí implementarías la lógica real de envío
    // Por ahora simulamos el envío
    console.log(`Enviando recordatorio por ${tipo} a ${cuenta.cliente.nombre}`);
    console.log(`Mensaje: ${mensaje || 'Recordatorio de pago pendiente'}`);

    // Registrar el recordatorio en bitácora si es necesario
    // await prisma.bitacora.create({...});

    res.json({
      message: `Recordatorio enviado por ${tipo}`,
      cliente: `${cuenta.cliente.nombre} ${cuenta.cliente.apellidos}`,
      monto: cuenta.montoPendiente
    });
  } catch (error) {
    console.error('Error al enviar recordatorio:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// PUT /api/contabilidad/cuentas-por-cobrar/:id - Actualizar cuenta
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // No permitir actualización directa de campos calculados
    delete updateData.diasVencido;
    delete updateData.estado;

    // Recalcular si cambia fecha de vencimiento o monto
    if (updateData.fechaVencimiento || updateData.montoPendiente) {
      const cuentaActual = await prisma.cuentaPorCobrar.findUnique({ where: { id } });

      const fechaVenc = updateData.fechaVencimiento
        ? new Date(updateData.fechaVencimiento)
        : cuentaActual.fechaVencimiento;

      const montoPend = updateData.montoPendiente !== undefined
        ? parseFloat(updateData.montoPendiente)
        : cuentaActual.montoPendiente;

      updateData.diasVencido = calcularDiasVencidos(fechaVenc);
      updateData.estado = determinarEstado(updateData.diasVencido, montoPend);
    }

    const cuentaActualizada = await prisma.cuentaPorCobrar.update({
      where: { id },
      data: updateData,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            telefono: true,
            email: true
          }
        },
        factura: {
          select: {
            numeroFactura: true,
            tipoFactura: true
          }
        }
      }
    });

    res.json(cuentaActualizada);
  } catch (error) {
    console.error('Error al actualizar cuenta por cobrar:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// DELETE /api/contabilidad/cuentas-por-cobrar/:id - Eliminar cuenta
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.cuentaPorCobrar.delete({
      where: { id }
    });

    res.json({ message: 'Cuenta por cobrar eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar cuenta por cobrar:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// GET /api/contabilidad/cuentas-por-cobrar/exportar/excel - Exportar a Excel
router.get('/exportar/excel', async (req, res) => {
  try {
    const {
      clienteId,
      estado,
      fechaDesde,
      fechaHasta,
      montoMinimo,
      montoMaximo
    } = req.query;

    const where = {
      AND: []
    };

    // Aplicar filtros
    if (clienteId) where.AND.push({ clienteId: clienteId });
    if (estado) where.AND.push({ estado: estado });
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

    if (where.AND.length === 0) delete where.AND;

    const cuentas = await prisma.cuentaPorCobrar.findMany({
      where,
      include: {
        cliente: {
          select: {
            nombre: true,
            apellidos: true,
            telefono: true,
            email: true
          }
        },
        factura: {
          select: {
            numeroFactura: true,
            tipoFactura: true
          }
        }
      },
      orderBy: [
        { diasVencido: 'desc' },
        { fechaVencimiento: 'asc' }
      ]
    });

    // Para simplicidad, devolvemos JSON que el frontend puede procesar
    // En una implementación real, usarías una librería como 'xlsx' para generar Excel
    res.json({
      data: cuentas,
      filename: `cuentas-por-cobrar-${new Date().toISOString().split('T')[0]}.xlsx`,
      format: 'excel'
    });

  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// GET /api/contabilidad/cuentas-por-cobrar/exportar/pdf - Exportar a PDF
router.get('/exportar/pdf', async (req, res) => {
  try {
    const {
      clienteId,
      estado,
      fechaDesde,
      fechaHasta,
      montoMinimo,
      montoMaximo
    } = req.query;

    const where = {
      AND: []
    };

    // Aplicar filtros
    if (clienteId) where.AND.push({ clienteId: clienteId });
    if (estado) where.AND.push({ estado: estado });
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

    if (where.AND.length === 0) delete where.AND;

    const cuentas = await prisma.cuentaPorCobrar.findMany({
      where,
      include: {
        cliente: {
          select: {
            nombre: true,
            apellidos: true,
            telefono: true,
            email: true
          }
        },
        factura: {
          select: {
            numeroFactura: true,
            tipoFactura: true
          }
        }
      },
      orderBy: [
        { diasVencido: 'desc' },
        { fechaVencimiento: 'asc' }
      ]
    });

    // Para simplicidad, devolvemos JSON que el frontend puede procesar
    // En una implementación real, usarías una librería como 'pdfkit' para generar PDF
    res.json({
      data: cuentas,
      filename: `cuentas-por-cobrar-${new Date().toISOString().split('T')[0]}.pdf`,
      format: 'pdf'
    });

  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

// GET /api/contabilidad/cuentas-por-cobrar/seed-data - Crear datos de prueba
router.post('/seed-data', async (req, res) => {
  try {
    // Verificar si ya existen datos
    const existingCount = await prisma.cuentaPorCobrar.count();

    if (existingCount > 0) {
      return res.json({
        message: `Ya existen ${existingCount} cuentas por cobrar`,
        count: existingCount
      });
    }

    // Obtener algunos clientes existentes
    const clientes = await prisma.cliente.findMany({
      take: 10,
      select: { id: true, nombre: true, apellidos: true }
    });

    if (clientes.length === 0) {
      return res.status(400).json({
        message: 'No hay clientes disponibles. Crea algunos clientes primero.'
      });
    }

    // Crear datos de prueba
    const cuentasPrueba = [];
    const hoy = new Date();

    for (let i = 0; i < Math.min(15, clientes.length * 2); i++) {
      const cliente = clientes[i % clientes.length];
      const fechaEmision = new Date();
      fechaEmision.setDate(hoy.getDate() - Math.floor(Math.random() * 90)); // Entre 0 y 90 días atrás

      const fechaVencimiento = new Date(fechaEmision);
      fechaVencimiento.setDate(fechaEmision.getDate() + (Math.random() > 0.3 ? 30 : -15)); // 70% futuras, 30% vencidas

      const montoOriginal = Math.floor(Math.random() * 50000) + 5000; // Entre 5,000 y 55,000
      const montoPendiente = montoOriginal * (0.3 + Math.random() * 0.7); // Entre 30% y 100% del original

      const diasVencido = calcularDiasVencidos(fechaVencimiento);
      const estado = determinarEstado(diasVencido, montoPendiente);

      cuentasPrueba.push({
        numeroDocumento: `CXC-${String(i + 1).padStart(4, '0')}`,
        clienteId: cliente.id,
        fechaEmision,
        fechaVencimiento,
        montoOriginal,
        montoPendiente,
        moneda: 'DOP',
        estado,
        diasVencido,
        observaciones: i % 3 === 0 ? `Cuenta generada automáticamente para ${cliente.nombre}` : null
      });
    }

    // Insertar datos
    const cuentasCreadas = await prisma.cuentaPorCobrar.createMany({
      data: cuentasPrueba,
      skipDuplicates: true
    });

    res.json({
      message: 'Datos de prueba creados exitosamente',
      count: cuentasCreadas.count,
      sample: cuentasPrueba.slice(0, 3)
    });

  } catch (error) {
    console.error('Error al crear datos de prueba:', error);
    const errorInfo = handlePrismaError(error);
    res.status(500).json(errorInfo);
  }
});

module.exports = router;