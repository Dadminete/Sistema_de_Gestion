const { PrismaClient } = require('./server/node_modules/@prisma/client');
require('dotenv').config({ path: './server/.env' });

async function wakeUpDatabase() {
  console.log('🔌 Intentando despertar la base de datos Neon...');
  console.log('📊 DATABASE_URL presente:', !!process.env.DATABASE_URL);
  console.log('🔗 DATABASE_URL (primeros 50 chars):', process.env.DATABASE_URL?.substring(0, 50));
  
  const prisma = new PrismaClient({
    log: ['warn', 'error']
  });
  
  let retries = 5;
  let connected = false;
  
  while (retries > 0 && !connected) {
    try {
      console.log(`🔄 Intento ${6 - retries + 1} de 5...`);
      
      // Realizar una consulta simple para activar la conexión
      const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`;
      console.log('✅ Base de datos despierta y conectada:', result);
      
      // Probar una consulta específica a la tabla usuarios
      const userCount = await prisma.usuario.count();
      console.log(`📊 Total de usuarios en la base de datos: ${userCount}`);
      
      connected = true;
      
    } catch (error) {
      console.error(`❌ Error en intento ${6 - retries + 1}:`, error.message);
      retries--;
      
      if (retries > 0) {
        console.log('⏱️  Esperando 5 segundos antes del siguiente intento...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  
  if (connected) {
    console.log('🎉 ¡Base de datos lista para usar!');
    console.log('🚀 Puedes iniciar el servidor ahora.');
  } else {
    console.error('💥 No se pudo conectar a la base de datos después de 5 intentos');
    console.log('💡 Sugerencias:');
    console.log('   1. Verificar el estado del proyecto en Neon Console');
    console.log('   2. Verificar que la URL de conexión sea válida');
    console.log('   3. Verificar conectividad de internet');
  }
  
  await prisma.$disconnect();
  process.exit(connected ? 0 : 1);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  wakeUpDatabase().catch(console.error);
}

module.exports = { wakeUpDatabase };