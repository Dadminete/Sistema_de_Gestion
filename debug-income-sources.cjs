const prisma = require('./server/prismaClient');

async function debugTopSources() {
  try {
    console.log('=== DEBUG TOP INCOME SOURCES ===\n');
    
    // Check grouped data
    const grouped = await prisma.movimientoContable.groupBy({
      by: ['categoriaId'],
      where: {
        tipo: 'ingreso',
        metodo: { not: 'banco' }
      },
      _sum: { monto: true },
      _count: { id: true },
      orderBy: { _sum: { monto: 'desc' } },
      take: 5,
    });
    
    console.log('Grouped results:');
    let total = 0;
    for (const g of grouped) {
      const cat = await prisma.categoriaCuenta.findUnique({
        where: { id: g.categoriaId },
        select: { nombre: true }
      });
      const rawAmount = g._sum.monto;
      const convertedAmount = Number(g._sum.monto || 0);
      total += convertedAmount;
      
      console.log(`Category: ${cat?.nombre || 'Unknown'}`);
      console.log(`  Raw: ${rawAmount}`);
      console.log(`  Converted: ${convertedAmount}`);
      console.log(`  Count: ${g._count.id}`);
      console.log('');
    }
    console.log(`Total calculated: ${total}`);
    console.log(`Total formatted: ${new Intl.NumberFormat('es-DO', { 
      style: 'currency', 
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(total)}`);
    
    // Check for potentially problematic records
    console.log('\n=== CHECKING FOR ISSUES ===\n');
    
    const largeAmounts = await prisma.movimientoContable.findMany({
      where: {
        tipo: 'ingreso',
        metodo: { not: 'banco' },
        monto: { gt: 100000000 } // More than 100M
      },
      select: {
        id: true,
        monto: true,
        descripcion: true,
        categoria: { select: { nombre: true } },
        fecha: true,
        metodo: true
      },
      take: 10
    });
    
    if (largeAmounts.length > 0) {
      console.log('Large amounts found (>100M):');
      largeAmounts.forEach(m => {
        console.log(`ID: ${m.id}, Amount: ${m.monto}, Method: ${m.metodo}, Desc: ${m.descripcion}`);
      });
    } else {
      console.log('No extremely large amounts found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTopSources();