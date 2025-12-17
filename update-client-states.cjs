const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateClientStates() {
  try {
    console.log('=== ACTUALIZANDO ESTADOS DE CLIENTES ===');
    
    // Get first 10 clients
    const clients = await prisma.cliente.findMany({
      take: 10,
      select: { id: true, nombre: true, estado: true }
    });

    console.log(`\nTotal clientes en BD: ${clients.length}`);
    console.log('Estados actuales:');
    clients.forEach(c => {
      console.log(`  - ${c.nombre}: ${c.estado}`);
    });

    // Update 3 clients to inactivo, 2 to suspendido, rest remain activo
    if (clients.length >= 3) {
      const inactiveClients = clients.slice(0, 3);
      const suspendedClients = clients.slice(3, 5);

      const updateInactive = await prisma.cliente.updateMany({
        where: { id: { in: inactiveClients.map(c => c.id) } },
        data: { estado: 'inactivo' }
      });

      const updateSuspended = await prisma.cliente.updateMany({
        where: { id: { in: suspendedClients.map(c => c.id) } },
        data: { estado: 'suspendido' }
      });

      console.log(`\n✅ Actualizados ${updateInactive.count} clientes a INACTIVO`);
      console.log(`✅ Actualizados ${updateSuspended.count} clientes a SUSPENDIDO`);
    }

    // Verify changes
    const updated = await prisma.cliente.findMany({
      take: 10,
      select: { id: true, nombre: true, estado: true }
    });

    console.log('\nEstados después de actualizar:');
    updated.forEach(c => {
      console.log(`  - ${c.nombre}: ${c.estado}`);
    });

    // Count by status
    const countByStatus = await prisma.cliente.groupBy({
      by: ['estado'],
      _count: true,
      orderBy: { _count: { desc: true } }
    });

    console.log('\nConteo total por estado:');
    countByStatus.forEach(row => {
      console.log(`  ${row.estado}: ${row._count}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateClientStates();
