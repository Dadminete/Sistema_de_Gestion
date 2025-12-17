const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSaldos() {
  try {
    console.log('=== CUENTAS CONTABLES ===');
    const cuentas = await prisma.cuentaContable.findMany({
      where: { activa: true },
      include: {
        cajas: { where: { activa: true } },
        cuentasBancarias: { where: { activo: true } },
      }
    });

    for (const cuenta of cuentas) {
      console.log(`\nCuenta: ${cuenta.nombre} (ID: ${cuenta.id})`);
      console.log(`  Saldo inicial: ${cuenta.saldoInicial}`);
      console.log(`  Saldo actual DB: ${cuenta.saldoActual}`);

      if (cuenta.nombre.toLowerCase().includes('caja')) {
        console.log('  Es cuenta de caja - Calculando balance...');

        if (cuenta.cajas && cuenta.cajas.length > 0) {
          for (const caja of cuenta.cajas) {
            console.log(`    Caja: ${caja.nombre} (ID: ${caja.id})`);
            console.log(`    Saldo inicial caja: ${caja.saldoInicial}`);

            // Calcular pagos
            const pagos = await prisma.pagoCliente.findMany({
              where: { cajaId: caja.id, estado: { not: 'anulado' } }
            });
            const totalPagos = pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);
            console.log(`    Pagos: ${totalPagos}`);

            // Calcular ventas
            const ventas = await prisma.ventaPapeleria.findMany({
              where: { cajaId: caja.id, estado: { not: 'anulada' } }
            });
            const totalVentas = ventas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
            console.log(`    Ventas: ${totalVentas}`);

            // Calcular asientos
            const detallesAsientos = await prisma.detalleAsiento.findMany({
              where: { cajaId: caja.id },
              include: { asiento: true }
            });
            const detallesContabilizados = detallesAsientos.filter(d => d.asiento && d.asiento.estado === 'contabilizado');
            const totalAsientos = detallesContabilizados.reduce((sum, d) => {
              const debe = parseFloat(d.debe || 0);
              const haber = parseFloat(d.haber || 0);
              return sum + debe - haber;
            }, 0);
            console.log(`    Asientos contabilizados: ${totalAsientos}`);

            // Calcular movimientos
            const movimientos = await prisma.movimientoContable.findMany({
              where: { metodo: 'caja' }
            });
            const totalMovimientos = movimientos.reduce((sum, m) => {
              const monto = parseFloat(m.monto);
              return m.tipo === 'ingreso' ? sum + monto : sum - monto;
            }, 0);
            console.log(`    Movimientos: ${totalMovimientos}`);

            const balanceCaja = parseFloat(caja.saldoInicial || 0) + totalPagos + totalVentas + totalAsientos + totalMovimientos;
            console.log(`    Balance calculado caja: ${balanceCaja}`);
          }
        }
      } else if (cuenta.cuentasBancarias && cuenta.cuentasBancarias.length > 0) {
        console.log('  Es cuenta bancaria - Calculando balance...');
        // Similar logic for bank accounts
      } else {
        console.log('  Cuenta normal - usando saldoActual de DB');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSaldos();