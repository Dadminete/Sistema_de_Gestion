const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVentas() {
  try {
    const ventas = await prisma.ventaPapeleria.findMany({
      select: {
        id: true,
        numeroVenta: true,
        total: true,
        cajaId: true,
        estado: true,
        caja: {
          select: {
            nombre: true,
            cuentaContableId: true,
            cuentaContable: {
              select: { nombre: true }
            }
          }
        }
      }
    });

    console.log('Ventas de papelería:');
    ventas.forEach(v => {
      console.log(`  Venta ${v.numeroVenta}: Total ${v.total}, Estado ${v.estado}`);
      if (v.caja) {
        console.log(`    Caja: ${v.caja.nombre}, Cuenta contable: ${v.caja.cuentaContable?.nombre}`);
      }
    });

    // Check if there are any movimientos in ventas that might affect balances
    const detalles = await prisma.detalleVentaPapeleria.findMany({
      select: {
        ventaId: true,
        productoId: true,
        cantidad: true,
        precioUnitario: true,
        total: true
      }
    });

    console.log('\nDetalles de ventas:');
    detalles.forEach(d => {
      console.log(`  Venta ID ${d.ventaId}: Cantidad ${d.cantidad}, Precio ${d.precioUnitario}, Total ${d.total}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVentas();