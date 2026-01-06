// Test de conexión a la base de datos Neon
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
    const prisma = new PrismaClient({
        log: ['query', 'error', 'warn'],
    });

    try {
        console.log('🔍 Intentando conectar a la base de datos...\n');
        
        // Intento simple de conexión
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        
        console.log('✅ ¡Conexión exitosa!');
        console.log('📊 Resultado de prueba:', result);
        
        // Verificar algunas tablas
        const tablesCount = await prisma.movimientoContable.count();
        console.log(`\n📋 Movimientos contables en BD: ${tablesCount}`);
        
    } catch (error) {
        console.error('❌ Error de conexión:\n');
        console.error('Mensaje:', error.message);
        console.error('Código:', error.code);
        
        if (error.message.includes("Can't reach database server")) {
            console.error('\n🔴 La base de datos Neon no es accesible.');
            console.error('\nPosibles soluciones:');
            console.error('1. La base de datos está en modo "sleep" (suspendida por inactividad)');
            console.error('   → Ve a https://console.neon.tech y despierta el proyecto');
            console.error('2. Verifica tu conexión a internet');
            console.error('3. Verifica que el DATABASE_URL en .env sea correcto');
            console.error('4. Puede haber un problema temporal con Neon');
        }
        
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
