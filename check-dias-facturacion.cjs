const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function checkDiasFacturacion() {
  try {
    console.log('🔍 Verificando distribución de días de facturación...\n');

    // Día 15
    const dia15 = await prisma.suscripcion.findMany({
      where: {
        diaFacturacion: 15,
        estado: { in: ['activo', 'Activo', 'ACTIVO'] }
      },
      select: {
        id: true,
        diaFacturacion: true,
        precioMensual: true,
        estado: true,
        cliente: {
          select: {
            nombre: true,
            apellidos: true
          }
        }
      }
    });

    console.log(`📅 Clientes con día de facturación 15: ${dia15.length}`);
    let totalDia15 = 0;
    dia15.forEach((s, i) => {
      const precio = parseFloat(s.precioMensual);
      totalDia15 += precio;
      console.log(`   ${i + 1}. ${s.cliente.nombre} ${s.cliente.apellidos} - RD$${precio} - Estado: ${s.estado}`);
    });
    console.log(`   💰 Total Día 15: RD$${totalDia15.toFixed(2)}\n`);

    // Días 30, 20, 10
    const otrosDias = await prisma.suscripcion.findMany({
      where: {
        diaFacturacion: { in: [30, 20, 10] },
        estado: { in: ['activo', 'Activo', 'ACTIVO'] }
      },
      select: {
        id: true,
        diaFacturacion: true,
        precioMensual: true,
        estado: true,
        cliente: {
          select: {
            nombre: true,
            apellidos: true
          }
        }
      },
      orderBy: {
        diaFacturacion: 'asc'
      }
    });

    console.log(`📅 Clientes con día de facturación 30, 20, 10: ${otrosDias.length}`);
    let totalOtrosDias = 0;
    const porDia = { 10: [], 20: [], 30: [] };
    
    otrosDias.forEach(s => {
      const precio = parseFloat(s.precioMensual);
      totalOtrosDias += precio;
      if (porDia[s.diaFacturacion]) {
        porDia[s.diaFacturacion].push(s);
      }
    });

    [10, 20, 30].forEach(dia => {
      if (porDia[dia].length > 0) {
        console.log(`\n   Día ${dia}: ${porDia[dia].length} clientes`);
        let subtotal = 0;
        porDia[dia].forEach((s, i) => {
          const precio = parseFloat(s.precioMensual);
          subtotal += precio;
          console.log(`      ${i + 1}. ${s.cliente.nombre} ${s.cliente.apellidos} - RD$${precio} - Estado: ${s.estado}`);
        });
        console.log(`      Subtotal Día ${dia}: RD$${subtotal.toFixed(2)}`);
      }
    });

    console.log(`\n   💰 Total Otros Días: RD$${totalOtrosDias.toFixed(2)}\n`);

    // Total general
    console.log(`📊 RESUMEN:`);
    console.log(`   Día 15: RD$${totalDia15.toFixed(2)}`);
    console.log(`   Días 30, 20, 10: RD$${totalOtrosDias.toFixed(2)}`);
    console.log(`   Total: RD$${(totalDia15 + totalOtrosDias).toFixed(2)}`);

    // Verificar actualización reciente
    const ultimaActualizacion = await prisma.suscripcion.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        diaFacturacion: true,
        updatedAt: true,
        cliente: {
          select: {
            nombre: true,
            apellidos: true
          }
        }
      }
    });

    if (ultimaActualizacion) {
      console.log(`\n🕒 Última suscripción actualizada:`);
      console.log(`   ${ultimaActualizacion.cliente.nombre} ${ultimaActualizacion.cliente.apellidos}`);
      console.log(`   Día de facturación: ${ultimaActualizacion.diaFacturacion}`);
      console.log(`   Fecha actualización: ${ultimaActualizacion.updatedAt}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDiasFacturacion();
