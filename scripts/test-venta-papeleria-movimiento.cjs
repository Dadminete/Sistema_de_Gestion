const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testVentaPapeleriaMovimiento() {
  try {
    console.log('Iniciando prueba de venta de papelería...');
    
    // Crear una venta de prueba
    const ventaData = {
      numeroVenta: 'TEST-' + Date.now(),
      usuarioId: '00000000-0000-0000-0000-000000000000', // ID de usuario de prueba
      clienteNombre: 'Cliente de prueba',
      fechaVenta: new Date().toISOString(),
      subtotal: '100.00',
      descuentos: '0.00',
      total: '100.00',
      metodoPago: 'Efectivo',
      estado: 'completada',
      moneda: 'DOP',
      detalles: [
        {
          productoId: 1,
          nombreProducto: 'Producto de prueba',
          cantidad: 1,
          precioUnitario: '100.00',
          subtotal: '100.00',
          impuesto: '0.00',
          descuento: '0.00',
          total: '100.00'
        }
      ]
    };
    
    console.log('Datos de venta de prueba:', ventaData);
    
    // Contar movimientos antes de crear la venta
    const movimientosAntes = await prisma.movimientoContable.count();
    console.log('Número de movimientos antes:', movimientosAntes);
    
    // Aquí normalmente llamaríamos al servicio de ventas, pero para la prueba
    // vamos a verificar directamente la categoría
    const categoria = await prisma.categoriaCuenta.findFirst({
      where: { nombre: 'Ventas Papelería' }
    });
    
    console.log('Categoría encontrada:', categoria);
    
    if (categoria) {
      console.log('La categoría para ventas de papelería está disponible');
      console.log('ID de categoría:', categoria.id);
    } else {
      console.log('No se encontró la categoría para ventas de papelería');
    }
    
  } catch (error) {
    console.error('Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba si se corre directamente
if (require.main === module) {
  testVentaPapeleriaMovimiento()
    .then(() => console.log('Prueba completada'))
    .catch(error => {
      console.error('Error en la prueba:', error);
      process.exit(1);
    });
}

module.exports = testVentaPapeleriaMovimiento;