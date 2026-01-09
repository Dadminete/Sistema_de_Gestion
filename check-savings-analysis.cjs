const prisma = require('./server/prismaClient');

async function checkSavingsAnalysis() {
  console.log('🔍 Verificando datos del análisis de presupuesto...\n');

  try {
    // 1. Verificar suscripciones activas
    const suscripcionesActivas = await prisma.suscripcion.findMany({
      where: {
        estado: { in: ['activo', 'ACTIVO', 'Activo'] }
      },
      select: {
        id: true,
        numeroContrato: true,
        precioMensual: true,
        diaFacturacion: true,
        estado: true
      }
    });

    console.log('📊 SUSCRIPCIONES ACTIVAS:');
    console.log(`   Total suscripciones: ${suscripcionesActivas.length}`);
    
    let totalDia15 = 0;
    let totalOtrosDias = 0;
    let countDia15 = 0;
    let countOtrosDias = 0;

    suscripcionesActivas.forEach(sus => {
      const precio = parseFloat(sus.precioMensual);
      if (sus.diaFacturacion === 15) {
        totalDia15 += precio;
        countDia15++;
      } else if ([10, 20, 30].includes(sus.diaFacturacion)) {
        totalOtrosDias += precio;
        countOtrosDias++;
      }
    });

    console.log(`   Día 15: ${countDia15} suscripciones = RD$${totalDia15.toFixed(2)}`);
    console.log(`   Otros días (10,20,30): ${countOtrosDias} suscripciones = RD$${totalOtrosDias.toFixed(2)}`);
    console.log(`   TOTAL MENSUAL PROYECTADO: RD$${(totalDia15 + totalOtrosDias).toFixed(2)}`);

    // 2. Verificar ingresos reales del mes
    const fechaActual = new Date();
    const monthStart = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
    const monthEnd = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    console.log(`\n💰 INGRESOS REALES DEL MES (${monthStart.toLocaleDateString()} - ${monthEnd.toLocaleDateString()}):`);

    const ingresosReales = await prisma.movimientoContable.findMany({
      where: {
        tipo: 'ingreso',
        fecha: { gte: monthStart, lte: monthEnd },
        metodo: { in: ['caja', 'banco'] }
      },
      select: {
        id: true,
        fecha: true,
        descripcion: true,
        monto: true,
        metodo: true,
        categoria: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    console.log(`   Total movimientos de ingreso: ${ingresosReales.length}`);
    
    if (ingresosReales.length > 0) {
      let totalIngresos = 0;
      console.log('\n   Desglose de ingresos:');
      ingresosReales.forEach(ing => {
        totalIngresos += parseFloat(ing.monto);
        console.log(`   - ${ing.fecha.toLocaleDateString()}: ${ing.descripcion || ing.categoria?.nombre} - RD$${parseFloat(ing.monto).toFixed(2)} (${ing.metodo})`);
      });
      console.log(`\n   TOTAL INGRESOS REALES: RD$${totalIngresos.toFixed(2)}`);
    } else {
      console.log('   ⚠️ NO HAY INGRESOS REGISTRADOS ESTE MES');
    }

    // 3. Verificar gastos reales del mes
    console.log(`\n💸 GASTOS REALES DEL MES:`);
    
    const gastosReales = await prisma.movimientoContable.findMany({
      where: {
        tipo: 'gasto',
        fecha: { gte: monthStart, lte: monthEnd }
      },
      select: {
        id: true,
        fecha: true,
        descripcion: true,
        monto: true,
        metodo: true,
        categoria: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' }
    });

    console.log(`   Total movimientos de gasto: ${gastosReales.length}`);
    
    let totalGastos = 0;
    if (gastosReales.length > 0) {
      console.log('\n   Desglose de gastos:');
      gastosReales.slice(0, 10).forEach(gasto => {
        totalGastos += parseFloat(gasto.monto);
        console.log(`   - ${gasto.fecha.toLocaleDateString()}: ${gasto.descripcion || gasto.categoria?.nombre} - RD$${parseFloat(gasto.monto).toFixed(2)} (${gasto.metodo})`);
      });
      if (gastosReales.length > 10) {
        gastosReales.slice(10).forEach(gasto => {
          totalGastos += parseFloat(gasto.monto);
        });
        console.log(`   ... y ${gastosReales.length - 10} gastos más`);
      }
      console.log(`\n   TOTAL GASTOS REALES: RD$${totalGastos.toFixed(2)}`);
    }

    // 4. Verificar facturas pendientes
    console.log(`\n📄 FACTURAS PENDIENTES:`);
    
    const facturasPendientes = await prisma.facturaCliente.aggregate({
      where: {
        estado: { in: ['pendiente', 'parcial', 'vencida'] }
      },
      _sum: { total: true },
      _count: true
    });

    console.log(`   Total facturas: ${facturasPendientes._count}`);
    console.log(`   Total a cobrar: RD$${parseFloat(facturasPendientes._sum.total || 0).toFixed(2)}`);

    // 5. Resumen
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL ANÁLISIS:');
    console.log('='.repeat(60));
    console.log(`Recaudación Proyectada (Suscripciones): RD$${(totalDia15 + totalOtrosDias).toFixed(2)}`);
    console.log(`  - Día 15: RD$${totalDia15.toFixed(2)}`);
    console.log(`  - Otros días: RD$${totalOtrosDias.toFixed(2)}`);
    console.log('');
    console.log(`Ingresos Reales del Mes: RD$${(ingresosReales.reduce((sum, i) => sum + parseFloat(i.monto), 0)).toFixed(2)}`);
    console.log(`Gastos Reales del Mes: RD$${totalGastos.toFixed(2)}`);
    console.log(`Balance Real: RD$${((ingresosReales.reduce((sum, i) => sum + parseFloat(i.monto), 0)) - totalGastos).toFixed(2)}`);
    console.log('');
    console.log(`Cuentas por Cobrar: RD$${parseFloat(facturasPendientes._sum.total || 0).toFixed(2)}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSavingsAnalysis();
