const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function testBackup() {
  try {
    console.log('🔍 Verificando datos de la tabla Cliente...\n');

    // Obtener todos los clientes
    const clientes = await prisma.cliente.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Total de clientes encontrados: ${clientes.length}\n`);

    // Buscar específicamente a Ines Abad
    const inesAbad = clientes.find(c => 
      c.nombre && c.nombre.toLowerCase().includes('ines') && 
      c.apellidos && c.apellidos.toLowerCase().includes('abad')
    );

    if (inesAbad) {
      console.log('✅ Ines Abad ESTÁ en los datos:');
      console.log(`   ID: ${inesAbad.id}`);
      console.log(`   Nombre: ${inesAbad.nombre} ${inesAbad.apellidos || ''}`);
      console.log(`   Creado: ${inesAbad.createdAt}`);
      console.log(`   Posición en el array: ${clientes.indexOf(inesAbad) + 1} de ${clientes.length}`);
    } else {
      console.log('❌ Ines Abad NO está en los datos recuperados');
    }

    // Mostrar últimos 10 clientes
    console.log('\n📋 Últimos 10 clientes (más recientes primero):');
    clientes.slice(0, 10).forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.nombre} ${c.apellidos || ''} - Creado: ${c.createdAt}`);
    });

    // Simular cómo el backup procesaría los datos
    console.log('\n🔄 Simulando proceso de backup...');
    const rawData = await prisma.$queryRawUnsafe(`SELECT * FROM "Cliente";`);
    console.log(`   Registros obtenidos con $queryRawUnsafe: ${rawData.length}`);
    
    const inesInRaw = rawData.find(c => 
      c.nombre && c.nombre.toLowerCase().includes('ines') &&
      c.apellidos && c.apellidos.toLowerCase().includes('abad')
    );
    
    if (inesInRaw) {
      console.log('   ✅ Ines Abad ESTÁ en los datos raw del backup');
    } else {
      console.log('   ❌ Ines Abad NO está en los datos raw del backup');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBackup();
