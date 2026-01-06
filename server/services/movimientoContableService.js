const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { CajaService } = require('./cajaService'); // Import CajaService
const { CuentaContableService } = require('./cuentaContableService'); // Import CuentaContableService
const CuentasPorPagarService = require('./cuentasPorPagarService'); // Import CuentasPorPagarService

/**
 * Helper function to update saldoActual of a cuenta contable based on its associated movements
 * @param {string} categoriaId - ID of the categoria to find the cuenta contable
 * @param {string} metodo - Method used (caja, banco, papeleria)
 * @param {string} cajaId - Caja ID if method is caja
 * @param {string} cuentaBancariaId - Cuenta bancaria ID if method is banco
 */
const updateCuentaContableSaldo = async (categoriaId, metodo, cajaId = null, cuentaBancariaId = null) => {
  try {
    let cuentaContableId = null;

    // Find the cuenta contable based on the method
    if (metodo === 'caja' && cajaId) {
      // Get cuenta contable from caja
      const caja = await prisma.caja.findUnique({
        where: { id: cajaId },
        select: { cuentaContableId: true },
      });
      cuentaContableId = caja?.cuentaContableId;
    } else if (metodo === 'banco' && cuentaBancariaId) {
      // Get cuenta contable from cuenta bancaria
      const cuentaBancaria = await prisma.cuentaBancaria.findUnique({
        where: { id: cuentaBancariaId },
        select: { cuentaContableId: true },
      });
      cuentaContableId = cuentaBancaria?.cuentaContableId;
    } else {
      // For generic movements, find cuenta contable by categoria
      const cuentaContable = await prisma.cuentaContable.findFirst({
        where: { categoriaId },
      });
      cuentaContableId = cuentaContable?.id;
    }

    if (!cuentaContableId) {
      console.log(`[UpdateSaldo] No cuenta contable found for categoria: ${categoriaId}, metodo: ${metodo}`);
      return;
    }

    // Calculate the new balance
    const cuentaContable = await prisma.cuentaContable.findUnique({
      where: { id: cuentaContableId },
      select: { saldoInicial: true, categoriaId: true },
    });

    if (!cuentaContable) return;

    // Get balance using the intelligent calculateAccountBalance method
    const nuevoSaldo = await CuentaContableService.calculateAccountBalance(cuentaContableId);

    // Update the saldoActual in the database
    await prisma.cuentaContable.update({
      where: { id: cuentaContableId },
      data: { saldoActual: nuevoSaldo },
    });

    console.log(`[UpdateSaldo] Updated cuenta contable ${cuentaContableId} - New balance: ${nuevoSaldo}`);
  } catch (error) {
    console.error('[UpdateSaldo] Error updating cuenta contable saldo:', error);
  }
};

const movimientoContableService = {
  async getMovimientosByTipo(tipo) {
    return prisma.movimientoContable.findMany({
      where: { tipo },
      include: {
        categoria: true,
        usuario: { select: { id: true, username: true, nombre: true, apellido: true } },
        cuentaBancaria: { select: { id: true, numeroCuenta: true, nombreOficialCuenta: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  },

  async getAllMovimientos() {
    return prisma.movimientoContable.findMany({
      include: {
        categoria: true,
        usuario: { select: { id: true, username: true, nombre: true, apellido: true } },
        cuentaBancaria: { select: { id: true, numeroCuenta: true, nombreOficialCuenta: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  },

  async getMovimientosByMetodo(metodo) {
    return prisma.movimientoContable.findMany({
      where: { metodo },
      include: {
        categoria: true,
        usuario: { select: { id: true, username: true, nombre: true, apellido: true } },
        cuentaBancaria: { select: { id: true, numeroCuenta: true, nombreOficialCuenta: true } },
      },
      orderBy: { fecha: 'desc' },
    });
  },

  async getMovimientoById(id) {
    return prisma.movimientoContable.findUnique({
      where: { id },
      include: {
        categoria: true,
        usuario: { select: { id: true, username: true, nombre: true, apellido: true } },
      },
    });
  },

  async createMovimiento(movimientoData) {
    const { tipo, monto, categoriaId, metodo, cajaId, bankId, cuentaBancariaId, descripcion, usuarioId, fecha, cuentaPorPagarId } = movimientoData;

    // Resolver automáticamente la caja cuando el método es 'caja' o 'papeleria'
    let resolvedCajaId = cajaId;

    if (!resolvedCajaId && metodo === 'caja') {
      const cajaPrincipal = await prisma.caja.findFirst({
        where: {
          OR: [
            { nombre: { equals: 'Caja', mode: 'insensitive' } },
            { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
            { tipo: 'general' },
          ],
          activa: true,
        },
      });
      if (cajaPrincipal) {
        resolvedCajaId = cajaPrincipal.id;
      }
    }

    if (!resolvedCajaId && metodo === 'papeleria') {
      const cajaPapeleria = await prisma.caja.findFirst({
        where: {
          activa: true,
          OR: [
            { nombre: { equals: 'Papeleria', mode: 'insensitive' } },
            { tipo: 'papeleria' },
            { nombre: { contains: 'papeler', mode: 'insensitive' } },
          ],
        },
      });
      if (cajaPapeleria) {
        resolvedCajaId = cajaPapeleria.id;
      }
    }

    const createdMovimiento = await prisma.movimientoContable.create({
      data: {
        tipo,
        monto: parseFloat(monto),
        categoria: { connect: { id: categoriaId } },
        metodo,
        ...(resolvedCajaId && { caja: { connect: { id: resolvedCajaId } } }),
        ...(bankId && { bank: { connect: { id: bankId } } }),
        ...(cuentaBancariaId && { cuentaBancaria: { connect: { id: cuentaBancariaId } } }),
        descripcion,
        usuario: { connect: { id: usuarioId } },
        ...(fecha && { fecha: new Date(fecha) }),
        ...(cuentaPorPagarId && { cuentaPorPagar: { connect: { id: cuentaPorPagarId } } }),
      },
      include: {
        categoria: true,
        usuario: { select: { id: true, username: true, nombre: true, apellido: true } },
        bank: true,
        cuentaBancaria: true,
        caja: true,
      },
    });

    // Si hay una cuenta por pagar asociada, registrar el pago
    if (cuentaPorPagarId && tipo === 'gasto') {
      try {
        await CuentasPorPagarService.registrarPago(cuentaPorPagarId, {
          monto: parseFloat(monto),
          fechaPago: fecha || new Date(),
          metodoPago: metodo,
          observaciones: `Pago registrado desde movimiento contable: ${descripcion || 'S/D'}`,
          usuarioId: usuarioId
        });
      } catch (error) {
        console.error('[CreateMovimiento] Error al registrar pago en cuenta por pagar:', error);
        // No lanzamos el error para no revertir la creación del movimiento, 
        // pero idealmente debería ser atómico.
      }
    }

    // Si el movimiento está asociado a una caja, recalcular su saldo.
    if (createdMovimiento.cajaId) {
      await CajaService.recalculateAndUpdateSaldo(createdMovimiento.cajaId);
    }

    // Actualizar el saldoActual de la cuenta contable asociada
    await updateCuentaContableSaldo(
      categoriaId,
      metodo,
      createdMovimiento.cajaId,
      createdMovimiento.cuentaBancariaId
    );

    return createdMovimiento;
  },

  async updateMovimiento(id, movimientoData) {
    const { tipo, monto, categoriaId, metodo, cajaId, bankId, cuentaBancariaId, descripcion, usuarioId } = movimientoData;

    const oldMovimiento = await prisma.movimientoContable.findUnique({ where: { id } });

    const updatedMovimiento = await prisma.movimientoContable.update({
      where: { id },
      data: {
        tipo,
        monto: parseFloat(monto),
        categoria: { connect: { id: categoriaId } },
        metodo,
        // Si el método es banco, desconectamos la caja explícitamente
        caja: metodo === 'banco' ? { disconnect: true } : (cajaId ? { connect: { id: cajaId } } : undefined),

        // Si el método es caja o papeleria, desconectamos el banco y cuenta bancaria
        bank: (metodo === 'caja' || metodo === 'papeleria') ? { disconnect: true } : (bankId ? { connect: { id: bankId } } : undefined),
        cuentaBancaria: (metodo === 'caja' || metodo === 'papeleria') ? { disconnect: true } : (cuentaBancariaId ? { connect: { id: cuentaBancariaId } } : undefined),

        descripcion,
        ...(usuarioId && { usuario: { connect: { id: usuarioId } } }),
      },
    });

    // Recalcular saldo de la caja antigua si existía y es diferente de la nueva
    if (oldMovimiento && oldMovimiento.cajaId && oldMovimiento.cajaId !== updatedMovimiento.cajaId) {
      await CajaService.recalculateAndUpdateSaldo(oldMovimiento.cajaId);
    }
    // Recalcular saldo de la nueva caja
    if (updatedMovimiento.cajaId) {
      await CajaService.recalculateAndUpdateSaldo(updatedMovimiento.cajaId);
    }

    // Actualizar saldo de la cuenta contable antigua (si cambió categoría, método, etc.)
    if (oldMovimiento && (
      oldMovimiento.categoriaId !== categoriaId ||
      oldMovimiento.metodo !== metodo ||
      oldMovimiento.cajaId !== updatedMovimiento.cajaId ||
      oldMovimiento.cuentaBancariaId !== updatedMovimiento.cuentaBancariaId
    )) {
      await updateCuentaContableSaldo(
        oldMovimiento.categoriaId,
        oldMovimiento.metodo,
        oldMovimiento.cajaId,
        oldMovimiento.cuentaBancariaId
      );
    }

    // Actualizar saldo de la nueva cuenta contable
    await updateCuentaContableSaldo(
      categoriaId,
      metodo,
      updatedMovimiento.cajaId,
      updatedMovimiento.cuentaBancariaId
    );

    // Return updated movimiento with relations
    return await prisma.movimientoContable.findUnique({
      where: { id: updatedMovimiento.id },
      include: {
        categoria: true,
        usuario: { select: { id: true, username: true, nombre: true, apellido: true } },
        cuentaBancaria: { select: { id: true, numeroCuenta: true, nombreOficialCuenta: true } },
      },
    });
  },

  async deleteMovimiento(id) {
    const movimiento = await prisma.movimientoContable.findUnique({ where: { id } });

    if (!movimiento) {
      throw new Error('Movimiento no encontrado');
    }

    const deletedMovimiento = await prisma.movimientoContable.delete({
      where: { id },
    });

    // Si el movimiento estaba asociado a una caja, recalcular su saldo.
    if (movimiento.cajaId) {
      await CajaService.recalculateAndUpdateSaldo(movimiento.cajaId);
    }

    // Actualizar el saldoActual de la cuenta contable después de eliminar
    await updateCuentaContableSaldo(
      movimiento.categoriaId,
      movimiento.metodo,
      movimiento.cajaId,
      movimiento.cuentaBancariaId
    );

    return deletedMovimiento;
  },

  async getBalanceCaja() {
    const caja = await prisma.caja.findFirst({
      where: {
        nombre: { equals: 'Caja Principal', mode: 'insensitive' },
        activa: true
      },
    });
    if (caja) {
      console.log(`[getBalanceCaja] Found Caja: ${caja.nombre} (${caja.id})`);
      const balance = await CajaService.calcularSaldoActual(caja.id);
      console.log(`[getBalanceCaja] Calculated Balance: ${balance}`);
      return balance;
    }
    console.log('[getBalanceCaja] Caja Principal not found');
    return 0;
  },

  async getBalancePapeleria() {
    const caja = await prisma.caja.findFirst({
      where: { tipo: 'papeleria', activa: true },
    });
    if (caja) {
      return CajaService.calcularSaldoActual(caja.id);
    }
    return 0;
  },

  async getBalanceCuentaBancaria(cuentaBancariaId) {
    // This logic might need adjustment depending on how bank accounts are modeled
    // For now, assuming movements directly link to it.
    const agregados = await prisma.movimientoContable.groupBy({
      by: ['tipo'],
      where: {
        cuentaBancariaId: cuentaBancariaId,
        metodo: 'banco'
      },
      _sum: {
        monto: true,
      },
    });

    let totalIngresos = 0;
    let totalGastos = 0;

    agregados.forEach(agregado => {
      if (agregado.tipo === 'ingreso') {
        totalIngresos += agregado._sum.monto || 0;
      } else if (agregado.tipo === 'gasto') {
        totalGastos += agregado._sum.monto || 0;
      }
    });

    // Need to consider initial balance of the bank account
    const cuenta = await prisma.cuentaBancaria.findUnique({ where: { id: cuentaBancariaId }, include: { cuentaContable: true } });
    const saldoInicial = cuenta?.cuentaContable?.saldoInicial || 0;

    return parseFloat(saldoInicial) + totalIngresos - totalGastos;
  },
};

module.exports = movimientoContableService;