const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

const getBankAccountBalance = async (cuentaBancariaId, saldoInicial) => {
  // 1. Get movements
  const movimientos = await prisma.movimientoContable.findMany({
    where: { cuentaBancariaId },
    select: { tipo: true, monto: true },
  });

  // 2. Get payments from clients
  const pagos = await prisma.pagoCliente.findMany({
    where: {
      cuentaBancariaId,
      estado: 'confirmado'
    },
    select: { monto: true }
  });

  let balance = parseFloat(saldoInicial || 0);

  // Add payments (always positive income)
  const totalPagos = pagos.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);
  balance += totalPagos;

  // Process movements
  const balanceMovimientos = movimientos.reduce((acc, mov) => {
    const monto = parseFloat(mov.monto);
    return mov.tipo === 'ingreso' ? acc + monto : acc - monto;
  }, 0);
  balance += balanceMovimientos;

  // Debug log (only if significant)
  if (movimientos.length > 0 || pagos.length > 0) {
    // console.log(`[BankCalc] ID: ${cuentaBancariaId} -> Movs: ${movimientos.length}, Pagos: ${pagos.length}, Balance: ${balance}`);
  }

  return balance;
};

const getCajaBalance = async (cajaId, saldoInicial) => {
  // Solo usar movimientosContable como fuente única de verdad
  const movimientos = await prisma.movimientoContable.findMany({
    where: { 
      cajaId: cajaId
    },
    select: { tipo: true, monto: true },
  });

  // Calcular balance desde movimientos únicamente
  let balance = parseFloat(saldoInicial || 0);

  // Procesar movimientos: ingresos aumentan, egresos disminuyen
  balance += movimientos.reduce((sum, mov) => {
    const monto = parseFloat(mov.monto || 0);
    return mov.tipo === 'ingreso' ? sum + monto : sum - monto;
  }, 0);

  return balance;
};

const CuentaContableService = {
  async getCategoriaIdsRecursive(categoriaId) {
    const categoria = await prisma.categoriaCuenta.findUnique({
      where: { id: categoriaId },
      include: { subcategorias: true }
    });

    if (!categoria) return [];

    const ids = [categoriaId];

    // Recursively get subcategory IDs
    for (const subcat of categoria.subcategorias) {
      const subIds = await this.getCategoriaIdsRecursive(subcat.id);
      ids.push(...subIds);
    }

    return ids;
  },

  async getGenericAccountBalance(cuentaId, saldoInicial) {
    // Get the categoriaId of the cuenta
    const cuenta = await prisma.cuentaContable.findUnique({
      where: { id: cuentaId },
      select: { categoriaId: true }
    });

    if (!cuenta || !cuenta.categoriaId) return parseFloat(saldoInicial || 0);

    // Get all categoria ids in hierarchy
    const categoriaIds = await this.getCategoriaIdsRecursive(cuenta.categoriaId);

    // Get movimientos
    const movimientos = await prisma.movimientoContable.findMany({
      where: { categoriaId: { in: categoriaIds } },
      select: { tipo: true, monto: true },
    });

    const balance = movimientos.reduce((acc, mov) => {
      const monto = parseFloat(mov.monto);
      return mov.tipo === 'ingreso' ? acc + monto : acc - monto;
    }, parseFloat(saldoInicial || 0));

    return balance;
  },

  async calculateAccountBalance(cuentaId) {
    const cuenta = await prisma.cuentaContable.findUnique({
      where: { id: cuentaId },
      include: {
        cajas: { where: { activa: true } },
        cuentasBancarias: true, // Include all, even inactive ones, for balance accuracy
      },
    });

    if (!cuenta) return 0;

    let finalBalance = 0;
    const saldoInicial = parseFloat(cuenta.saldoInicial || 0);

    // For CAJAS
    if (cuenta.cajas && cuenta.cajas.length > 0) {
      // For legacy compatibility or if distinct logic needed per caja, iterate.
      // Typically 1-to-1 but schema allows 1-to-many.
      // Note: getCajaBalance includes saldoInicial internally, so we pass 0 here sum it once at end
      // OR better: sum raw movements and add account's saldoInicial at the very end.

      // However, getCajaBalance is designed to take a saldoInicial.
      // If multiple cajas, we shouldn't pass the main account's saldoInicial to each.
      // We pass 0 to get the net movement, and add account saldoInicial at end.
      const balances = await Promise.all(
        cuenta.cajas.map(caja => getCajaBalance(caja.id, 0))
      );
      finalBalance = balances.reduce((sum, b) => sum + b, 0) + saldoInicial;
    }
    // For BANKS
    else if (cuenta.cuentasBancarias && cuenta.cuentasBancarias.length > 0) {
      console.log(`[CalculateBalance] Processing ${cuenta.cuentasBancarias.length} bank accounts for ${cuenta.nombre} (${cuenta.id})`);

      const balances = await Promise.all(
        cuenta.cuentasBancarias.map(async (cb) => {
          const bal = await getBankAccountBalance(cb.id, 0);
          console.log(`  > Account: ${cb.nombreOficialCuenta} (${cb.tipoCuenta}) - ID: ${cb.id} - Active: ${cb.activo} - Balance: ${bal}`);
          return bal;
        })
      );
      finalBalance = balances.reduce((sum, b) => sum + b, 0) + saldoInicial;
    }
    // For GENERIC accounts
    else {
      finalBalance = await this.getGenericAccountBalance(cuenta.id, saldoInicial);
    }

    return finalBalance;
  },

  async getAll() {
    const cuentas = await prisma.cuentaContable.findMany({
      where: { activa: true },
      include: {
        cajas: { where: { activa: true } },
        cuentasBancarias: { where: { activo: true } },
      },
      orderBy: { codigo: 'asc' },
    });

    const cuentasWithCorrectedBalance = await Promise.all(
      cuentas.map(async (cuenta) => {
        // Use the centralized calculation logic
        const finalBalance = await this.calculateAccountBalance(cuenta.id);

        return {
          id: cuenta.id,
          codigo: cuenta.codigo,
          nombre: cuenta.nombre,
          categoriaId: cuenta.categoriaId,
          tipoCuenta: cuenta.tipoCuenta,
          moneda: cuenta.moneda,
          saldoInicial: parseFloat(cuenta.saldoInicial || 0),
          saldoActual: finalBalance,
          activa: cuenta.activa,
          createdAt: cuenta.createdAt,
          updatedAt: cuenta.updatedAt,
        };
      })
    );

    return cuentasWithCorrectedBalance;
  },

  async getById(id) {
    return prisma.cuentaContable.findUnique({
      where: { id },
    });
  },

  async create(data) {
    return prisma.cuentaContable.create({
      data,
    });
  },

  async update(id, data) {
    return prisma.cuentaContable.update({
      where: { id },
      data,
    });
  },

  async delete(id) {
    return prisma.cuentaContable.delete({
      where: { id },
    });
  },
};

module.exports = { CuentaContableService };
