const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function verificarVisibilidadEnFrontend() {
  try {
    console.log('🔍 VERIFICANDO VISIBILIDAD EN FRONTEND');
    console.log('='.repeat(60));

    // 1. VERIFICAR DATOS PARA: /contabilidad/ingresos-gastos
    console.log('\n📊 DATOS PARA DATATABLE DE INGRESOS-GASTOS:');
    console.log('   URL: http://172.16.0.23:5173/contabilidad/ingresos-gastos\n');
    
    // Consulta similar a la que usaría el frontend para el datatable
    const movimientosContables = await prisma.movimientoContable.findMany({
      include: {
        caja: { select: { nombre: true } },
        categoria: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' },
      take: 10  // Los últimos 10 movimientos
    });

    console.log(`   Total de movimientos encontrados: ${movimientosContables.length}`);
    console.log('   Movimientos (los más recientes primero):\n');

    let pagoNominaEncontrado = false;
    movimientosContables.forEach((mov, index) => {
      const esNomina = mov.descripcion && (mov.descripcion.toLowerCase().includes('nómina') || 
                      mov.descripcion.toLowerCase().includes('nomina'));
      
      if (esNomina) {
        pagoNominaEncontrado = true;
        console.log(`   ${index + 1}. ⭐ PAGO DE NÓMINA ENCONTRADO:`);
      } else {
        console.log(`   ${index + 1}. Movimiento Regular:`);
      }
      
      console.log(`      ID: ${mov.id}`);
      console.log(`      Descripción: ${mov.descripcion}`);
      console.log(`      Tipo: ${mov.tipo.toUpperCase()}`);
      console.log(`      Monto: RD$${Number(mov.monto)}`);
      console.log(`      Caja: ${mov.caja?.nombre || 'N/A'}`);
      console.log(`      Categoría: ${mov.categoria?.nombre || 'N/A'}`);
      console.log(`      Método: ${mov.metodo}`);
      console.log(`      Fecha: ${mov.fecha.toLocaleString()}`);
      
      if (esNomina) {
        console.log(`      ✅ ESTE DEBE APARECER EN EL DATATABLE`);
      }
      
      console.log('      ---');
    });

    if (!pagoNominaEncontrado) {
      console.log('   ❌ NO se encontró el pago de nómina en los últimos 10 movimientos');
    }

    // 2. VERIFICAR DATOS PARA: Dashboard - Últimas Transacciones
    console.log('\n🏠 DATOS PARA DASHBOARD - ÚLTIMAS TRANSACCIONES:');
    console.log('   URL: http://172.16.0.23:5173/ (Card: Últimas Transacciones)\n');

    // Consulta para las últimas transacciones (similar a lo que usaría el dashboard)
    const ultimasTransacciones = await prisma.movimientoContable.findMany({
      include: {
        caja: { select: { nombre: true } }
      },
      orderBy: { fecha: 'desc' },
      take: 5  // Dashboard generalmente muestra 5 últimas
    });

    console.log(`   Total de transacciones para dashboard: ${ultimasTransacciones.length}`);
    console.log('   Últimas 5 transacciones:\n');

    let nominaEnDashboard = false;
    ultimasTransacciones.forEach((mov, index) => {
      const esNomina = mov.descripcion && (mov.descripcion.toLowerCase().includes('nómina') || 
                      mov.descripcion.toLowerCase().includes('nomina'));
      
      if (esNomina) {
        nominaEnDashboard = true;
        console.log(`   ${index + 1}. ⭐ PAGO DE NÓMINA EN DASHBOARD:`);
      } else {
        console.log(`   ${index + 1}. Transacción:`);
      }
      
      console.log(`      Descripción: ${mov.descripcion}`);
      console.log(`      ${mov.tipo.toUpperCase()}: RD$${Number(mov.monto)}`);
      console.log(`      Caja: ${mov.caja?.nombre || 'Sin caja'}`);
      console.log(`      Fecha: ${mov.fecha.toLocaleString()}`);
      
      if (esNomina) {
        console.log(`      ✅ ESTE DEBE APARECER EN ÚLTIMAS TRANSACCIONES`);
      }
      
      console.log('      ---');
    });

    if (!nominaEnDashboard) {
      console.log('   ❌ NO se encontró el pago de nómina en las últimas 5 transacciones');
    }

    // 3. BUSCAR ESPECÍFICAMENTE EL PAGO DE MOISES
    console.log('\n🔎 BÚSQUEDA ESPECÍFICA DEL PAGO DE MOISES:');
    
    const pagoMoisesMovimiento = await prisma.movimientoContable.findFirst({
      where: {
        descripcion: { contains: 'Moises De La rosa', mode: 'insensitive' }
      },
      include: {
        caja: { select: { nombre: true } }
      }
    });

    if (pagoMoisesMovimiento) {
      console.log('   ✅ MOVIMIENTO DE MOISES ENCONTRADO:');
      console.log(`      ID: ${pagoMoisesMovimiento.id}`);
      console.log(`      Descripción: ${pagoMoisesMovimiento.descripcion}`);
      console.log(`      Tipo: ${pagoMoisesMovimiento.tipo.toUpperCase()}`);
      console.log(`      Monto: RD$${Number(pagoMoisesMovimiento.monto)}`);
      console.log(`      Caja: ${pagoMoisesMovimiento.caja?.nombre}`);
      console.log(`      Fecha: ${pagoMoisesMovimiento.fecha.toLocaleString()}`);
      console.log(`      CajaID: ${pagoMoisesMovimiento.cajaId} ${pagoMoisesMovimiento.cajaId ? '✅' : '❌'}`);
      
      // Verificar posición en la lista
      const posicionEnLista = await prisma.movimientoContable.count({
        where: {
          fecha: { gt: pagoMoisesMovimiento.fecha }
        }
      });
      
      console.log(`      Posición en lista (más recientes primero): ${posicionEnLista + 1}`);
      
      if (posicionEnLista < 10) {
        console.log('      ✅ DEBE APARECER en datatable ingresos-gastos (top 10)');
      } else {
        console.log('      ⚠️  Podría NO aparecer en datatable (fuera del top 10)');
      }
      
      if (posicionEnLista < 5) {
        console.log('      ✅ DEBE APARECER en dashboard últimas transacciones (top 5)');
      } else {
        console.log('      ⚠️  Podría NO aparecer en dashboard (fuera del top 5)');
      }
    } else {
      console.log('   ❌ NO se encontró el movimiento de Moises');
    }

    // 4. RESUMEN DE ENDPOINTS QUE DEBERÍA USAR EL FRONTEND
    console.log('\n📡 ENDPOINTS QUE DEBE USAR EL FRONTEND:');
    console.log('   Para ingresos-gastos: GET /api/movimientos-contables');
    console.log('   Para dashboard: GET /api/movimientos-contables?limit=5');
    console.log('   Ambos deben incluir: orderBy fecha DESC, include caja');

    console.log('\n🎯 VERIFICACIONES RECOMENDADAS:');
    console.log('   1. Abrir DevTools (F12) en el navegador');
    console.log('   2. Ir a Network tab');
    console.log('   3. Recargar las páginas y verificar las respuestas de API');
    console.log('   4. Confirmar que el movimiento aparece en los datos JSON');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 VERIFICACIÓN COMPLETA');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarVisibilidadEnFrontend();