const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugBalances() {
  try {
    console.log('=== DEBUGGING BALANCES ===');

    // Check caja table
    const caja = await prisma.caja.findFirst({
      where: { tipo: 'general', activa: true }
    });
    console.log('Caja general:', caja);

    const cajaPapeleria = await prisma.caja.findFirst({
      where: { tipo: 'papeleria', activa: true }
    });
    console.log('Caja papeleria:', cajaPapeleria);

    // Check movimientos
    const movimientosCaja = await prisma.movimientoContable.findMany({
      where: { metodo: 'caja' }
    });
    console.log('Movimientos caja:', movimientosCaja.length);

    const movimientosPapeleria = await prisma.movimientoContable.findMany({
      where: { metodo: 'papeleria' }
    });
    console.log('Movimientos papeleria:', movimientosPapeleria.length);

    // Check cuentas contables
    const cuentaCaja = await prisma.cuentaContable.findFirst({
      where: { codigo: '001', activa: true }
    });
    console.log('Cuenta contable caja:', cuentaCaja);

    const cuentaPapeleria = await prisma.cuentaContable.findFirst({
      where: { codigo: '003', activa: true }
    });
    console.log('Cuenta contable papeleria:', cuentaPapeleria);

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