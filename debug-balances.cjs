const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugBalances() {
  try {
    console.log('=== DEBUGGING BALANCES ===');

    // Check all cajas
    const allCajas = await prisma.caja.findMany();
    console.log('All cajas:', allCajas.length, 'items');
    if (allCajas.length > 0) {
      console.log('Sample caja:', allCajas[0]);
    }

    // Check all cuentas contables
    const allCuentas = await prisma.cuentaContable.findMany();
    console.log('All cuentas contables:', allCuentas.length, 'items');
    allCuentas.forEach(cuenta => {
      console.log(`Cuenta ${cuenta.codigo}: ${cuenta.nombre} - Saldo: ${cuenta.saldoActual}`);
    });

    // Check movimientos
    const allMovimientos = await prisma.movimientoContable.findMany();
    console.log('All movimientos:', allMovimientos.length, 'items');
    allMovimientos.forEach(mov => {
      console.log(`Movimiento: ${mov.tipo} ${mov.metodo} ${mov.monto}`);
    });

    const movimientosCaja = await prisma.movimientoContable.findMany({
      where: { metodo: 'caja' }
    });
    console.log('Movimientos caja:', movimientosCaja.length);

    const movimientosPapeleria = await prisma.movimientoContable.findMany({
      where: { metodo: 'papeleria' }
    });
    console.log('Movimientos papeleria:', movimientosPapeleria.length);

    // Calculate balances
    const balanceCaja = movimientosCaja.reduce((sum, mov) =>
      sum + (mov.tipo === 'ingreso' ? parseFloat(mov.monto) : -parseFloat(mov.monto)), 0);
    console.log('Balance calculado caja:', balanceCaja);

    const balancePapeleria = movimientosPapeleria.reduce((sum, mov) =>
      sum + (mov.tipo === 'ingreso' ? parseFloat(mov.monto) : -parseFloat(mov.monto)), 0);
    console.log('Balance calculado papeleria:', balancePapeleria);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBalances();