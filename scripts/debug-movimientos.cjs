const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugMovimientos() {
  try {
    console.log('=== DEBUG DE MOVIMIENTOS CONTABLES ===');
    
    // Obtener todos los movimientos contables
    const movimientos = await prisma.movimientoContable.findMany({
      include: {
        categoria: true,
        usuario: {
          select: {
            id: true,
            username: true,
            nombre: true,
            apellido: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Total de movimientos:', movimientos.length);
    
    // Filtrar movimientos por método
    const movimientosCaja = movimientos.filter(m => m.metodo === 'caja');
    const movimientosPapeleria = movimientos.filter(m => m.metodo === 'papeleria');
    const movimientosBanco = movimientos.filter(m => m.metodo === 'banco');
    
    console.log('Movimientos de caja:', movimientosCaja.length);
    console.log('Movimientos de papeleria:', movimientosPapeleria.length);
    console.log('Movimientos de banco:', movimientosBanco.length);
    
    // Mostrar detalles de movimientos de papeleria
    console.log('\n=== MOVIMIENTOS DE PAPELERÍA ===');
    movimientosPapeleria.forEach(mov => {
      console.log(`- ${mov.tipo}: ${mov.monto} (${mov.descripcion}) - Categoría: ${mov.categoria?.nombre || 'Sin categoría'}`);
    });
    
    // Obtener balances de cajas
    console.log('\n=== BALANCES DE CAJAS ===');
    const cajas = await prisma.caja.findMany({
      where: { activa: true }
    });
    
    cajas.forEach(caja => {
      console.log(`${caja.nombre} (${caja.tipo}): ${caja.saldoActual}`);
    });
    
    // Obtener cuentas contables
    console.log('\n=== CUENTAS CONTABLES ===');
    const cuentas = await prisma.cuentaContable.findMany({
      where: { activa: true }
    });
    
    cuentas.forEach(cuenta => {
      console.log(`${cuenta.codigo} - ${cuenta.nombre}: ${cuenta.saldoActual}`);
    });
    
  } catch (error) {
    console.error('Error en el debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el debug si se corre directamente
if (require.main === module) {
  debugMovimientos()
    .then(() => console.log('Debug completado'))
    .catch(error => {
      console.error('Error en el debug:', error);
      process.exit(1);
    });
}

module.exports = debugMovimientos;