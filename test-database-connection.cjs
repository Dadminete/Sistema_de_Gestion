const { PrismaClient } = require('@prisma/client');

console.log('=== DIAGNÓSTICO DE CONEXIÓN A BASE DE DATOS ===');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔄 Probando conexión a la base de datos...');
    
    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Conexión exitosa!', result);
    
    // Test count of users
    const userCount = await prisma.usuario.count();
    console.log(`📊 Total de usuarios en la base: ${userCount}`);
    
    // Test sessions count
    const sessionCount = await prisma.sesionUsuario.count();
    console.log(`📊 Total de sesiones en la base: ${sessionCount}`);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    console.error('Detalles del error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();