// Create test suscripciones data if none exists
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🔍 Checking suscripciones data...');
    
    // Check if there are any suscripciones
    const totalSuscripciones = await prisma.suscripcion.count();
    console.log('📊 Total suscripciones:', totalSuscripciones);
    
    if (totalSuscripciones === 0) {
      console.log('❌ No suscripciones found, creating test data...');
      
      // First, let's see what clientes exist
      const clientes = await prisma.cliente.findMany({
        take: 5,
        select: {
          id: true,
          nombre: true,
          apellidos: true
        }
      });
      
      console.log('👥 Found clients:', clientes.length);
      
      if (clientes.length === 0) {
        console.log('❌ No clients found, creating test clients first...');
        
        const testClients = await Promise.all([
          prisma.cliente.create({
            data: {
              nombre: 'Juan',
              apellidos: 'Pérez',
              codigoCliente: 'CLI-2025-0001',
              telefono: '809-555-0001',
              email: 'juan.perez@test.com',
              estado: 'activo',
              categoria_cliente: 'NUEVO'
            }
          }),
          prisma.cliente.create({
            data: {
              nombre: 'María',
              apellidos: 'García',
              codigoCliente: 'CLI-2025-0002',
              telefono: '809-555-0002',
              email: 'maria.garcia@test.com',
              estado: 'activo',
              categoria_cliente: 'NUEVO'
            }
          }),
          prisma.cliente.create({
            data: {
              nombre: 'Carlos',
              apellidos: 'López',
              codigoCliente: 'CLI-2025-0003',
              telefono: '809-555-0003',
              email: 'carlos.lopez@test.com',
              estado: 'activo',
              categoria_cliente: 'NUEVO'
            }
          })
        ]);
        
        console.log('✅ Created test clients:', testClients.length);
        clientes.push(...testClients.map(c => ({ id: c.id, nombre: c.nombre, apellidos: c.apellidos })));
      }
      
      // Check if servicios exist
      let servicios = await prisma.servicio.findMany({
        take: 3,
        select: { id: true, nombre: true }
      });
      
      if (servicios.length === 0) {
        console.log('❌ No servicios found, creating test servicios...');
        servicios = await Promise.all([
          prisma.servicio.create({
            data: {
              nombre: 'Internet Fibra Óptica',
              tipo: 'INTERNET',
              activo: true,
              precio: 1500.00
            }
          }),
          prisma.servicio.create({
            data: {
              nombre: 'Cable TV HD',
              tipo: 'TELEVISION',
              activo: true,
              precio: 800.00
            }
          }),
          prisma.servicio.create({
            data: {
              nombre: 'Telefonía Fija',
              tipo: 'TELEFONIA',
              activo: true,
              precio: 600.00
            }
          })
        ]);
        console.log('✅ Created test servicios:', servicios.length);
      }
      
      // Check if planes exist
      let planes = await prisma.plan.findMany({
        take: 3,
        select: { id: true, nombre: true }
      });
      
      if (planes.length === 0) {
        console.log('❌ No planes found, creating test planes...');
        planes = await Promise.all([
          prisma.plan.create({
            data: {
              nombre: 'Plan Básico',
              descripcion: 'Plan básico de internet',
              precio: 1200.00,
              activo: true
            }
          }),
          prisma.plan.create({
            data: {
              nombre: 'Plan Estándar',
              descripcion: 'Plan estándar con más velocidad',
              precio: 1500.00,
              activo: true
            }
          }),
          prisma.plan.create({
            data: {
              nombre: 'Plan Premium',
              descripcion: 'Plan premium con máxima velocidad',
              precio: 2000.00,
              activo: true
            }
          })
        ]);
        console.log('✅ Created test planes:', planes.length);
      }
      
      // Now create test suscripciones
      console.log('🏗️ Creating test suscripciones...');
      const testSuscripciones = [];
      
      for (let i = 0; i < Math.min(clientes.length, 3); i++) {
        const suscripcion = await prisma.suscripcion.create({
          data: {
            clienteId: clientes[i].id,
            servicioId: servicios[i % servicios.length].id,
            planId: planes[i % planes.length].id,
            estado: 'activo',
            fechaInicio: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Different dates
            monto: 1500.00,
            diaFacturacion: 15
          }
        });
        testSuscripciones.push(suscripcion);
      }
      
      console.log('✅ Created test suscripciones:', testSuscripciones.length);
    }
    
    // Now test our endpoint query
    console.log('\n🎯 Testing endpoint query...');
    const recentSuscripciones = await prisma.suscripcion.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: {
        OR: [
          { estado: 'activo' },
          { estado: 'Activo' },
          { estado: 'ACTIVO' },
          { estado: 'active' },
          { estado: 'Active' }
        ]
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
            fechaSuscripcion: true
          }
        },
        servicio: {
          select: {
            nombre: true
          }
        },
        plan: {
          select: {
            nombre: true
          }
        }
      }
    });
    
    console.log('📊 Query results:', recentSuscripciones.length, 'suscripciones found');
    
    const recentSubscribedClients = recentSuscripciones
      .filter(sub => sub.cliente)
      .map(sub => ({
        id: sub.cliente.id,
        name: `${sub.cliente.nombre} ${sub.cliente.apellidos || ''}`.trim(),
        email: sub.cliente.email || 'No disponible',
        fecha_suscripcion: sub.createdAt,
        servicio: sub.servicio?.nombre || 'Servicio no disponible',
        plan: sub.plan?.nombre || 'Plan no disponible',
        estado: sub.estado
      }));
    
    console.log('✅ Final formatted results:', recentSubscribedClients.length, 'clients');
    console.log('📋 Clients data:');
    recentSubscribedClients.forEach((client, i) => {
      console.log(`${i + 1}. ${client.name}`);
      console.log(`   Servicio: ${client.servicio}`);
      console.log(`   Plan: ${client.plan}`);
      console.log(`   Estado: ${client.estado}`);
      console.log(`   Fecha: ${client.fecha_suscripcion}`);
      console.log('   ---');
    });
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
  }
}

createTestData();