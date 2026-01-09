// Usar el PrismaRetry del servidor que tiene la configuración correcta
const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function checkInesAbad() {
  try {
    console.log('🔍 Buscando cliente "Ines Abad"...\n');

    // Buscar en la tabla Cliente
    const clientes = await prisma.cliente.findMany({
      where: {
        OR: [
          { nombre: { contains: 'Ines', mode: 'insensitive' } },
          { nombre: { contains: 'Inés', mode: 'insensitive' } },
          { apellidos: { contains: 'Abad', mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (clientes.length === 0) {
      console.log('❌ No se encontró ningún cliente con el nombre "Ines Abad"');
      console.log('\n📋 Mostrando últimos 10 clientes creados:\n');
      
      const ultimosClientes = await prisma.cliente.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          createdAt: true,
          updatedAt: true
        }
      });

      ultimosClientes.forEach((c, i) => {
        console.log(`${i + 1}. ${c.nombre} ${c.apellidos || ''}`);
        console.log(`   ID: ${c.id}`);
        console.log(`   Creado: ${c.createdAt}`);
        console.log(`   Actualizado: ${c.updatedAt}`);
        console.log('');
      });
    } else {
      console.log(`✅ Se encontraron ${clientes.length} cliente(s):\n`);
      
      clientes.forEach((c, i) => {
        console.log(`${i + 1}. ${c.nombre} ${c.apellidos || ''}`);
        console.log(`   ID: ${c.id}`);
        console.log(`   Cédula: ${c.cedula || 'N/A'}`);
        console.log(`   Teléfono: ${c.telefono || 'N/A'}`);
        console.log(`   Email: ${c.email || 'N/A'}`);
        console.log(`   Estado: ${c.estado || 'N/A'}`);
        console.log(`   Creado: ${c.createdAt}`);
        console.log(`   Actualizado: ${c.updatedAt}`);
        console.log('');
      });
    }

    // Verificar total de clientes
    const totalClientes = await prisma.cliente.count();
    console.log(`📊 Total de clientes en la base de datos: ${totalClientes}`);

    // Verificar clientes creados el 8 de enero
    const clientesDia8 = await prisma.cliente.findMany({
      where: {
        createdAt: {
          gte: new Date('2026-01-08T00:00:00.000Z'),
          lt: new Date('2026-01-09T00:00:00.000Z')
        }
      },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        createdAt: true
      }
    });

    console.log(`\n📅 Clientes creados el 8 de enero de 2026: ${clientesDia8.length}`);
    if (clientesDia8.length > 0) {
      clientesDia8.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.nombre} ${c.apellidos || ''} - ${c.createdAt}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInesAbad();
