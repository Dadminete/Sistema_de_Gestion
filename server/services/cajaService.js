const { Prisma } = require('@prisma/client');
const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

const CajaService = {
  async getAll() {
    try {
      // Optimización: Consulta más simple sin joins innecesarios
      const cajas = await prisma.caja.findMany({
        include: {
          responsable: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
        orderBy: {
          nombre: 'asc'
        }
      });

      // Optimización: Mapeo más simple y rápido
      return cajas.map(caja => ({
        id: caja.id,
        nombre: caja.nombre,
        descripcion: caja.descripcion || '',
        tipo: caja.tipo,
        cuentaContableId: caja.cuentaContableId,
        responsableId: caja.responsableId,
        saldoInicial: parseFloat(caja.saldoInicial.toString()),
        saldoActual: parseFloat(caja.saldoActual.toString()),
        limiteMaximo: caja.limiteMaximo ? parseFloat(caja.limiteMaximo.toString()) : null,
        activa: caja.activa,
        createdAt: caja.createdAt,
        updatedAt: caja.updatedAt,
        responsable: caja.responsable ? {
          id: caja.responsable.id,
          nombre: caja.responsable.nombre,
          apellido: caja.responsable.apellido
        } : null
      }));
    } catch (error) {
      console.error('Error en CajaService.getAll:', error);
      throw new Error('Error al obtener las cajas: ' + error.message);
    }
  },

  async getFinancialSummary() {
    try {
      // Obtener transacciones de la última semana y el último mes
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);

      const [
        totalCajas,
        cajasActivas,
        totalSaldoCajasAgg,
        ingresosSemanaAgg,
        gastosSemanaAgg,
        ingresosMesAgg,
        gastosMesAgg,
        topIncomeSources,
        topExpenseCategories
      ] = await Promise.all([
        prisma.caja.count(),
        prisma.caja.count({ where: { activa: true } }),
        prisma.caja.aggregate({ _sum: { saldoActual: true } }),
        prisma.movimientoContable.aggregate({
          _sum: { monto: true },
          where: { tipo: 'ingreso', fecha: { gte: lastWeek } }
        }),
        prisma.movimientoContable.aggregate({
          _sum: { monto: true },
          where: { tipo: 'gasto', fecha: { gte: lastWeek } }
        }),
        prisma.movimientoContable.aggregate({
          _sum: { monto: true },
          where: { tipo: 'ingreso', fecha: { gte: lastMonth } }
        }),
        prisma.movimientoContable.aggregate({
          _sum: { monto: true },
          where: { tipo: 'gasto', fecha: { gte: lastMonth } }
        }),
        prisma.movimientoContable.groupBy({
          by: ['descripcion'],
          _sum: { monto: true },
          where: { tipo: 'ingreso', fecha: { gte: lastMonth } },
          orderBy: { _sum: { monto: 'desc' } },
          take: 3
        }),
        prisma.movimientoContable.groupBy({
          by: ['descripcion'],
          _sum: { monto: true },
          where: { tipo: 'gasto', fecha: { gte: lastMonth } },
          orderBy: { _sum: { monto: 'desc' } },
          take: 3
        })
      ]);

      const totalSaldoCajas = totalSaldoCajasAgg._sum.saldoActual ? parseFloat(totalSaldoCajasAgg._sum.saldoActual.toString()) : 0;
      const ingresosSemana = parseFloat(ingresosSemanaAgg._sum.monto || 0);
      const gastosSemana = parseFloat(gastosSemanaAgg._sum.monto || 0);
      const ingresosMes = parseFloat(ingresosMesAgg._sum.monto || 0);
      const gastosMes = parseFloat(gastosMesAgg._sum.monto || 0);

      return {
        general: {
          totalCajas,
          cajasActivas,
          totalSaldoCajas,
        },
        resumenSemanal: {
          ingresos: ingresosSemana,
          gastos: gastosSemana,
          balance: ingresosSemana - gastosSemana,
        },
        resumenMensual: {
          ingresos: ingresosMes,
          gastos: gastosMes,
          balance: ingresosMes - gastosMes,
        },
        topFuentesIngreso: topIncomeSources.map(item => ({
          descripcion: item.descripcion,
          monto: parseFloat(item._sum.monto || 0)
        })),
        topCategoriasGasto: topExpenseCategories.map(item => ({
          descripcion: item.descripcion,
          monto: parseFloat(item._sum.monto || 0)
        })),
        // Aquí se podrían añadir más análisis como tendencias, proyecciones, etc.
      };
    } catch (error) {
      console.error('Error en getFinancialSummary:', error);
      throw new Error('Error al obtener el resumen financiero: ' + error.message);
    }
  },

  async getTopIncomeSources(startDate, endDate) {
    try {
      const topSources = await prisma.movimientoContable.groupBy({
        by: ['descripcion'], // Assuming 'descripcion' can categorize income sources
        _sum: {
          monto: true,
        },
        where: {
          tipo: 'ingreso',
          fecha: {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined,
          },
        },
        orderBy: {
          _sum: {
            monto: 'desc',
          },
        },
        take: 5, // Get top 5
      });
      return topSources;
    } catch (error) {
      console.error('Error en getTopIncomeSources:', error);
      throw new Error('Error al obtener las principales fuentes de ingreso: ' + error.message);
    }
  },

  async getById(id) {
    return prisma.caja.findUnique({
      where: { id },
      include: {
        cuentaContable: true,
        responsable: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
      },
    });
  },

  async create(data) {
    const newCaja = await prisma.caja.create({
      data,
    });
    await this.recalculateAndUpdateSaldo(newCaja.id);
    return newCaja;
  },

  async update(id, data) {
    const updatedCaja = await prisma.caja.update({
      where: { id },
      data,
    });
    await this.recalculateAndUpdateSaldo(id);
    return updatedCaja;
  },

  async delete(id) {
    return prisma.caja.delete({
      where: { id },
    });
  },

  async getBalance(cajaId) {
    return await this.calcularSaldoActual(cajaId);
  },

  async calcularSaldoActual(cajaId) {
    const caja = await prisma.caja.findUnique({
      where: { id: cajaId },
    });

    if (!caja) return 0;

    const saldoInicial = new Prisma.Decimal(caja.saldoInicial || 0);
    // Sumar todos los movimientos asociados a esta caja (ingresos/gastos)
    const agregados = await prisma.movimientoContable.groupBy({
      by: ['tipo'],
      where: {
        cajaId: cajaId,
      },
      _sum: {
        monto: true,
      },
    });

    let totalIngresos = new Prisma.Decimal(0);
    let totalGastos = new Prisma.Decimal(0);

    agregados.forEach(agregado => {
      if (agregado.tipo === 'ingreso') {
        totalIngresos = totalIngresos.plus(agregado._sum.monto || 0);
      } else if (agregado.tipo === 'gasto') {
        totalGastos = totalGastos.plus(agregado._sum.monto || 0);
      }
    });

    const saldoFinal = saldoInicial.plus(totalIngresos).minus(totalGastos);
    return saldoFinal.toNumber();
  },

  async recalculateAndUpdateSaldo(cajaId) {
    const nuevoSaldo = await this.calcularSaldoActual(cajaId);
    await prisma.caja.update({
      where: { id: cajaId },
      data: { saldoActual: nuevoSaldo },
    });
    return nuevoSaldo;
  },

  async abrirCaja(data) {
    const { cajaId, montoInicial, fechaApertura, usuarioId, observaciones } = data;

    console.log(`[CajaService] Intentando abrir caja ${cajaId}`);

    const caja = await prisma.caja.findUnique({
      where: { id: cajaId },
    });

    if (!caja || !caja.activa) {
      throw new Error('Caja no encontrada o inactiva');
    }

    console.log(`[CajaService] Caja encontrada: ${caja.nombre}`);

    const ultimaApertura = await prisma.aperturaCaja.findFirst({
      where: { cajaId },
      orderBy: { fechaApertura: 'desc' },
    });

    // Usar la misma lógica que getUltimaApertura para consistencia
    if (ultimaApertura) {
      console.log(`[CajaService] Última apertura encontrada: ${ultimaApertura.fechaApertura}`);

      const ultimoCierre = await prisma.cierreCaja.findFirst({
        where: { cajaId, fechaCierre: { gt: ultimaApertura.fechaApertura } },
        orderBy: { fechaCierre: 'desc' },
      });

      const estaAbierta = !ultimoCierre;
      console.log(`[CajaService] Estado de caja ${caja.nombre}: ${estaAbierta ? 'ABIERTA' : 'CERRADA'}`);

      if (estaAbierta) {
        throw new Error(`La caja "${caja.nombre}" ya está abierta desde ${ultimaApertura.fechaApertura.toLocaleString('es-ES')}`);
      }
    } else {
      console.log(`[CajaService] No hay aperturas previas para caja ${caja.nombre}`);
    }

    const apertura = await prisma.aperturaCaja.create({
      data: {
        cajaId,
        montoInicial: parseFloat(montoInicial),
        fechaApertura: new Date(fechaApertura),
        usuarioId,
        observaciones,
      },
      include: {
        caja: true,
        usuario: { select: { nombre: true, apellido: true } },
      },
    });

    // NO actualizar saldoInicial - este es histórico y no debe cambiar
    // Solo verificamos que el monto de apertura coincida con el saldo actual esperado

    // Opcional: Verificar que el monto de apertura sea razonable
    const saldoActualCalculado = await this.calcularSaldoActual(cajaId);
    console.log(`[Apertura] Caja: ${caja.nombre}`);
    console.log(`[Apertura] Saldo actual calculado: ${saldoActualCalculado}`);
    console.log(`[Apertura] Monto de apertura: ${montoInicial}`);
    console.log(`[CajaService] ✅ Apertura exitosa para caja ${caja.nombre}`);

    // No modificar saldos - la apertura es solo informativa

    return apertura;
  },

  async cerrarCaja(data) {
    const { cajaId, montoFinal, ingresosDelDia, gastosDelDia, fechaCierre, usuarioId, observaciones } = data;

    const caja = await prisma.caja.findUnique({ where: { id: cajaId } });
    if (!caja || !caja.activa) throw new Error('Caja no encontrada o inactiva');

    const ultimaApertura = await prisma.aperturaCaja.findFirst({
      where: { cajaId },
      orderBy: { fechaApertura: 'desc' },
    });
    if (!ultimaApertura) throw new Error('La caja no está abierta');

    const ultimoCierre = await prisma.cierreCaja.findFirst({
      where: { cajaId, fechaCierre: { gt: ultimaApertura.fechaApertura } },
      orderBy: { fechaCierre: 'desc' },
    });
    if (ultimoCierre) throw new Error('La caja ya está cerrada');

    const cierre = await prisma.cierreCaja.create({
      data: {
        cajaId,
        montoFinal: parseFloat(montoFinal),
        ingresosDelDia: parseFloat(ingresosDelDia),
        gastosDelDia: parseFloat(gastosDelDia),
        fechaCierre: new Date(fechaCierre),
        usuarioId,
        observaciones,
      },
      include: {
        caja: true,
        usuario: { select: { nombre: true, apellido: true } },
      },
    });

    const nuevoSaldoActual = await this.recalculateAndUpdateSaldo(cajaId);

    if (caja.cuentaContableId) {
      await prisma.cuentaContable.update({
        where: { id: caja.cuentaContableId },
        data: { saldoActual: nuevoSaldoActual },
      });
    }

    return cierre;
  },

  async getMovimientos(cajaId, fechaInicio, fechaFin) {
    const where = {
      cajaId: cajaId,
      metodo: 'caja',
    };
    if (fechaInicio && fechaFin) {
      where.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      };
    }
    return prisma.movimientoContable.findMany({
      where,
      include: {
        categoria: true,
        usuario: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  },

  async getHistorial(cajaId) {
    console.log(`🔍 [getHistorial] Consultando historial para caja: ${cajaId}`);

    const aperturas = await prisma.aperturaCaja.findMany({
      where: { cajaId },
      include: { usuario: { select: { nombre: true, apellido: true } } },
      orderBy: { fechaApertura: 'desc' },
    });

    const cierres = await prisma.cierreCaja.findMany({
      where: { cajaId },
      include: { usuario: { select: { nombre: true, apellido: true } } },
      orderBy: { fechaCierre: 'desc' },
    });

    // Obtener traspasos donde esta caja es origen o destino
    const traspasos = await prisma.traspaso.findMany({
      where: {
        OR: [
          { cajaOrigenId: cajaId },
          { cajaDestinoId: cajaId }
        ]
      },
      include: {
        autorizadoPor: { select: { nombre: true, apellido: true } },
        cajaOrigen: { select: { nombre: true } },
        cajaDestino: { select: { nombre: true } },
        cuentaBancariaOrigen: {
          select: {
            numeroCuenta: true,
            nombreOficialCuenta: true,
            bank: { select: { nombre: true } }
          }
        },
        cuentaBancariaDestino: {
          select: {
            numeroCuenta: true,
            nombreOficialCuenta: true,
            bank: { select: { nombre: true } }
          }
        }
      },
      orderBy: { fechaTraspaso: 'desc' },
    });

    const historial = [
      ...aperturas.map(a => ({
        id: a.id,
        tipo: 'apertura',
        fecha: a.fechaApertura,
        montoInicial: a.montoInicial,
        usuario: `${a.usuario.nombre} ${a.usuario.apellido}`,
        observaciones: a.observaciones,
      })),
      ...cierres.map(c => ({
        id: c.id,
        tipo: 'cierre',
        fecha: c.fechaCierre,
        montoFinal: c.montoFinal,
        ingresosDelDia: c.ingresosDelDia,
        gastosDelDia: c.gastosDelDia,
        usuario: `${c.usuario.nombre} ${c.usuario.apellido}`,
        observaciones: c.observaciones,
      })),
      ...traspasos.map(t => {
        const esOrigen = t.cajaOrigenId === cajaId;
        const esDestino = t.cajaDestinoId === cajaId;

        let origen, destino, tipoTraspaso;

        if (t.cajaOrigen && t.cajaDestino) {
          // Traspaso entre cajas
          origen = t.cajaOrigen.nombre;
          destino = t.cajaDestino.nombre;
          tipoTraspaso = esOrigen ? 'Salida a Caja' : 'Entrada de Caja';
        } else if (t.cajaOrigen && t.cuentaBancariaDestino) {
          // De caja a banco
          origen = t.cajaOrigen.nombre;
          destino = `${t.cuentaBancariaDestino.bank.nombre} - ${t.cuentaBancariaDestino.numeroCuenta}`;
          tipoTraspaso = 'Salida a Banco';
        } else if (t.cuentaBancariaOrigen && t.cajaDestino) {
          // De banco a caja
          origen = `${t.cuentaBancariaOrigen.bank.nombre} - ${t.cuentaBancariaOrigen.numeroCuenta}`;
          destino = t.cajaDestino.nombre;
          tipoTraspaso = 'Entrada de Banco';
        }

        return {
          id: t.id,
          tipo: 'traspaso',
          fecha: t.fechaTraspaso,
          monto: parseFloat(t.monto), // Convertir Decimal a número
          numeroTraspaso: t.numeroTraspaso,
          conceptoTraspaso: t.conceptoTraspaso,
          tipoTraspaso,
          origen,
          destino,
          esOrigen,
          esDestino,
          usuario: `${t.autorizadoPor.nombre} ${t.autorizadoPor.apellido}`,
          observaciones: t.conceptoTraspaso,
        };
      }),
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const traspasosEnHistorial = historial.filter(h => h.tipo === 'traspaso');
    console.log(`📊 [getHistorial] Retornando historial para caja ${cajaId}:`);
    console.log(`  - Total registros: ${historial.length}`);
    console.log(`  - Traspasos: ${traspasosEnHistorial.length}`);
    traspasosEnHistorial.slice(0, 3).forEach(t => {
      console.log(`    * ${t.numeroTraspaso}: ${t.monto} (${t.tipoTraspaso})`);
    });

    return historial;
  },

  async getHistorialTodasCajas() {
    try {
      // Obtener todas las cajas activas
      const cajasActivas = await prisma.caja.findMany({
        where: { activa: true },
        select: { id: true, nombre: true }
      });

      let historialCompleto = [];

      // Obtener aperturas y cierres de todas las cajas activas
      for (const caja of cajasActivas) {
        const aperturas = await prisma.aperturaCaja.findMany({
          where: { cajaId: caja.id },
          include: {
            usuario: { select: { nombre: true, apellido: true } },
            caja: { select: { nombre: true } }
          },
          orderBy: { fechaApertura: 'desc' },
        });

        const cierres = await prisma.cierreCaja.findMany({
          where: { cajaId: caja.id },
          include: {
            usuario: { select: { nombre: true, apellido: true } },
            caja: { select: { nombre: true } }
          },
          orderBy: { fechaCierre: 'desc' },
        });

        // Agregar aperturas al historial
        aperturas.forEach(a => {
          historialCompleto.push({
            id: `apertura-${a.id}`,
            tipo: 'apertura',
            fecha: a.fechaApertura,
            montoInicial: a.montoInicial,
            usuario: `${a.usuario.nombre} ${a.usuario.apellido}`,
            caja: a.caja.nombre,
            observaciones: a.observaciones,
          });
        });

        // Agregar cierres al historial
        cierres.forEach(c => {
          historialCompleto.push({
            id: `cierre-${c.id}`,
            tipo: 'cierre',
            fecha: c.fechaCierre,
            montoFinal: c.montoFinal,
            ingresosDelDia: c.ingresosDelDia,
            gastosDelDia: c.gastosDelDia,
            usuario: `${c.usuario.nombre} ${c.usuario.apellido}`,
            caja: c.caja.nombre,
            observaciones: c.observaciones,
          });
        });
      }

      // Ordenar por fecha descendente y limitar a los últimos 20 registros
      return historialCompleto
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 20);

    } catch (error) {
      console.error('Error en getHistorialTodasCajas:', error);
      return [];
    }
  },

  async setSaldoInicial(cuentaContableId, monto) {
    const cuenta = await prisma.cuentaContable.findUnique({
      where: { id: cuentaContableId },
      include: { cajas: true }
    });
    if (!cuenta) throw new Error('Cuenta contable no encontrada');

    const nuevoSaldo = parseFloat(monto);

    await prisma.cuentaContable.update({
      where: { id: cuentaContableId },
      data: {
        saldoInicial: nuevoSaldo,
        saldoActual: nuevoSaldo
      },
    });

    if (cuenta.cajas && cuenta.cajas.length > 0) {
      for (const caja of cuenta.cajas) {
        await prisma.caja.update({
          where: { id: caja.id },
          data: { saldoInicial: nuevoSaldo }
        });
        await this.recalculateAndUpdateSaldo(caja.id);
      }
    }
    return await this.getById(cuenta.cajas[0]?.id);
  },

  async getUltimaApertura(cajaId) {
    const ultimaApertura = await prisma.aperturaCaja.findFirst({
      where: { cajaId },
      orderBy: { fechaApertura: 'desc' },
    });
    if (!ultimaApertura) return null;

    const cierrePosterior = await prisma.cierreCaja.findFirst({
      where: { cajaId, fechaCierre: { gt: ultimaApertura.fechaApertura } },
    });

    return { ...ultimaApertura, estaAbierta: !cierrePosterior };
  },

  async getEstadisticasCaja(cajaId, fechaInicio, fechaFin) {
    const where = {
      cajaId: cajaId,
      fecha: {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin),
      },
    };

    const ingresos = await prisma.movimientoContable.aggregate({
      _sum: { monto: true },
      where: { ...where, tipo: 'ingreso' },
    });

    const gastos = await prisma.movimientoContable.aggregate({
      _sum: { monto: true },
      where: { ...where, tipo: 'gasto' },
    });

    const saldoActual = await this.calcularSaldoActual(cajaId);
    
    const totalIngresos = Number(ingresos._sum.monto || 0);
    const totalGastos = Number(gastos._sum.monto || 0);
    const balanceNeto = totalIngresos - totalGastos;
    
    // Calcular número de días en el período
    const fechaInicioDt = new Date(fechaInicio);
    const fechaFinDt = new Date(fechaFin);
    const diasDiferencia = Math.ceil((fechaFinDt.getTime() - fechaInicioDt.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const promedioDiario = diasDiferencia > 0 ? balanceNeto / diasDiferencia : 0;

    return {
      totalIngresos,
      totalGastos,
      balancePeriodo: balanceNeto,
      saldoActual: Number(saldoActual),
      balanceNeto,
      promedioDiario,
    };
  },

  async getResumenDiario(cajaId, fecha) {
    try {
      // Manejar fechas correctamente para zona horaria GMT-4 (República Dominicana)
      let startOfDay, endOfDay;

      if (fecha) {
        // Para fecha específica, crear el rango en hora local GMT-4
        // Parsear la fecha como YYYY-MM-DD en hora local
        const [year, month, day] = fecha.split('-').map(Number);

        // Crear fechas en GMT-4 (UTC-4)
        startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

        // Convertir a UTC para la consulta (sumar 4 horas)
        startOfDay = new Date(startOfDay.getTime() + (4 * 60 * 60 * 1000));
        endOfDay = new Date(endOfDay.getTime() + (4 * 60 * 60 * 1000));
      } else {
        // Para hoy, usar la fecha actual en hora local
        const now = new Date();
        startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        // Convertir a UTC (sumar 4 horas para GMT-4)
        startOfDay = new Date(startOfDay.getTime() + (4 * 60 * 60 * 1000));
        endOfDay = new Date(endOfDay.getTime() + (4 * 60 * 60 * 1000));
      }

      const ingresos = await prisma.movimientoContable.aggregate({
        _sum: { monto: true },
        where: {
          cajaId,
          tipo: 'ingreso',
          fecha: {
            gte: startOfDay,
            lte: endOfDay,
          },
          metodo: { not: 'ajuste' }, // Excluir ajustes contables
        },
      });

      const gastos = await prisma.movimientoContable.aggregate({
        _sum: { monto: true },
        where: {
          cajaId,
          tipo: 'gasto',
          fecha: {
            gte: startOfDay,
            lte: endOfDay,
          },
          metodo: { not: 'ajuste' }, // Excluir ajustes contables
        },
      });

      return {
        totalIngresos: ingresos._sum.monto || 0,
        totalGastos: gastos._sum.monto || 0,
      };
    } catch (error) {
      console.error('Error en CajaService.getResumenDiario:', error);
      throw new Error('Error al obtener el resumen diario de la caja: ' + error.message);
    }
  },

  async getFinancialSummary() {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const movimientos = await prisma.movimientoContable.findMany({
        where: {
          fecha: { gte: threeMonthsAgo },
          // Filtrar para excluir movimientos bancarios
          metodo: {
            not: 'banco'
          },
        },
        select: {
          monto: true,
          tipo: true,
          fecha: true,
          metodo: true,
        },
        orderBy: {
          fecha: 'asc',
        },
      });

      // --- Helper Functions ---
      const getWeekNumber = (d) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `Semana ${weekNo}`;
      };

      const getMonthName = (d) => {
        return d.toLocaleString('es-ES', { month: 'long' });
      };

      // --- Process Data by Caja ---
      const weeklyData = {};
      const monthlyData = {};

      movimientos.forEach(mov => {
        const week = getWeekNumber(mov.fecha);
        const month = getMonthName(mov.fecha);
        const amount = parseFloat(mov.monto);
        const cajaType = mov.metodo === 'papeleria' ? 'papeleria' : 'cajaPrincipal';

        // Weekly
        if (!weeklyData[week]) {
          weeklyData[week] = {
            cajaPrincipal: { ingresos: 0, gastos: 0 },
            papeleria: { ingresos: 0, gastos: 0 }
          };
        }
        if (mov.tipo === 'ingreso') {
          weeklyData[week][cajaType].ingresos += amount;
        } else if (mov.tipo === 'gasto') {
          weeklyData[week][cajaType].gastos += amount;
        }

        // Monthly
        if (!monthlyData[month]) {
          monthlyData[month] = {
            cajaPrincipal: { ingresos: 0, gastos: 0 },
            papeleria: { ingresos: 0, gastos: 0 }
          };
        }
        if (mov.tipo === 'ingreso') {
          monthlyData[month][cajaType].ingresos += amount;
        } else if (mov.tipo === 'gasto') {
          monthlyData[month][cajaType].gastos += amount;
        }
      });

      // --- Format Output ---
      const semanal = {
        labels: Object.keys(weeklyData),
        cajaPrincipal: {
          ingresos: Object.values(weeklyData).map(d => d.cajaPrincipal.ingresos),
          gastos: Object.values(weeklyData).map(d => d.cajaPrincipal.gastos),
        },
        papeleria: {
          ingresos: Object.values(weeklyData).map(d => d.papeleria.ingresos),
          gastos: Object.values(weeklyData).map(d => d.papeleria.gastos),
        },
      };

      const mensual = {
        labels: Object.keys(monthlyData),
        cajaPrincipal: {
          ingresos: Object.values(monthlyData).map(d => d.cajaPrincipal.ingresos),
          gastos: Object.values(monthlyData).map(d => d.cajaPrincipal.gastos),
        },
        papeleria: {
          ingresos: Object.values(monthlyData).map(d => d.papeleria.ingresos),
          gastos: Object.values(monthlyData).map(d => d.papeleria.gastos),
        },
      };

      return { semanal, mensual };

    } catch (error) {
      console.error('Error en CajaService.getFinancialSummary:', error);
      throw new Error('Error al obtener el resumen financiero: ' + error.message);
    }
  },

  async getSavingsAnalysis() {
    try {
      // Identificar categoría de traspasos para excluir movimientos internos
      const categoriaTraspasos = await prisma.categoriaCuenta.findFirst({ where: { nombre: 'Traspasos' } });

      // Excluir bancos internos/no operativos (ej. Fondesa)
      const excludedBanks = await prisma.bank.findMany({
        where: { nombre: { contains: 'fondesa', mode: 'insensitive' } },
        select: { id: true }
      });
      const excludedBankIds = excludedBanks.map(b => b.id);

      const bankFilterMovimientos = excludedBankIds.length
        ? {
            NOT: {
              OR: [
                { cuentaBancaria: { bankId: { in: excludedBankIds } } },
                { bankId: { in: excludedBankIds } }
              ]
            }
          }
        : {};

      // 1. Obtener Ingreso Proyectado Real (VALOR SUSCRIPCIONES)
      const totalSuscripcionesAgg = await prisma.suscripcion.aggregate({
        _sum: { precioMensual: true },
        where: { estado: { in: ['activo', 'ACTIVO', 'Activo'] } }
      });
      const ingresoMensualProyectado = parseFloat(totalSuscripcionesAgg._sum.precioMensual || 0);

      // 2. Obtener Desglose de Recaudación (Días 15 vs Otros)
      const montoDia15Agg = await prisma.suscripcion.aggregate({
        where: { diaFacturacion: 15, estado: { in: ['activo', 'ACTIVO', 'Activo'] } },
        _sum: { precioMensual: true }
      });
      const montoOtrosDiasAgg = await prisma.suscripcion.aggregate({
        where: { diaFacturacion: { in: [30, 20, 10] }, estado: { in: ['activo', 'ACTIVO', 'Activo'] } },
        _sum: { precioMensual: true }
      });
      const montoDia15 = parseFloat(montoDia15Agg._sum.precioMensual || 0);
      const montoOtrosDias = parseFloat(montoOtrosDiasAgg._sum.precioMensual || 0);

      // 3. Gastos Presupuestados (Mantener como referencia base para el ahorro)
      const gastosPresupuestados = {
        nomina: 48000,
        internet: 5900, // COGS - Insumo principal
        gasolina: 1200,
        flotas: 3400,
        alquiler: 7000,
        luz: 1600
      };

      const totalGastosFijos = Object.values(gastosPresupuestados).reduce((a, b) => a + b, 0);
      const ahorroProyectado = ingresoMensualProyectado - totalGastosFijos;
      const margenAhorro = ingresoMensualProyectado > 0 ? (ahorroProyectado / ingresoMensualProyectado) * 100 : 0;

      // 4. Datos Reales del Mes Actual
      const fechaActual = new Date();
      const monthStart = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
      const monthEnd = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const ingresosRealesAgg = await prisma.movimientoContable.aggregate({
        _sum: { monto: true },
        where: {
          tipo: 'ingreso',
          fecha: { gte: monthStart, lte: monthEnd },
          metodo: { in: ['caja', 'banco'] }, // Solo ingresos operativos
          ...(categoriaTraspasos ? { NOT: { categoriaId: categoriaTraspasos.id } } : {}),
          ...bankFilterMovimientos
        }
      });

      const gastosRealesAgg = await prisma.movimientoContable.aggregate({
        _sum: { monto: true },
        where: {
          tipo: 'gasto',
          fecha: { gte: monthStart, lte: monthEnd },
          ...(categoriaTraspasos ? { NOT: { categoriaId: categoriaTraspasos.id } } : {}),
          ...bankFilterMovimientos
        }
      });

      const ingresosReales = parseFloat(ingresosRealesAgg._sum.monto || 0);
      const gastosReales = parseFloat(gastosRealesAgg._sum.monto || 0);

      // 5. Cuentas por Cobrar (Deuda de clientes)
      const facturasPendientesAgg = await prisma.facturaCliente.aggregate({
        where: {
          estado: { in: ['pendiente', 'parcial', 'vencida'] }
        },
        _sum: { total: true }
      });
      const montoCuentasPorCobrar = parseFloat(facturasPendientesAgg._sum.total || 0);

      return {
        proyectado: {
          ingreso: ingresoMensualProyectado,
          recaudacion15: montoDia15,
          recaudacionOtros: montoOtrosDias,
          gastos: gastosPresupuestados,
          totalGastos: totalGastosFijos,
          ahorro: ahorroProyectado,
          margenAhorro: margenAhorro.toFixed(2)
        },
        realMes: {
          ingreso: ingresosReales,
          gastos: gastosReales,
          ahorro: ingresosReales - gastosReales,
          margenAhorro: ingresosReales > 0 ? (((ingresosReales - gastosReales) / ingresosReales) * 100).toFixed(2) : 0,
          cuentasPorCobrar: montoCuentasPorCobrar
        },
        recomendaciones: [
          {
            tipo: 'negocio',
            titulo: 'Flujo de Caja - Día 15',
            mensaje: `El ${((montoDia15 / ingresoMensualProyectado) * 100).toFixed(1)}% de tus ingresos entran el día 15. Asegura tener tus pagos mayores programados para esa fecha.`,
            prioridad: 'media'
          },
          {
            tipo: 'recaudacion',
            titulo: 'Cuentas por Cobrar',
            mensaje: `Tienes ${new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(montoCuentasPorCobrar)} pendientes de cobro. Reforzar la gestión en los días 20 y 30.`,
            prioridad: 'alta'
          },
          ...((ingresoMensualProyectado > 100000) ? [{
            tipo: 'ahorro',
            titulo: 'Potencial de Inversión',
            mensaje: `Con un ingreso proyectado de ${new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(ingresoMensualProyectado)}, tu capacidad de ahorro es sólida.`,
            prioridad: 'alta'
          }] : [])
        ]
      };
    } catch (error) {
      console.error('Error en getSavingsAnalysis:', error);
      throw error;
    }
  },

  async getDashboardStats(filter, customMonth) {
    console.time('getDashboardStats');
    try {
      const fechaActual = new Date();
      let monthStart, monthEnd;

      if (customMonth) {
        monthStart = new Date(customMonth);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);
      } else {
        monthStart = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
        monthEnd = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
      }

      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      const yearEnd = new Date(new Date().getFullYear(), 11, 31);

      // --- PARALLEL QUERY EXECUTION START ---
      const inicioMesAnterior = new Date(monthStart);
      inicioMesAnterior.setMonth(inicioMesAnterior.getMonth() - 1);
      const finMesAnterior = new Date(monthStart);
      finMesAnterior.setDate(0);
      finMesAnterior.setHours(23, 59, 59, 999);

      const categoriaTraspasos = await prisma.categoriaCuenta.findFirst({ where: { nombre: 'Traspasos' } });

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      console.time('ParallelQueries');

      // --- ESTRICT BANK ISOLATION (FIXED) ---
      // --- EXCLUSION-BASED BANK FILTERING (FIXED) ---
      const excludedBanks = await prisma.bank.findMany({
        where: { nombre: { contains: 'fondesa', mode: 'insensitive' } },
        select: { id: true }
      });

      const excludedBankIds = excludedBanks.map(b => b.id);

      const bankFilterPagos = [
        { cuentaBancaria: { bankId: { notIn: excludedBankIds } } }
      ];

      const bankFilterMovimientos = [
        {
          NOT: {
            OR: [
              { cuentaBancaria: { bankId: { in: excludedBankIds } } },
              { bankId: { in: excludedBankIds } }
            ]
          }
        }
      ];

      const [
        cajaPrincipal,
        cajaPapeleria,
        cajasActivas,
        cajasInactivas,
        cajasEstadoRaw,
        cajasCerradas,
        totalClientesActivos,
        totalFacturasPendientesAgg,

        pagosClientesBancoAggMes,
        ingresosMovimientosBancoAggMes,
        antCajaAgg,
        antPagosAgg,
        antMovsBancoAgg,
        totalSuscripcionesAgg,
        ingresosHoyCajaPrincipalAgg,
        gastosHoyCajaPrincipalAgg,
        ingresosHoyPapeleriaAgg,
        gastosHoyPapeleriaAgg,
        gastosMesCajaPrincipalAgg,
        gastosMesPapeleriaAgg,
        gastosMesBancoAgg,
        ingresosMesCajaPrincipalAgg,
        movimientosAnual,
        pagosAnual,
        pagosConFactura,
        recentEvents,
        recentTasks
      ] = await Promise.all([
        prisma.caja.findFirst({ where: { OR: [{ nombre: { equals: 'Caja Principal', mode: 'insensitive' } }, { tipo: 'general' }] } }),
        prisma.caja.findFirst({ where: { activa: true, OR: [{ nombre: { contains: 'Papeler', mode: 'insensitive' } }, { tipo: { contains: 'papeler', mode: 'insensitive' } }] } }),
        prisma.caja.count({ where: { activa: true } }),
        prisma.caja.count({ where: { activa: false } }),
        prisma.caja.findMany({ where: { activa: true }, select: { id: true, aperturas: { take: 1, orderBy: { fechaApertura: 'desc' } }, cierres: { take: 1, orderBy: { fechaCierre: 'desc' } } } }),
        prisma.cierreCaja.count({ where: { fechaCierre: { gte: monthStart, lte: monthEnd } } }),
        prisma.cliente.count({ where: { estado: { in: ['activo', 'ACTIVO', 'Activo'] } } }),
        prisma.facturaCliente.aggregate({ _sum: { total: true }, where: { estado: 'pendiente' } }),

        // Ingresos de bancos (MES) solo para bancos permitidos
        prisma.pagoCliente.aggregate({
          _sum: { monto: true },
          where: {
            cuentaBancariaId: { not: null },
            estado: 'confirmado',
            fechaPago: { gte: monthStart, lte: monthEnd },
            ...bankFilterPagos[0],
          }
        }),
        prisma.movimientoContable.aggregate({
          _sum: { monto: true },
          where: {
            metodo: 'banco',
            tipo: 'ingreso',
            fecha: { gte: monthStart, lte: monthEnd },
            NOT: {
              OR: [
                { descripcion: { contains: 'Pago Cliente' } },
                ...(categoriaTraspasos ? [{ categoriaId: categoriaTraspasos.id }] : [])
              ]
            },
            ...bankFilterMovimientos[0],
          }
        }),
        prisma.movimientoContable.aggregate({ _sum: { monto: true }, where: { metodo: 'caja', tipo: 'ingreso', fecha: { gte: inicioMesAnterior, lte: finMesAnterior }, ...(categoriaTraspasos ? { NOT: { categoriaId: categoriaTraspasos.id } } : {}) } }),
        // Ingresos de bancos (MES ANTERIOR) solo bancos permitidos
        prisma.pagoCliente.aggregate({
          _sum: { monto: true },
          where: {
            cuentaBancariaId: { not: null },
            estado: 'confirmado',
            fechaPago: { gte: inicioMesAnterior, lte: finMesAnterior },
            ...bankFilterPagos[0],
          }
        }),
        prisma.movimientoContable.aggregate({
          _sum: { monto: true },
          where: {
            metodo: 'banco',
            tipo: 'ingreso',
            fecha: { gte: inicioMesAnterior, lte: finMesAnterior },
            NOT: {
              OR: [
                { descripcion: { contains: 'Pago Cliente' } },
                ...(categoriaTraspasos ? [{ categoriaId: categoriaTraspasos.id }] : [])
              ]
            },
            ...bankFilterMovimientos[0],
          }
        }),
        prisma.suscripcion.aggregate({ _sum: { precioMensual: true }, where: { estado: { in: ['activo', 'ACTIVO', 'Activo'] } } }),
        prisma.movimientoContable.aggregate({ _sum: { monto: true }, where: { metodo: 'caja', tipo: 'ingreso', fecha: { gte: todayStart, lte: todayEnd }, ...(categoriaTraspasos ? { NOT: { categoriaId: categoriaTraspasos.id } } : {}) } }),
        prisma.movimientoContable.aggregate({ _sum: { monto: true }, where: { metodo: 'caja', tipo: 'gasto', fecha: { gte: todayStart, lte: todayEnd }, ...(categoriaTraspasos ? { NOT: { categoriaId: categoriaTraspasos.id } } : {}) } }),
        prisma.movimientoContable.aggregate({ _sum: { monto: true }, where: { metodo: 'papeleria', tipo: 'ingreso', fecha: { gte: todayStart, lte: todayEnd } } }),
        prisma.movimientoContable.aggregate({ _sum: { monto: true }, where: { metodo: 'papeleria', tipo: 'gasto', fecha: { gte: todayStart, lte: todayEnd } } }),
        prisma.movimientoContable.aggregate({ _sum: { monto: true }, where: { metodo: 'caja', tipo: 'gasto', fecha: { gte: monthStart, lte: monthEnd }, ...(categoriaTraspasos ? { NOT: { categoriaId: categoriaTraspasos.id } } : {}) } }),
        prisma.movimientoContable.aggregate({ _sum: { monto: true }, where: { metodo: 'papeleria', tipo: 'gasto', fecha: { gte: monthStart, lte: monthEnd }, ...(categoriaTraspasos ? { NOT: { categoriaId: categoriaTraspasos.id } } : {}) } }),
        prisma.movimientoContable.aggregate({
          _sum: { monto: true },
          where: {
            metodo: 'banco',
            tipo: 'gasto',
            fecha: { gte: monthStart, lte: monthEnd },
            ...(categoriaTraspasos ? { NOT: { categoriaId: categoriaTraspasos.id } } : {}),
            ...bankFilterMovimientos[0],
          }
        }),
        prisma.movimientoContable.aggregate({ _sum: { monto: true }, where: { metodo: 'caja', tipo: 'ingreso', fecha: { gte: monthStart, lte: monthEnd }, ...(categoriaTraspasos ? { NOT: { categoriaId: categoriaTraspasos.id } } : {}) } }),
        prisma.movimientoContable.findMany({
          where: {
            fecha: { gte: yearStart, lte: yearEnd },
            NOT: {
              OR: [
                { descripcion: { contains: 'Pago Cliente' } },
                ...(categoriaTraspasos ? [{ categoriaId: categoriaTraspasos.id }] : [])
              ]
            },
            OR: [
              { metodo: { not: 'banco' } },
              { ...bankFilterMovimientos[0] }
            ]
          },
          select: { fecha: true, monto: true, tipo: true, metodo: true }
        }),
        prisma.pagoCliente.findMany({
          where: {
            cuentaBancariaId: { not: null },
            estado: 'confirmado',
            fechaPago: { gte: yearStart, lte: yearEnd },
            ...bankFilterPagos[0],
          },
          select: { fechaPago: true, monto: true }
        }),
          prisma.pagoCliente.findMany({ 
            where: { facturaId: { not: null }, fechaPago: { gte: yearStart }, estado: 'confirmado' }, 
            include: { 
              factura: { select: { fechaVencimiento: true } }, 
              cliente: { 
                select: { 
                  id: true,
                  nombre: true, 
                  apellidos: true,
                  suscripciones: {
                    where: { estado: { in: ['activo', 'ACTIVO', 'Activo'] } },
                    select: { diaFacturacion: true },
                    take: 1
                  }
                } 
              } 
            } 
          }),
        prisma.evento.findMany({ take: 3, orderBy: { createdAt: 'desc' } }),
        prisma.tarea.findMany({ take: 3, orderBy: { createdAt: 'desc' } })
      ]);

      console.timeEnd('ParallelQueries');

      const cajasAbiertas = cajasEstadoRaw.filter(c => {
        const apertura = c.aperturas[0];
        const cierre = c.cierres[0];
        if (!apertura) return false;
        if (!cierre) return true;
        return new Date(apertura.fechaApertura) > new Date(cierre.fechaCierre);
      }).length;

      if (!cajaPrincipal) throw new Error("No se encontró la 'Caja Principal'.");

      // --- INGRESOS Y GASTOS HOY ---
      const ingresosHoyCajaPrincipalNum = Number(ingresosHoyCajaPrincipalAgg._sum.monto || 0);
      const gastosHoyCajaPrincipalNum = Number(gastosHoyCajaPrincipalAgg._sum.monto || 0);
      const ingresosHoyPapeleriaNum = Number(ingresosHoyPapeleriaAgg?._sum?.monto || 0);
      const gastosHoyPapeleriaNum = Number(gastosHoyPapeleriaAgg?._sum?.monto || 0);
      const gastosHoyTotalNum = gastosHoyCajaPrincipalNum + gastosHoyPapeleriaNum;

      // --- BALANCES ---
      const balanceCajaPrincipalNum = await this.calcularSaldoActual(cajaPrincipal.id);
      let balancePapeleriaNum = 0;
      if (cajaPapeleria) {
        balancePapeleriaNum = await this.calcularSaldoActual(cajaPapeleria.id);
      }

      // --- GASTOS MES ---
      const gastosMesCajaPrincipalNum = Number(gastosMesCajaPrincipalAgg._sum.monto || 0);
      const gastosMesPapeleriaNum = Number(gastosMesPapeleriaAgg?._sum?.monto || 0);
      const gastosMesBancoNum = Number(gastosMesBancoAgg._sum.monto || 0);

      // --- NET MONTHLY BANK INCOME (FOR 'BANCO' CARD) ---
      const ingresosMesBancoNum = Number(pagosClientesBancoAggMes?._sum?.monto || 0) + Number(ingresosMovimientosBancoAggMes?._sum?.monto || 0);
      const balanceBancoNum = ingresosMesBancoNum - gastosMesBancoNum;

      // --- INGRESO REAL MES (Caja + Banco) ---






      // --- TOTAL CLIENTES ACTIVOS ---


      // --- TOTAL FACTURAS PENDIENTES ---

      const totalFacturasPendientes = Number(totalFacturasPendientesAgg._sum.total || 0);
      // --- INGRESO REAL MES (Restored Logic) ---
      const ingresosMesCajaPrincipalNum = Number(ingresosMesCajaPrincipalAgg?._sum?.monto || 0);
      const ingresoRealMesNum = ingresosMesCajaPrincipalNum + ingresosMesBancoNum;
      // --- INGRESOS BIMENSUALES ---


      const totalAnterior = Number(antCajaAgg._sum.monto || 0) + Number(antPagosAgg._sum.monto || 0) + Number(antMovsBancoAgg._sum.monto || 0);
      const totalIngresosBimensual = ingresoRealMesNum + totalAnterior;
      const totalDeudaNum = totalIngresosBimensual; // Keeping variable name for compatibility

      // --- VALOR SUSCRIPCIONES ---

      const ingresosServiciosMesNum = Number(totalSuscripcionesAgg._sum.precioMensual || 0);

      // --- CHART DATA (Optimized: 1 query + processing) ---
      // (Data already fetched in ParallelQueries)

      // Process chart data in memory
      const monthlyData = {};
      for (let i = 0; i < 12; i++) {
        const monthName = new Date(0, i).toLocaleString('es-ES', { month: 'short' });
        monthlyData[i] = {
          name: monthName,
          IngresoCaja: 0,
          IngresoBanco: 0,
          IngresoPapeleria: 0,
          GastoCaja: 0,
          GastoBanco: 0,
          GastoPapeleria: 0
        };
      }

      movimientosAnual.forEach(m => {
        const month = new Date(m.fecha).getMonth();
        const monto = Number(m.monto);

        if (m.tipo === 'ingreso') {
          if (m.metodo === 'caja') monthlyData[month].IngresoCaja += monto;
          else if (m.metodo === 'banco') monthlyData[month].IngresoBanco += monto;
          else if (m.metodo === 'papeleria') monthlyData[month].IngresoPapeleria += monto;
        } else if (m.tipo === 'gasto') {
          if (m.metodo === 'caja') monthlyData[month].GastoCaja += monto;
          else if (m.metodo === 'banco') monthlyData[month].GastoBanco += monto;
          else if (m.metodo === 'papeleria') monthlyData[month].GastoPapeleria += monto;
        }
      });

      const chartData = Object.values(monthlyData);

      // --- TOP EARLY PAYERS ---
      // Clientes que pagan ANTES de su día de facturación (15 o 30 de cada mes)
      
      const earlyPayerMap = new Map();
      
      for (const pago of pagosConFactura) {
        if (!pago.cliente) continue;
        
          // Obtener las suscripciones del cliente (ya están cargadas en la query)
          const suscripciones = pago.cliente.suscripciones || [];
        
        if (suscripciones.length === 0) continue;
        
        // Usar el día de facturación de la primera suscripción activa
        const diaFacturacion = suscripciones[0].diaFacturacion;
        
        // Obtener la fecha de pago
        const fechaPago = new Date(pago.fechaPago);
        const diaPago = fechaPago.getDate();
        
        // Verificar si pagó ANTES del día de facturación
        // Si el día de pago es menor al día de facturación, se considera pago anticipado
        if (diaPago < diaFacturacion) {
          const name = `${pago.cliente.nombre} ${pago.cliente.apellidos || ''}`.trim();
          const curr = earlyPayerMap.get(name) || { val: 0, date: pago.fechaPago, count: 0 };
          curr.val += Number(pago.monto);
          curr.count += 1;
          earlyPayerMap.set(name, curr);
        }
      }

      const topEarlyPayers = Array.from(earlyPayerMap.entries())
        .map(([name, d]) => ({ name, total: d.val, date: d.date, count: d.count }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // (Fetched in Parallel)
      const recentTransactions = await this.getRecentTransactions(7);

      return {
        stats: {
          ingresosHoy: ingresosHoyCajaPrincipalNum + ingresosHoyPapeleriaNum,
          ingresosHoyCajaPrincipal: ingresosHoyCajaPrincipalNum,
          ingresosHoyPapeleria: ingresosHoyPapeleriaNum,
          gastosHoy: gastosHoyTotalNum,
          gastosHoyCajaPrincipal: gastosHoyCajaPrincipalNum,
          gastosHoyPapeleria: gastosHoyPapeleriaNum,
          gastosMesCajaPrincipal: gastosMesCajaPrincipalNum,
          balanceCajaPrincipal: balanceCajaPrincipalNum,
          balancePapeleria: balancePapeleriaNum,
          balanceBanco: balanceBancoNum,
          gastosMesBanco: gastosMesBancoNum,
          gastosMesPapeleria: gastosMesPapeleriaNum,
          ingresoRealMes: ingresoRealMesNum,
          ingresosMesBanco: ingresosMesBancoNum,
          totalClientesActivos,
          totalFacturasPendientes,
          totalIngresosBimensual: totalDeudaNum,
          ingresosServiciosMes: ingresosServiciosMesNum,
          cajasActivas,
          cajasInactivas,
          cajasAbiertas,
          cajasCerradas,
        },
        chartData,
        historial: await this.getHistorialTodasCajas(),
        recentEvents,
        recentTasks,
        topEarlyPayers,
        recentTransactions
      };
    } catch (error) {
      console.error('Error en CajaService.getDashboardStats:', error);
      throw new Error('Error stats: ' + error.message);
    } finally {
      console.timeEnd('getDashboardStats');
    }
  },

  async getTopIncomeSources(startDate, endDate) {
    try {
      const where = {
        tipo: 'ingreso',
        // Filtrar para excluir movimientos bancarios
        metodo: {
          not: 'banco'
        },
      };

      if (startDate && endDate) {
        where.fecha = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      }

      const topSources = await prisma.movimientoContable.groupBy({
        by: ['categoriaId'],
        where,
        _sum: {
          monto: true,
        },
        orderBy: {
          _sum: {
            monto: 'desc',
          },
        },
        take: 5,
      });

      // Enrich with category names
      const enrichedSources = await Promise.all(
        topSources.map(async (source) => {
          const category = await prisma.categoriaCuenta.findUnique({
            where: { id: source.categoriaId },
            select: { nombre: true },
          });
          return {
            name: category ? category.nombre : 'Desconocido',
            value: Number(source._sum.monto || 0),
          };
        })
      );

      return enrichedSources;
    } catch (error) {
      console.error('Error in CajaService.getTopIncomeSources:', error);
      throw new Error('Error al obtener las fuentes de ingreso: ' + error.message);
    }
  },

  async getRecentTransactions(limit = 10) {
    try {
      const transactions = await prisma.movimientoContable.findMany({
        where: {
          OR: [
            { metodo: 'caja' },
            { metodo: 'papeleria' },
            { metodo: 'banco' }
          ]
        },
        take: limit,
        orderBy: {
          fecha: 'desc',
        },
        include: {
          categoria: {
            select: { nombre: true },
          },
          usuario: {
            select: { nombre: true, apellido: true },
          },
        },
      });

      return transactions.map(t => ({
        id: t.id,
        fecha: t.fecha,
        descripcion: t.descripcion,
        monto: t.monto,
        tipo: t.tipo,
        categoria: t.categoria ? t.categoria.nombre : 'N/A',
        usuario: t.usuario ? `${t.usuario.nombre} ${t.usuario.apellido}` : 'Sistema',
        metodo: t.metodo,
      }));
    } catch (error) {
      console.error('Error in CajaService.getRecentTransactions:', error);
      throw new Error('Error al obtener las transacciones recientes: ' + error.message);
    }
  }
};

module.exports = { CajaService };
