const { CajaService } = require('./server/services/cajaService');

async function testDashboard() {
  try {
    console.log('\n=== TEST: DASHBOARD STATS ===\n');

    const data = await CajaService.getDashboardStats('week');

    console.log('Estadísticas del Dashboard:');
    console.log('=============================\n');
    console.log(`💰 Ingresos Hoy (Total)......: RD$ ${data.stats.ingresosHoy}`);
    console.log(`💰 Ingresos Hoy (Caja).......: RD$ ${data.stats.ingresosHoyCajaPrincipal}`);
    console.log(`💰 Ingresos Hoy (Papelería)..: RD$ ${data.stats.ingresosHoyPapeleria}`);
    console.log(`\n💸 Gastos Hoy (Total)........: RD$ ${data.stats.gastosHoy}`);
    console.log(`💸 Gastos Hoy (Caja).........: RD$ ${data.stats.gastosHoyCajaPrincipal}`);
    console.log(`💸 Gastos Hoy (Papelería)....: RD$ ${data.stats.gastosHoyPapeleria}`);
    console.log(`\n⚖️  Balance Caja Principal....: RD$ ${data.stats.balanceCajaPrincipal}`);
    console.log(`⚖️  Balance Papelería.........: RD$ ${data.stats.balancePapeleria}`);
    console.log(`🏦 Balance Banco.............: RD$ ${data.stats.balanceBanco || 'NO DEFINIDO'}`);
    console.log(`💰 Gastos Mes Banco..........: RD$ ${data.stats.gastosMesBanco || 'NO DEFINIDO'}`);
    console.log(`💰 Ingresos Mes Banco........: RD$ ${data.stats.ingresosMesBanco || 'NO DEFINIDO'}`);
    console.log(`\n📊 Chart Data (${data.chartData.length} días):`);
    data.chartData.forEach(item => {
      console.log(`   ${item.name}: Ingresos RD$ ${item.ingresos}, Gastos RD$ ${item.gastos}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

testDashboard();
