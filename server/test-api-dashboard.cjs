require('dotenv').config();

async function testDashboardAPI() {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://172.16.0.23:54117/api/dashboard/stats');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('🎯 BALANCE BANCO EN API:', data.stats.balanceBanco);
    console.log('🎯 BALANCE BANCO FORMATEADO: RD$', data.stats.balanceBanco.toLocaleString());
    
    if (data.stats.balanceBanco > 200000 && data.stats.balanceBanco < 220000) {
      console.log('✅ ¡CORRECTO! El balance está en el rango esperado');
    } else {
      console.log('❌ ERROR: El balance no está en el rango esperado');
    }
    
  } catch (error) {
    console.error('❌ Error probando API:', error.message);
  }
}

testDashboardAPI();