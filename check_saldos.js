const { PrismaClient } = require('./prisma');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const movimientos = await prisma.movimientoContable.count();
    const pagos = await prisma.pagoCliente.count();
    const ventas = await prisma.ventaPapeleria.count();
    const asientos = await prisma.detalleAsiento.count();

    console.log('Movimientos contables:', movimientos);
    console.log('Pagos clientes:', pagos);
    console.log('Ventas papelería:', ventas);
    console.log('Detalles asientos:', asientos);

    // Check cuentas contables
    const cuentas = await prisma.cuentaContable.findMany({
      where: { activa: true },
      select: { id: true, nombre: true, saldoInicial: true, saldoActual: true }
    });

    console.log('Cuentas contables:');
    cuentas.forEach(c => {
      console.log(`  ${c.nombre}: Inicial ${c.saldoInicial}, Actual ${c.saldoActual}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();