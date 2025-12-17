const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCompleto() {
  try {
    console.log('=== PAGOS CLIENTES ===');
    const pagos = await prisma.pagoCliente.findMany({
      select: {
        id: true,
        numeroPago: true,
        monto: true,
        cajaId: true,
        cuentaBancariaId: true,
        estado: true,
        caja: { select: { nombre: true, cuentaContable: { select: { nombre: true } } } },
        cuentaBancaria: { select: { numeroCuenta: true, bank: { select: { nombre: true } } } }
      }
    });
    pagos.forEach(p => {
      console.log(`Pago ${p.numeroPago}: ${p.monto}, Estado: ${p.estado}`);
      if (p.caja) console.log(`  Caja: ${p.caja.nombre} -> ${p.caja.cuentaContable?.nombre}`);
      if (p.cuentaBancaria) console.log(`  Cuenta: ${p.cuentaBancaria.numeroCuenta} (${p.cuentaBancaria.bank.nombre})`);
    });

    console.log('\n=== VENTAS PAPELERÍA ===');
    const ventas = await prisma.ventaPapeleria.findMany({
      select: {
        id: true,
        numeroVenta: true,
        total: true,
        cajaId: true,
        cuentaBancariaId: true,
        estado: true,
        caja: { select: { nombre: true, cuentaContable: { select: { nombre: true } } } },
        cuentaBancaria: { select: { numeroCuenta: true, bank: { select: { nombre: true } } } }
      }
    });
    ventas.forEach(v => {
      console.log(`Venta ${v.numeroVenta}: ${v.total}, Estado: ${v.estado}`);
      if (v.caja) console.log(`  Caja: ${v.caja.nombre} -> ${v.caja.cuentaContable?.nombre}`);
      if (v.cuentaBancaria) console.log(`  Cuenta: ${v.cuentaBancaria.numeroCuenta} (${v.cuentaBancaria.bank.nombre})`);
    });

    console.log('\n=== ASIENTOS CONTABLES ===');
    const asientos = await prisma.asientoContable.findMany({
      where: { estado: 'contabilizado' },
      include: {
        detalles: {
          include: {
            cuentaContable: { select: { nombre: true } },
            caja: { select: { nombre: true } }
          }
        }
      }
    });
    asientos.forEach(a => {
      console.log(`Asiento ${a.numeroAsiento}: ${a.descripcion}`);
      a.detalles.forEach(d => {
        console.log(`  ${d.cuentaContable.nombre}: Debe ${d.debe}, Haber ${d.haber}`);
        if (d.caja) console.log(`    Caja: ${d.caja.nombre}`);
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompleto();