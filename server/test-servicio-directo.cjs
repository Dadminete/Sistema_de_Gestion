require('dotenv').config();

// Import cajaService to test the getDashboardStats method directly
const { CajaService } = require('./services/cajaService');

async function testBalanceBancoEnServicio() {
  try {
    console.log('🧪 PROBANDO BALANCE BANCO EN SERVICIO DIRECTAMENTE');
    console.log('='.repeat(50));

    const result = await CajaService.getDashboardStats();
    
    console.log('📋 Resultado completo structure:', Object.keys(result));
    console.log('📋 Stats structure:', Object.keys(result.stats || {}));
    console.log('💰 Balance Banco (resultado):', result.stats?.balanceBanco);
    
    if (result.stats?.balanceBanco !== undefined) {
      console.log('💰 Balance Banco (formateado): RD$', result.stats.balanceBanco.toLocaleString());
    } else {
      console.log('❌ Balance Banco está undefined');
    }
    
    // Verificar si está en el rango esperado (206,000)
    if (result.stats?.balanceBanco >= 200000 && result.stats?.balanceBanco <= 220000) {
      console.log('✅ ¡CORRECTO! El balance está en el rango esperado (~206,000)');
    } else if (result.stats?.balanceBanco !== undefined) {
      console.log('❌ ERROR: El balance no está en el rango esperado');
      console.log('   Esperado: RD$ 200,000 - RD$ 220,000');
      console.log('   Actual: RD$', result.stats.balanceBanco);
    }
    
    console.log('\n📊 OTROS VALORES DEL DASHBOARD:');
    console.log('   Balance Caja Principal:', result.stats?.balanceCajaPrincipal);
    console.log('   Balance Papelería:', result.stats?.balancePapeleria);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testBalanceBancoEnServicio();