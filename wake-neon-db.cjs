const https = require('https');
const { URL } = require('url');

async function wakeNeonDatabase() {
  console.log('🔌 Intentando activar la base de datos Neon...');
  
  const apiEndpoint = 'https://ep-long-bread-a49wf2dl.apirest.us-east-1.aws.neon.tech/neondb/rest/v1';
  
  try {
    // Hacer una petición simple al API REST para despertar la BD
    const url = new URL(apiEndpoint);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'DatabaseWakeUp/1.0'
      },
      timeout: 30000
    };

    console.log('📡 Enviando petición al API de Neon...');
    console.log('🎯 Endpoint:', apiEndpoint);

    const req = https.request(options, (res) => {
      console.log('📊 Status Code:', res.statusCode);
      console.log('📋 Headers:', JSON.stringify(res.headers, null, 2));
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ Respuesta recibida (primeros 500 chars):');
        console.log(data.substring(0, 500));
        
        if (res.statusCode === 200 || res.statusCode === 404) {
          console.log('🎉 Base de datos debería estar activándose...');
          console.log('⏱️  Esperando 10 segundos antes de probar la conexión...');
          
          setTimeout(() => {
            testDatabaseConnection();
          }, 10000);
        } else {
          console.log('⚠️  Respuesta inesperada del API');
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error al conectar al API de Neon:', error.message);
      console.log('🔄 Intentando conexión directa a la base de datos...');
      testDatabaseConnection();
    });

    req.on('timeout', () => {
      console.log('⏰ Timeout en la petición al API');
      req.destroy();
      testDatabaseConnection();
    });

    req.end();

  } catch (error) {
    console.error('💥 Error inesperado:', error.message);
    testDatabaseConnection();
  }
}

async function testDatabaseConnection() {
  console.log('\n🧪 Probando conexión a la base de datos...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({
      log: ['error']
    });
    
    console.log('🔍 Intentando consulta simple...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ ¡Conexión exitosa!:', result);
    
    await prisma.$disconnect();
    console.log('🎯 Base de datos lista para usar');
    
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('💡 Sugerencias:');
    console.log('   1. Verificar que la DATABASE_URL sea correcta');
    console.log('   2. Verificar conectividad de red');
    console.log('   3. Verificar que el proyecto de Neon esté activo');
    console.log('   4. Intentar regenerar las credenciales en Neon Console');
    
    return false;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  wakeNeonDatabase();
}

module.exports = { wakeNeonDatabase, testDatabaseConnection };