const axios = require('axios');

async function testAPIEndpoint() {
  try {
    console.log('🔍 PROBANDO ENDPOINT DEL DASHBOARD API');
    console.log('='.repeat(50));

    // Primero probar endpoint de salud
    console.log('🔍 Probando endpoint de health...');
    try {
      const healthResponse = await axios.get('http://172.16.0.23:54116/health');
      console.log('✅ Health check OK:', healthResponse.data);
    } catch (error) {
      console.log('❌ Health check falló');
    }

    // Intentar con un token básico (esto podría fallar pero veamos la respuesta)
    const response = await axios.get('http://172.16.0.23:54116/api/cajas/dashboard', {
      headers: {
        'Authorization': 'Bearer token_temporario_para_test'
      }
    });
    
    console.log('✅ Respuesta del API exitosa');
    console.log(`📊 Balance Banco: RD$ ${response.data.stats.balanceBanco}`);
    console.log(`💰 Gastos Mes Banco: RD$ ${response.data.stats.gastosMesBanco}`);
    console.log(`💰 Ingresos Mes Banco: RD$ ${response.data.stats.ingresosMesBanco}`);
    
    // Mostrar toda la estructura de stats para debugging
    console.log('\n📋 TODAS LAS ESTADÍSTICAS:');
    Object.entries(response.data.stats).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

  } catch (error) {
    console.error('❌ Error al llamar API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPIEndpoint();