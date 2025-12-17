import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findCajaFuerte() {
  try {
    const cajaFuerte = await prisma.caja.findFirst({
      where: {
        OR: [
          { nombre: { contains: 'Fuerte', mode: 'insensitive' } },
          { nombre: { contains: 'fuerte', mode: 'insensitive' } },
          { tipo: 'fuerte' }
        ]
      }
    });
    
    console.log('🔒 CAJA FUERTE ENCONTRADA:');
    if (cajaFuerte) {
      console.log(JSON.stringify(cajaFuerte, null, 2));
    } else {
      console.log('No se encontró caja fuerte');
    }
    
    // También buscar todas las cajas para ver las opciones
    const todasCajas = await prisma.caja.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' }
    });
    
    console.log('\n📦 TODAS LAS CAJAS ACTIVAS:');
    todasCajas.forEach(caja => {
      console.log(`- ${caja.nombre} (tipo: ${caja.tipo}) - ID: ${caja.id}`);
    });
    
    // Buscar movimientos de caja fuerte si existe
    if (cajaFuerte) {
      const movimientos = await prisma.movimientoContable.findMany({
        where: { cajaId: cajaFuerte.id },
        orderBy: { fecha: 'desc' },
        take: 10
      });
      
      console.log('\n📋 ÚLTIMOS 10 MOVIMIENTOS DE CAJA FUERTE:');
      movimientos.forEach(mov => {
        console.log(`- ${mov.fecha?.toISOString().split('T')[0]}: ${mov.tipo.toUpperCase()} RD$${mov.monto} - ${mov.descripcion || 'Sin descripción'}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findCajaFuerte();