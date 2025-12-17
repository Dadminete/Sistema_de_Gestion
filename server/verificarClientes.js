const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarClientes() {
  try {
    const count = await prisma.cliente.count();
    console.log(`✅ Total de clientes en la BD: ${count}`);

    const samples = await prisma.cliente.findMany({ 
      take: 5,
      select: {
        codigoCliente: true,
        nombre: true,
        apellidos: true,
        email: true,
        telefono: true,
        estado: true,
      }
    });

    console.log('\n📋 Muestra de 5 clientes:');
    samples.forEach((cliente, i) => {
      console.log(`\n${i + 1}. ${cliente.codigoCliente} - ${cliente.nombre} ${cliente.apellidos}`);
      console.log(`   Email: ${cliente.email || 'N/A'}`);
      console.log(`   Teléfono: ${cliente.telefono || 'N/A'}`);
      console.log(`   Estado: ${cliente.estado}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verificarClientes();
