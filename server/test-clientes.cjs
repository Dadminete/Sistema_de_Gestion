// Script de prueba para verificar clientes en la base de datos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testClientes() {
  try {
    console.log('🔍 Verificando clientes en la base de datos...');
    
    // Contar todos los clientes
    const totalClientes = await prisma.cliente.count();
    console.log('📊 Total de clientes:', totalClientes);
    
    // Contar clientes activos
    const clientesActivos = await prisma.cliente.count({
      where: { estado: 'activo' }
    });
    console.log('✅ Clientes activos:', clientesActivos);
    
    // Mostrar algunos clientes de ejemplo
    const ejemploClientes = await prisma.cliente.findMany({
      where: { estado: 'activo' },
      take: 5,
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        estado: true,
        codigoCliente: true,
        suscripciones: {
          where: { estado: 'activo' },
          select: {
            diaFacturacion: true,
            estado: true
          }
        }
      }
    });
    
    console.log('📝 Ejemplos de clientes activos:');
    ejemploClientes.forEach((cliente, index) => {
      console.log(`${index + 1}. ${cliente.nombre} ${cliente.apellidos} (${cliente.codigoCliente}) - Suscripciones activas: ${cliente.suscripciones.length}`);
    });
    
    // Verificar clientes con suscripciones activas
    const clientesConSuscripciones = await prisma.cliente.count({
      where: {
        estado: 'activo',
        suscripciones: {
          some: { estado: 'activo' }
        }
      }
    });
    console.log('💼 Clientes activos con suscripciones activas:', clientesConSuscripciones);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testClientes();