const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function buscarMovimientosNomina() {
  try {
    console.log('=== BÚSQUEDA COMPLETA DE MOVIMIENTOS DE NÓMINA ===\n');

    // Buscar todos los movimientos que puedan ser de nómina
    const movimientos = await prisma.movimientoContable.findMany({
      where: {
        OR: [
          { descripcion: { contains: 'nómina', mode: 'insensitive' } },
          { descripcion: { contains: 'nomina', mode: 'insensitive' } },
          { descripcion: { contains: 'pago', mode: 'insensitive' } },
          { descripcion: { contains: 'salario', mode: 'insensitive' } },
          { descripcion: { contains: 'moises', mode: 'insensitive' } },
          { monto: { equals: 9000 } }
        ]
      },
      orderBy: { fecha: 'desc' },
      take: 10
    });

    console.log(`Movimientos encontrados: ${movimientos.length}\n`);

    if (movimientos.length > 0) {
      movimientos.forEach((mov, index) => {
        console.log(`${index + 1}. ID: ${mov.id}`);
        console.log(`   Descripción: ${mov.descripcion}`);
        console.log(`   Tipo: ${mov.tipo}`);
        console.log(`   Monto: RD$${Number(mov.monto)}`);
        console.log(`   CajaID: ${mov.cajaId}`);
        console.log(`   CuentaID: ${mov.cuentaContableId}`);
        console.log(`   Fecha: ${mov.fecha}`);
        console.log(`   Método: ${mov.metodo}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ NO se encontraron movimientos de nómina');
      
      // Veamos los últimos 5 movimientos para contexto
      console.log('\nÚltimos 5 movimientos en el sistema:');
      const ultimosMovimientos = await prisma.movimientoContable.findMany({
        orderBy: { fecha: 'desc' },
        take: 5
      });
      
      ultimosMovimientos.forEach((mov, index) => {
        console.log(`${index + 1}. ${mov.descripcion} - ${mov.tipo} - RD$${Number(mov.monto)} - ${mov.fecha}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

buscarMovimientosNomina();