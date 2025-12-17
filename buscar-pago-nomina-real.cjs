const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function buscarPagoNominaReal() {
  try {
    console.log('🔍 BUSCANDO EL PAGO REAL DE NÓMINA DE RD$9000');
    console.log('='.repeat(60));

    // 1. Buscar específicamente el pago de nómina de RD$9000
    const pagoNominaReal = await prisma.movimientoContable.findFirst({
      where: {
        monto: 9000,
        tipo: 'gasto',
        descripcion: { contains: 'Moises De La rosa', mode: 'insensitive' }
      },
      include: {
        caja: { select: { nombre: true } },
        categoria: { select: { nombre: true } }
      }
    });

    if (pagoNominaReal) {
      console.log('✅ PAGO DE NÓMINA DE RD$9000 ENCONTRADO:');
      console.log(`   ID: ${pagoNominaReal.id}`);
      console.log(`   Descripción: ${pagoNominaReal.descripción}`);
      console.log(`   Tipo: ${pagoNominaReal.tipo.toUpperCase()}`);
      console.log(`   Monto: RD$${Number(pagoNominaReal.monto)}`);
      console.log(`   Caja: ${pagoNominaReal.caja?.nombre || 'N/A'}`);
      console.log(`   CajaID: ${pagoNominaReal.cajaId}`);
      console.log(`   Categoría: ${pagoNominaReal.categoria?.nombre || 'N/A'}`);
      console.log(`   Método: ${pagoNominaReal.metodo}`);
      console.log(`   Fecha: ${pagoNominaReal.fecha.toLocaleString()}`);
      
      // Calcular posición en la lista ordenada por fecha descendente
      const movimientosMasRecientes = await prisma.movimientoContable.count({
        where: {
          fecha: { gt: pagoNominaReal.fecha }
        }
      });
      
      const posicion = movimientosMasRecientes + 1;
      console.log(`\n📊 POSICIÓN EN LISTAS ORDENADAS:`);
      console.log(`   Posición: ${posicion} (entre todos los movimientos)`);
      
      if (posicion <= 10) {
        console.log(`   ✅ DEBERÍA APARECER en datatable ingresos-gastos (top 10)`);
      } else {
        console.log(`   ❌ NO aparecerá en datatable (posición ${posicion} > 10)`);
      }
      
      if (posicion <= 5) {
        console.log(`   ✅ DEBERÍA APARECER en dashboard (top 5)`);
      } else {
        console.log(`   ❌ NO aparecerá en dashboard (posición ${posicion} > 5)`);
      }

      // Verificar los 10 movimientos más recientes para el datatable
      console.log('\n📋 LOS 10 MOVIMIENTOS MÁS RECIENTES (para datatable):');
      const top10 = await prisma.movimientoContable.findMany({
        include: {
          caja: { select: { nombre: true } },
          categoria: { select: { nombre: true } }
        },
        orderBy: { fecha: 'desc' },
        take: 10
      });

      let encontradoEnTop10 = false;
      top10.forEach((mov, index) => {
        if (mov.id === pagoNominaReal.id) {
          encontradoEnTop10 = true;
          console.log(`   ${index + 1}. ⭐ PAGO NÓMINA MOISES (RD$${Number(mov.monto)}) - ${mov.descripcion}`);
        } else {
          console.log(`   ${index + 1}. ${mov.descripcion || 'Sin descripción'} - ${mov.tipo} RD$${Number(mov.monto)}`);
        }
      });

      // Verificar los 5 movimientos más recientes para el dashboard
      console.log('\n🏠 LOS 5 MOVIMIENTOS MÁS RECIENTES (para dashboard):');
      const top5 = await prisma.movimientoContable.findMany({
        include: {
          caja: { select: { nombre: true } }
        },
        orderBy: { fecha: 'desc' },
        take: 5
      });

      let encontradoEnTop5 = false;
      top5.forEach((mov, index) => {
        if (mov.id === pagoNominaReal.id) {
          encontradoEnTop5 = true;
          console.log(`   ${index + 1}. ⭐ PAGO NÓMINA MOISES (RD$${Number(mov.monto)}) - ${mov.descripcion}`);
        } else {
          console.log(`   ${index + 1}. ${mov.descripcion || 'Sin descripción'} - ${mov.tipo} RD$${Number(mov.monto)}`);
        }
      });

      console.log('\n🎯 RESULTADO FINAL:');
      if (encontradoEnTop10) {
        console.log('   ✅ El pago aparecerá en /contabilidad/ingresos-gastos');
      } else {
        console.log('   ❌ El pago NO aparecerá en /contabilidad/ingresos-gastos (muy antiguo)');
      }
      
      if (encontradoEnTop5) {
        console.log('   ✅ El pago aparecerá en el dashboard - Últimas Transacciones');
      } else {
        console.log('   ❌ El pago NO aparecerá en el dashboard - Últimas Transacciones (muy antiguo)');
      }

    } else {
      console.log('❌ NO se encontró el pago de nómina de RD$9000');
      
      // Buscar cualquier movimiento de Moises
      console.log('\nBuscando cualquier movimiento de Moises...');
      const movimientosMoises = await prisma.movimientoContable.findMany({
        where: {
          descripcion: { contains: 'Moises', mode: 'insensitive' }
        },
        include: {
          caja: { select: { nombre: true } }
        },
        orderBy: { fecha: 'desc' }
      });
      
      console.log(`Movimientos de Moises encontrados: ${movimientosMoises.length}`);
      movimientosMoises.forEach(mov => {
        console.log(`   ${mov.descripcion} - ${mov.tipo} RD$${Number(mov.monto)} - ${mov.fecha.toLocaleString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

buscarPagoNominaReal();