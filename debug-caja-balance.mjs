import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugCajaBalance() {
  try {
    console.log('=== DEBUGGING CAJA BALANCE ===');

    // Get the Caja account
    const cuentaCaja = await prisma.cuentaContable.findFirst({
      where: { nombre: { contains: 'Caja', mode: 'insensitive' } },
      include: {
        cajas: { where: { activa: true } },
      },
    });

    if (!cuentaCaja) {
      console.log('No Caja account found');
      return;
    }

    console.log('Caja Account:', cuentaCaja);
    console.log('Associated Cajas:', cuentaCaja.cajas);

    if (cuentaCaja.cajas.length === 0) {
      console.log('No active cajas associated with Caja account');
      return;
    }

    // Simulate the getCajaBalance function for each caja
    for (const caja of cuentaCaja.cajas) {
      console.log(`\n--- Calculating balance for Caja: ${caja.nombre} (ID: ${caja.id}) ---`);

      const saldoInicial = parseFloat(caja.saldoInicial || 0);
      console.log('Saldo Inicial:', saldoInicial);

      // Get payments
      const pagos = await prisma.pagoCliente.findMany({
        where: {
          cajaId: caja.id,
          estado: { not: 'anulado' }
        },
        select: { monto: true },
      });
      console.log('Pagos:', pagos.length, 'items');
      const totalPagos = pagos.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);
      console.log('Total Pagos:', totalPagos);

      // Get sales
      const ventas = await prisma.ventaPapeleria.findMany({
        where: {
          cajaId: caja.id,
          estado: { not: 'anulada' }
        },
        select: { total: true },
      });
      console.log('Ventas:', ventas.length, 'items');
      const totalVentas = ventas.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);
      console.log('Total Ventas:', totalVentas);

      // Get accounting entries
      const detallesAsientos = await prisma.detalleAsiento.findMany({
        where: { cajaId: caja.id },
        select: {
          debe: true,
          haber: true,
          asiento: {
            select: {
              estado: true,
            },
          },
        },
      });
      console.log('Detalle Asientos:', detallesAsientos.length, 'items');

      const detallesContabilizados = detallesAsientos.filter(
        d => d.asiento && d.asiento.estado === 'contabilizado'
      );
      console.log('Detalles Contabilizados:', detallesContabilizados.length, 'items');

      const totalAsientos = detallesContabilizados.reduce((sum, detalle) => {
        const debe = parseFloat(detalle.debe || 0);
        const haber = parseFloat(detalle.haber || 0);
        return sum + debe - haber;
      }, 0);
      console.log('Total Asientos:', totalAsientos);

      // Calculate final balance
      let balance = saldoInicial + totalPagos + totalVentas + totalAsientos;
      console.log('Final Balance for this Caja:', balance);
    }

    // Now simulate the full service logic
    console.log('\n--- Simulating Full Service Logic ---');
    let finalBalance = parseFloat(cuentaCaja.saldoInicial || 0);
    console.log('Starting with Saldo Inicial:', finalBalance);

    if (cuentaCaja.cajas.length > 0) {
      const balances = await Promise.all(
        cuentaCaja.cajas.map(async (caja) => {
          const saldoInicialCaja = parseFloat(caja.saldoInicial || 0);

          // Payments
          const pagos = await prisma.pagoCliente.findMany({
            where: { cajaId: caja.id, estado: { not: 'anulado' } },
            select: { monto: true },
          });
          const totalPagos = pagos.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);

          // Sales
          const ventas = await prisma.ventaPapeleria.findMany({
            where: { cajaId: caja.id, estado: { not: 'anulada' } },
            select: { total: true },
          });
          const totalVentas = ventas.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);

          // Accounting entries
          const detallesAsientos = await prisma.detalleAsiento.findMany({
            where: { cajaId: caja.id },
            select: {
              debe: true,
              haber: true,
              asiento: { select: { estado: true } },
            },
          });
          const detallesContabilizados = detallesAsientos.filter(
            d => d.asiento && d.asiento.estado === 'contabilizado'
          );
          const totalAsientos = detallesContabilizados.reduce((sum, detalle) => {
            return sum + parseFloat(detalle.debe || 0) - parseFloat(detalle.haber || 0);
          }, 0);

          return saldoInicialCaja + totalPagos + totalVentas + totalAsientos;
        })
      );
      finalBalance += balances.reduce((sum, balance) => sum + balance, 0);
    }

    console.log('Final Calculated Balance:', finalBalance);
    console.log('Database Saldo Actual:', cuentaCaja.saldoActual);

    // Check movimientoContable for caja
    console.log('\n--- Checking MovimientoContable for Caja ---');
    const movimientosCaja = await prisma.movimientoContable.findMany({
      where: { metodo: 'caja' },
      select: {
        tipo: true,
        monto: true,
        categoriaId: true,
        descripcion: true,
      },
    });
    console.log('Movimientos Caja:', movimientosCaja.length, 'items');
    movimientosCaja.forEach(mov => {
      console.log(`Mov: ${mov.tipo} ${mov.monto} (Categoria: ${mov.categoriaId})`);
    });

    const balanceFromMovimientos = movimientosCaja.reduce((sum, mov) => {
      const monto = parseFloat(mov.monto);
      return mov.tipo === 'ingreso' ? sum + monto : sum - monto;
    }, 0);
    console.log('Balance from Movimientos Caja:', balanceFromMovimientos);

    // Check if categoriaId matches
    if (cuentaCaja.categoriaId) {
      const movimientosByCategoria = await prisma.movimientoContable.findMany({
        where: { categoriaId: cuentaCaja.categoriaId },
        select: { tipo: true, monto: true },
      });
      console.log('Movimientos by Categoria:', movimientosByCategoria.length);
      const balanceByCategoria = movimientosByCategoria.reduce((sum, mov) => {
        return mov.tipo === 'ingreso' ? sum + parseFloat(mov.monto) : sum - parseFloat(mov.monto);
      }, 0);
      console.log('Balance by Categoria:', balanceByCategoria);
    } else {
      console.log('Cuenta Caja has no categoriaId');
    }

    // Check the categories
    console.log('\n--- Checking Categories ---');
    const categorias = await prisma.categoriaCuenta.findMany({
      select: { id: true, codigo: true, nombre: true, tipo: true },
    });
    console.log('Categories:');
    categorias.forEach(cat => {
      console.log(`ID: ${cat.id}, Codigo: ${cat.codigo}, Nombre: ${cat.nombre}, Tipo: ${cat.tipo}`);
    });

    // Find the category for the movimientos
    const categoriaMovimientos = await prisma.categoriaCuenta.findUnique({
      where: { id: 'fa01f062-20fc-409b-93a9-0d36a2f8c7b2' },
      select: { id: true, codigo: true, nombre: true, tipo: true },
    });
    console.log('Category for ingresos:', categoriaMovimientos);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCajaBalance();
