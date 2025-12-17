const prisma = require('./server/prismaClient');

async function testPagoEnCaja() {
  try {
    console.log('\n=== TEST: CREAR PAGO EN CAJA ===\n');

    // Obtener Caja Principal
    const cajaPrincipal = await prisma.caja.findFirst({
      where: {
        OR: [
          { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
          { tipo: 'general' }
        ]
      }
    });

    if (!cajaPrincipal) {
      console.error('❌ No se encontró Caja Principal');
      return;
    }

    console.log(`✅ Caja Principal encontrada: ${cajaPrincipal.nombre} (${cajaPrincipal.id})\n`);

    // Obtener un cliente
    const cliente = await prisma.cliente.findFirst();
    if (!cliente) {
      console.error('❌ No hay clientes disponibles');
      return;
    }

    console.log(`✅ Cliente encontrado: ${cliente.nombre} (${cliente.id})\n`);

    // Crear pago de prueba
    const numeroPago = `TEST-${Date.now()}`;
    const pago = await prisma.pagoCliente.create({
      data: {
        clienteId: cliente.id,
        numeroPago,
        fechaPago: new Date(),
        monto: 500,
        metodoPago: 'efectivo',
        cajaId: cajaPrincipal.id, // ✅ Asignar cajaId
        estado: 'confirmado',
        recibidoPorId: null
      }
    });

    console.log(`✅ Pago creado exitosamente:`);
    console.log(`   Número: ${pago.numeroPago}`);
    console.log(`   Monto: RD$ ${parseFloat(pago.monto)}`);
    console.log(`   cajaId: ${pago.cajaId}`);
    console.log(`   Estado: ${pago.estado}\n`);

    // Verificar que el pago aparece en consultas
    const pagosEnCaja = await prisma.pagoCliente.aggregate({
      _sum: { monto: true },
      where: {
        cajaId: cajaPrincipal.id,
        estado: 'confirmado',
        fechaPago: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    });

    console.log(`📊 Total de ingresos por caja hoy: RD$ ${parseFloat(pagosEnCaja._sum.monto || 0)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPagoEnCaja();
