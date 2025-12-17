import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testClientCreation() {
  console.log('🧪 Probando creación de clientes...\n');

  try {
    // Buscar si ya existe Adrian Oddelia
    let existingClient = await prisma.cliente.findFirst({
      where: {
        nombre: 'Adrian',
        apellidos: 'Oddelia'
      }
    });

    if (existingClient) {
      console.log('✅ Cliente Adrian Oddelia ya existe:');
      console.log(`   ID: ${existingClient.id}`);
      console.log(`   Estado actual: ${existingClient.estado}`);

      // Si no está inactivo, marcarlo como inactivo
      if (existingClient.estado !== 'INACTIVO') {
        await prisma.cliente.update({
          where: { id: existingClient.id },
          data: { estado: 'INACTIVO' }
        });
        console.log('🔄 Cliente marcado como INACTIVO');
      }
    } else {
      // Crear cliente Adrian Oddelia como inactivo
      const testClient = await prisma.cliente.create({
        data: {
          nombre: 'Adrian',
          apellidos: 'Oddelia',
          telefono: '809-123-4567',
          email: 'adrian.oddelia@example.com',
          direccion: 'Calle Test #123',
          sector_barrio: 'Sector Test',
          ciudad: 'Santo Domingo',
          provincia: 'Distrito Nacional',
          codigoPostal: '10101',
          sexo: 'MASCULINO',
          categoria_cliente: 'NUEVO',
          estado: 'INACTIVO',
          limiteCrediticio: 5000,
          creditoDisponible: 5000,
          diasCredito: 30,
          descuentoPorcentaje: 5,
          tipoCliente: 'residencial',
          fecha_ingreso: new Date()
        }
      });

      console.log(`✅ Cliente Adrian Oddelia creado exitosamente:`);
      console.log(`   ID: ${testClient.id}`);
      console.log(`   Nombre: ${testClient.nombre} ${testClient.apellidos}`);
      console.log(`   Código: ${testClient.codigoCliente}`);
      console.log(`   Categoría: ${testClient.categoria_cliente}`);
      console.log(`   Estado: ${testClient.estado}`);
    }

    // Verificar clientes inactivos
    const inactiveClients = await prisma.cliente.findMany({
      where: { estado: 'INACTIVO' },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n📊 Total de clientes inactivos: ${inactiveClients.length}`);
    console.log('Clientes inactivos:');
    inactiveClients.forEach(client => {
      console.log(`   - ${client.codigoCliente}: ${client.nombre} ${client.apellidos} (${client.estado})`);
    });

    console.log('\n🎉 ¡Prueba completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    console.error('Detalles del error:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

testClientCreation();
