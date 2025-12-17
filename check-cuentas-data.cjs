const prisma = require('./server/prismaClient');

async function checkData() {
  try {
    console.log('🔍 Verificando datos de cuentas por cobrar...');
    
    const count = await prisma.cuentaPorCobrar.count();
    console.log(`📊 Cuentas por cobrar encontradas: ${count}`);
    
    if (count === 0) {
      console.log('❌ No hay datos de cuentas por cobrar');
      
      // Verificar clientes disponibles
      const clientesCount = await prisma.cliente.count();
      console.log(`👥 Clientes disponibles: ${clientesCount}`);
      
      if (clientesCount > 0) {
        const clientes = await prisma.cliente.findMany({ take: 3 });
        console.log('📋 Primeros clientes:');
        clientes.forEach(c => {
          console.log(`  - ${c.nombre} ${c.apellidos || ''} (${c.id.slice(0, 8)}...)`);
        });
      }
    } else {
      console.log('✅ Datos encontrados. Mostrando muestras:');
      const samples = await prisma.cuentaPorCobrar.findMany({
        take: 5,
        include: {
          cliente: { select: { nombre: true, apellidos: true } }
        }
      });
      
      samples.forEach(s => {
        console.log(`  📄 ${s.numeroDocumento} - ${s.cliente?.nombre} ${s.cliente?.apellidos || ''}`);
        console.log(`     💰 $${s.montoPendiente} - Estado: ${s.estado} - Días vencido: ${s.diasVencido}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();