const prisma = require('./server/prismaClient');

async function checkAlberto() {
  try {
    // Find Alberto
    const cliente = await prisma.cliente.findFirst({
      where: {
        nombre: {
          contains: 'Alberto',
          mode: 'insensitive'
        }
      }
    });

    if (!cliente) {
      console.log('❌ Cliente Alberto no encontrado');
      process.exit(0);
    }

    console.log('\n✅ Cliente encontrado:');
    console.log(`   Nombre: ${cliente.nombre} ${cliente.apellidos}`);
    console.log(`   ID: ${cliente.id}`);
    console.log(`   Código: ${cliente.codigoCliente}`);

    // Get all subscriptions for this client
    const suscripciones = await prisma.suscripcion.findMany({
      where: {
        clienteId: cliente.id
      },
      include: {
        servicio: {
          select: {
            id: true,
            nombre: true,
            precioBase: true
          }
        },
        plan: {
          select: {
            id: true,
            nombre: true,
            precio: true
          }
        }
      }
    });

    console.log(`\n📊 Total de suscripciones: ${suscripciones.length}`);
    
    let total = 0;
    suscripciones.forEach((sus, index) => {
      const precioMensual = Number(sus.precioMensual);
      total += precioMensual;
      console.log(`\n   Suscripción ${index + 1}:`);
      console.log(`   - ID: ${sus.id}`);
      console.log(`   - Contrato: ${sus.numeroContrato}`);
      console.log(`   - Precio Mensual: RD$ ${precioMensual}`);
      console.log(`   - Descuento: ${Number(sus.descuentoAplicado)}%`);
      console.log(`   - Plan: ${sus.plan?.nombre || 'N/A'}`);
      console.log(`   - Servicio: ${sus.servicio?.nombre || 'N/A'}`);
      console.log(`   - Estado: ${sus.estado}`);
      console.log(`   - Fecha Inicio: ${sus.fechaInicio}`);
    });

    console.log(`\n💰 TOTAL CALCULADO: RD$ ${total}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAlberto();
