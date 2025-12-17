const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSuscripciones() {
  try {
    console.log('🔍 Checking suscripciones database...');
    
    // Count total suscripciones
    const total = await prisma.suscripcion.count();
    console.log('📊 Total suscripciones:', total);
    
    // Count by estado
    const byEstado = await prisma.suscripcion.groupBy({
      by: ['estado'],
      _count: { id: true }
    });
    console.log('📊 By estado:', byEstado);
    
    // Get recent suscripciones regardless of estado
    const recent = await prisma.suscripcion.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            estado: true
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
    
    console.log('📋 Recent suscripciones:');
    recent.forEach((sub, i) => {
      console.log(`${i + 1}. ${sub.cliente?.nombre} ${sub.cliente?.apellidos || ''}`);
      console.log(`   Suscripción estado: ${sub.estado}`);
      console.log(`   Cliente estado: ${sub.cliente?.estado}`);
      console.log(`   Servicio: ${sub.servicio?.nombre || 'N/A'}`);
      console.log(`   Plan: ${sub.plan?.nombre || 'N/A'}`);
      console.log(`   Creado: ${sub.createdAt}`);
      console.log('   ---');
    });
    
    // Try the exact query that the endpoint uses
    console.log('\n🎯 Testing exact endpoint query...');
    const endpointQuery = await prisma.suscripcion.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: {
        estado: 'activo'
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
    
    console.log('🎯 Endpoint query results:', endpointQuery.length, 'items');
    
    if (endpointQuery.length === 0) {
      console.log('❌ No active suscripciones found');
      
      // Let's see what estados exist and try different values
      console.log('\n🔧 Trying different estado values...');
      
      const tryEstados = ['Activo', 'ACTIVO', 'activo', 'active', 'Active'];
      for (const estado of tryEstados) {
        const count = await prisma.suscripcion.count({
          where: { estado }
        });
        console.log(`Estado "${estado}": ${count} records`);
      }
      
    } else {
      console.log('✅ Found active suscripciones for endpoint');
      endpointQuery.forEach((sub, i) => {
        console.log(`${i + 1}. ${sub.cliente?.nombre} ${sub.cliente?.apellidos || ''}`);
        console.log(`   Estado: ${sub.estado}`);
        console.log(`   Servicio: ${sub.servicio?.nombre}`);
        console.log(`   Plan: ${sub.plan?.nombre}`);
      });
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Database error:', error);
    await prisma.$disconnect();
  }
}

checkSuscripciones();