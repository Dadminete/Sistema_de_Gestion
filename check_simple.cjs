const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSimple() {
  try {
    console.log('=== PAGOS CLIENTES ===');
    const pagos = await prisma.pagoCliente.findMany({
      select: {
        id: true,
        numeroPago: true,
        monto: true,
        cajaId: true,
        cuentaBancariaId: true,
        estado: true
      }
    });
    console.log(`Total pagos: ${pagos.length}`);
    pagos.forEach(p => {
      console.log(`Pago ${p.numeroPago}: ${p.monto}, Estado: ${p.estado}`);
    });

    console.log('\n=== VENTAS PAPELERÍA ===');
    const ventas = await prisma.ventaPapeleria.findMany({
      select: {
        id: true,
        numeroVenta: true,
        total: true,
        cajaId: true,
        cuentaBancariaId: true,
        estado: true
      }
    });
    console.log(`Total ventas: ${ventas.length}`);
    ventas.forEach(v => {
      console.log(`Venta ${v.numeroVenta}: ${v.total}, Estado: ${v.estado}`);
    });

    console.log('\n=== ASIENTOS CONTABLES ===');
    const asientos = await prisma.asientoContable.count({
      where: { estado: 'contabilizado' }
    });
    console.log(`Asientos contabilizados: ${asientos}`);

    console.log('\n=== DETALLES ASIENTOS ===');
    const detalles = await prisma.detalleAsiento.count();
    console.log(`Total detalles asientos: ${detalles}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSimple();