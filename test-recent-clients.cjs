// Archivo de prueba para verificar el endpoint de clientes recientes
// Ejecutar con: node test-recent-clients.cjs

// El backend está en el puerto 54117 según los logs
const API_BASE = 'http://localhost:54117/api';

async function testRecentClientsEndpoint() {
  try {
    console.log('🧪 Probando endpoint de clientes recientes...');
    console.log('🌐 URL de prueba:', `${API_BASE}/clients/recent-subscribed?limit=5`);
    
    // Probar el endpoint de clientes recientes sin token por ahora para debugging
    const response = await fetch(`${API_BASE}/clients/recent-subscribed?limit=5`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Endpoint funcionando correctamente');
      console.log('📊 Datos recibidos:', data);
      console.log('📈 Total de clientes:', data.length);
    } else {
      console.log('❌ Error en endpoint:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Solo ejecutar si no está siendo importado
if (require.main === module) {
  testRecentClientsEndpoint();
}

module.exports = { testRecentClientsEndpoint };