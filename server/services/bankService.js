const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();
const cuentaBancariaService = require('./cuentaBancariaService'); // Import cuentaBancariaService

// Obtener todos los bancos
const getAllBanks = async () => {
  try {
    const banks = await prisma.bank.findMany({
      where: { activo: true },
      include: {
        cuentas: {
          where: { activo: true },
          select: {
            id: true,
            numeroCuenta: true,
            tipoCuenta: true,
            moneda: true,
            bankId: true,
            nombreOficialCuenta: true,
            cuentaContableId: true,
            activo: true,
            observaciones: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: { nombre: 'asc' }
    });
    return banks;
  } catch (error) {
    console.error('Error en getAllBanks:', error);
    throw error;
  }
};

// Obtener un banco por ID
const getBankById = async (id) => {
  try {
    const bank = await prisma.bank.findUnique({
      where: { id },
      include: {
        cuentas: {
          where: { activo: true },
          select: {
            id: true,
            numeroCuenta: true,
            tipoCuenta: true,
            moneda: true,
            bankId: true,
            nombreOficialCuenta: true,
            cuentaContableId: true,
            activo: true,
            observaciones: true,
            createdAt: true,
            updatedAt: true,
            cuentaContable: {
              select: {
                nombre: true
              }
            }
          }
        }
      }
    });
    return bank;
  } catch (error) {
    console.error('Error en getBankById:', error);
    throw error;
  }
};

// Crear un nuevo banco
const createBank = async (bankData) => {
  try {
    const newBank = await prisma.bank.create({
      data: {
        nombre: bankData.nombre,
        codigo: bankData.codigo,
        activo: bankData.activo !== undefined ? bankData.activo : true
      }
    });
    return newBank;
  } catch (error) {
    console.error('Error en createBank:', error);
    throw error;
  }
};

// Actualizar un banco y sus cuentas bancarias asociadas
const updateBank = async (id, updateData) => {
  try {
    const { cuentas, ...bankData } = updateData;

    const updatedBank = await prisma.bank.update({
      where: { id },
      data: {
        nombre: bankData.nombre,
        codigo: bankData.codigo,
        activo: bankData.activo,
        updatedAt: new Date()
      }
    });

    if (cuentas && Array.isArray(cuentas)) {
      const existingAccounts = await prisma.cuentaBancaria.findMany({
        where: { bankId: id },
        select: { id: true }
      });
      const existingAccountIds = new Set(existingAccounts.map(acc => acc.id));
      const accountsToKeepIds = new Set();

      for (const account of cuentas) {
        if (account.id && existingAccountIds.has(account.id)) {
          // Update existing account
          await cuentaBancariaService.updateAccount(account.id, account);
          accountsToKeepIds.add(account.id);
        } else if (account.id && account.id.startsWith('new-')) {
          // Create new account (temporary ID from frontend)
          await cuentaBancariaService.createAccount({ ...account, bankId: id });
        } else if (!account.id) {
          // Create new account (no ID from frontend)
          await cuentaBancariaService.createAccount({ ...account, bankId: id });
        } else {
          // This case should ideally not happen if frontend sends correct IDs
          console.warn(`Cuenta con ID desconocido o inválido: ${account.id}`);
        }
      }

      // Delete accounts that were removed from the frontend
      for (const existingAccountId of existingAccountIds) {
        if (!accountsToKeepIds.has(existingAccountId)) {
          await cuentaBancariaService.deleteAccount(existingAccountId); // Or deactivate, depending on business logic
        }
      }
    }

    // Re-fetch the bank with updated accounts to return the complete state
    return await getBankById(id);
  } catch (error) {
    console.error('Error en updateBank:', error);
    throw error;
  }
};

// Eliminar un banco (desactivar)
const deleteBank = async (id) => {
  try {
    console.log(`🔍 [DELETE BANK] Intentando eliminar banco con ID: ${id}`);

    // Verificar si existe el banco primero
    const bankExists = await prisma.bank.findUnique({
      where: { id }
    });

    if (!bankExists) {
      console.log(`❌ [DELETE BANK] Banco con ID ${id} no encontrado`);
      throw new Error('Banco no encontrado');
    }

    console.log(`✅ [DELETE BANK] Banco encontrado: ${bankExists.nombre} (Activo: ${bankExists.activo})`);

    // Verificar si tiene cuentas activas
    console.log(`🔍 [DELETE BANK] Verificando cuentas activas para banco ${id}...`);
    const cuentasActivas = await prisma.cuentaBancaria.count({
      where: { bankId: id, activo: true }
    });

    console.log(`📊 [DELETE BANK] Cuentas activas encontradas: ${cuentasActivas}`);

    if (cuentasActivas > 0) {
      // Obtener detalles de las cuentas activas para mejor debugging
      const activeAccounts = await prisma.cuentaBancaria.findMany({
        where: { bankId: id, activo: true },
        select: { id: true, numeroCuenta: true, activo: true, bankId: true }
      });
      console.log('🚫 [DELETE BANK] Cuentas activas encontradas:', activeAccounts);

      const errorMsg = `No se puede eliminar el banco "${bankExists.nombre}" porque tiene ${cuentasActivas} cuenta(s) activa(s) asociada(s). Desactive primero todas las cuentas bancarias.`;
      console.log(`❌ [DELETE BANK] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    console.log(`✅ [DELETE BANK] No hay cuentas activas, procediendo con verificación adicional...`);

    // Verificar si tiene movimientos contables asociados
    const movimientosCount = await prisma.cuentaBancaria.count({
      where: { bankId: id }
    });

    console.log(`📊 [DELETE BANK] Movimientos contables encontrados: ${movimientosCount}`);

    if (movimientosCount > 0) {
      const errorMsg = `No se puede eliminar el banco porque tiene ${movimientosCount} movimiento(s) contable(s) asociado(s)`;
      console.log(`❌ [DELETE BANK] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Nota: Las cuentas bancarias inactivas pueden permanecer asociadas al banco desactivado

    // Si llega aquí, se puede eliminar (desactivar) el banco
    console.log('✅ [DELETE BANK] Procediendo con la desactivación del banco...');
    const deletedBank = await prisma.bank.update({
      where: { id },
      data: {
        activo: false,
        updatedAt: new Date()
      }
    });

    console.log(`✅ [DELETE BANK] Banco "${deletedBank.nombre}" desactivado exitosamente`);
    return deletedBank;
  } catch (error) {
    console.error('❌ [DELETE BANK] Error en deleteBank:', error);

    // Si es un error de restricción de foreign key, dar mensaje más específico
    if (error.code === 'P2003') {
      const errorMsg = 'No se puede eliminar el banco porque tiene datos asociados. Elimine primero las cuentas bancarias y movimientos relacionados.';
      console.log(`❌ [DELETE BANK] Error P2003: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Log detallado del error antes de re-lanzarlo
    console.error('❌ [DELETE BANK] Error completo:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });

    // Re-lanzar el error para que llegue al controlador
    throw error;
  }
};

// Obtener pagos de clientes por banco/cuenta bancaria
const getClientPaymentsByBank = async (bankId) => {
  try {
    // Obtener todas las cuentas del banco
    const cuentas = await prisma.cuentaBancaria.findMany({
      where: { bankId }
    });

    if (cuentas.length === 0) {
      return [];
    }

    const cuentaIds = cuentas.map(c => c.id);

    // Obtener todos los pagos para estas cuentas
    const pagos = await prisma.pagoCliente.findMany({
      where: {
        cuentaBancariaId: { in: cuentaIds },
        estado: 'confirmado'
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            codigoCliente: true,
            email: true
          }
        },
        factura: {
          select: {
            id: true,
            numeroFactura: true
          }
        },
        cuentaBancaria: {
          select: {
            id: true,
            numeroCuenta: true,
            nombreOficialCuenta: true
          }
        },
        recibidoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: { fechaPago: 'desc' }
    });

    return pagos;
  } catch (error) {
    console.error('Error en getClientPaymentsByBank:', error);
    throw error;
  }
};

module.exports = {
  getAllBanks,
  getBankById,
  createBank,
  updateBank,
  deleteBank,
  getClientPaymentsByBank
};
