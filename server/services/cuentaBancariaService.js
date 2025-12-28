const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

// Obtener cuentas por ID de banco
const getAccountsByBankId = async (bankId) => {
  try {
    const accounts = await prisma.cuentaBancaria.findMany({
      where: {
        bankId,
        activo: true
      },
      include: {
        cuentaContable: {
          select: {
            nombre: true,
            saldoActual: true
          }
        }
      },
      orderBy: { numeroCuenta: 'asc' }
    });

    const { CuentaContableService } = require('./cuentaContableService');

    // Transform the data to match frontend expectations
    const transformedAccounts = await Promise.all(accounts.map(async (account) => {
      // Calculate balance using centralized logic
      const balance = await CuentaContableService.getBankAccountBalance(account.id, 0);

      return {
        id: account.id,
        bankId: account.bankId, // Add bankId for editing
        nombre: account.nombreOficialCuenta || account.numeroCuenta, // Use nombreOficialCuenta or numeroCuenta as nombre
        saldo: balance,
        numeroCuenta: account.numeroCuenta,
        tipoCuenta: account.tipoCuenta,
        moneda: account.moneda,
        nombreOficialCuenta: account.nombreOficialCuenta,
        cuentaContableId: account.cuentaContableId,
        activo: account.activo,
        observaciones: account.observaciones,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        cuentaContable: account.cuentaContable
      };
    }));

    return transformedAccounts;
  } catch (error) {
    console.error('Error en getAccountsByBankId:', error);
    throw error;
  }
};

// Obtener una cuenta bancaria por ID
const getAccountById = async (id) => {
  try {
    const account = await prisma.cuentaBancaria.findUnique({
      where: { id },
      include: {
        bank: {
          select: {
            nombre: true,
            codigo: true
          }
        },
        cuentaContable: {
          select: {
            nombre: true,
            saldoActual: true
          }
        }
      }
    });
    return account;
  } catch (error) {
    console.error('Error en getAccountById:', error);
    throw error;
  }
};

// Crear una nueva cuenta bancaria
const createAccount = async (accountData) => {
  try {
    // Validate cuentaContableId
    if (!accountData.cuentaContableId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountData.cuentaContableId)) {
      throw new Error('El ID de cuenta contable es requerido y debe ser un UUID válido.');
    }

    // Check if cuentaContableId exists
    const cuentaContable = await prisma.cuentaContable.findUnique({
      where: { id: accountData.cuentaContableId },
    });
    if (!cuentaContable) {
      throw new Error(`La cuenta contable con ID ${accountData.cuentaContableId} no existe.`);
    }

    const newAccount = await prisma.cuentaBancaria.create({
      data: {
        bankId: accountData.bankId,
        numeroCuenta: accountData.numeroCuenta,
        tipoCuenta: accountData.tipoCuenta,
        moneda: accountData.moneda || 'DOP',
        nombreOficialCuenta: accountData.nombreOficialCuenta,
        cuentaContableId: accountData.cuentaContableId,
        activo: accountData.activo !== undefined ? accountData.activo : true,
        observaciones: accountData.observaciones
      },
      include: {
        bank: {
          select: {
            nombre: true
          }
        },
        cuentaContable: {
          select: {
            nombre: true
          }
        }
      }
    });
    return newAccount;
  } catch (error) {
    console.error('Error en createAccount:', error);
    if (error.code === 'P2002') {
      throw new Error(`El ID de cuenta contable "${error.meta.target}" ya existe. Por favor, genere uno nuevo.`);
    }
    throw error;
  }
};

// Actualizar una cuenta bancaria
const updateAccount = async (id, updateData) => {
  try {
    // Validate cuentaContableId
    if (updateData.cuentaContableId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updateData.cuentaContableId)) {
      throw new Error('El ID de cuenta contable debe ser un UUID válido.');
    }

    // Check if cuentaContableId exists
    if (updateData.cuentaContableId) {
      const cuentaContable = await prisma.cuentaContable.findUnique({
        where: { id: updateData.cuentaContableId },
      });
      if (!cuentaContable) {
        throw new Error(`La cuenta contable con ID ${updateData.cuentaContableId} no existe.`);
      }
    }

    const updatedAccount = await prisma.cuentaBancaria.update({
      where: { id },
      data: {
        numeroCuenta: updateData.numeroCuenta,
        tipoCuenta: updateData.tipoCuenta,
        moneda: updateData.moneda,
        nombreOficialCuenta: updateData.nombreOficialCuenta,
        cuentaContableId: updateData.cuentaContableId,
        activo: updateData.activo,
        observaciones: updateData.observaciones,
        updatedAt: new Date()
      },
      include: {
        bank: {
          select: {
            nombre: true
          }
        },
        cuentaContable: {
          select: {
            nombre: true,
            saldoActual: true
          }
        }
      }
    });
    return updatedAccount;
  } catch (error) {
    console.error('Error en updateAccount:', error);
    if (error.code === 'P2002') {
      throw new Error(`El ID de cuenta contable "${error.meta.target}" ya existe. Por favor, genere uno nuevo.`);
    }
    throw error;
  }
};

// Eliminar una cuenta bancaria (desactivar)
const deleteAccount = async (id) => {
  try {
    // Verificar si tiene transacciones relacionadas
    const pagosCount = await prisma.pagoCliente.count({
      where: { cuentaBancariaId: id }
    });

    const ventasCount = await prisma.ventaPapeleria.count({
      where: { cuentaBancariaId: id }
    });

    if (pagosCount > 0 || ventasCount > 0) {
      throw new Error('No se puede eliminar la cuenta porque tiene transacciones relacionadas');
    }

    const deletedAccount = await prisma.cuentaBancaria.update({
      where: { id },
      data: {
        activo: false,
        updatedAt: new Date()
      }
    });
    return deletedAccount;
  } catch (error) {
    console.error('Error en deleteAccount:', error);
    throw error;
  }
};

// Obtener movimientos de una cuenta (ingresos/gastos)
const getAccountMovements = async (accountId, startDate, endDate) => {
  try {
    // Obtener pagos relacionados
    const pagos = await prisma.pagoCliente.findMany({
      where: {
        cuentaBancariaId: accountId,
        fechaPago: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        fechaPago: true,
        monto: true,
        metodoPago: true,
        numeroReferencia: true,
        estado: true
      }
    });

    // Obtener ventas relacionadas
    const ventas = await prisma.ventaPapeleria.findMany({
      where: {
        cuentaBancariaId: accountId,
        fechaVenta: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        fechaVenta: true,
        total: true,
        metodoPago: true,
        estado: true
      }
    });

    // Combinar y ordenar por fecha
    const movements = [
      ...pagos.map(p => ({
        id: p.id,
        fecha: p.fechaPago,
        tipo: 'ingreso',
        monto: p.monto,
        descripcion: `Pago ${p.metodoPago} - ${p.numeroReferencia || ''}`,
        estado: p.estado
      })),
      ...ventas.map(v => ({
        id: v.id,
        fecha: v.fechaVenta,
        tipo: 'ingreso',
        monto: v.total,
        descripcion: `Venta ${v.metodoPago}`,
        estado: v.estado
      }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return movements;
  } catch (error) {
    console.error('Error en getAccountMovements:', error);
    throw error;
  }
};

module.exports = {
  getAccountsByBankId,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountMovements
};
