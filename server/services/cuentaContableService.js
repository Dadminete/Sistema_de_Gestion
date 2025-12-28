const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

const getBankAccountBalance = async (cuentaBancariaId, saldoInicial) => {
  // 1. Get movements
  const movimientos = await prisma.movimientoContable.findMany({
    where: { cuentaBancariaId },
    select: { tipo: true, monto: true },
  });

  let balance = parseFloat(saldoInicial || 0);

  // Process movements (source of truth including payments, transfers, etc.)
  const balanceMovimientos = movimientos.reduce((acc, mov) => {
    const monto = parseFloat(mov.monto);
    return mov.tipo === 'ingreso' ? acc + monto : acc - monto;
  }, 0);
  balance += balanceMovimientos;

  // Debug log (only if significant)
  if (movimientos.length > 0) {
    // console.log(`[BankCalc] ID: ${cuentaBancariaId} -> Movs: ${movimientos.length}, Balance: ${balance}`);
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
      const balances = await Promise.all(
        cuenta.cuentasBancarias.map(async (cb) => {
          const bal = await getBankAccountBalance(cb.id, 0);
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

  async recalculateAndUpdateSaldo(cuentaId) {
    const nuevoSaldo = await this.calculateAccountBalance(cuentaId);

    await prisma.cuentaContable.update({
      where: { id: cuentaId },
      data: { saldoActual: nuevoSaldo }
    });

    return nuevoSaldo;
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

    return cuentas.map(c => ({
      ...c,
      saldoInicial: parseFloat(c.saldoInicial || 0),
      saldoActual: parseFloat(c.saldoActual || 0)
    }));
  },

  // Exponer balance individual por cuenta bancaria (sin agrupar por cuenta contable)
  async getBankAccountBalance(cuentaBancariaId, saldoInicial = 0) {
    return getBankAccountBalance(cuentaBancariaId, saldoInicial);
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
