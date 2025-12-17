const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugTopSources() {
  try {
    console.log('=== DEBUGGING TOP INCOME SOURCES ===\n');
    
    // 1. Check raw data
    const rawMovimientos = await prisma.movimientoContable.findMany({
      where: {
        tipo: 'ingreso',
        metodo: { not: 'banco' }
      },
      select: {
        id: true,
        monto: true,
        categoriaId: true,
        categoria: { select: { nombre: true } },
        metodo: true,
        fecha: true
      },
      orderBy: { monto: 'desc' },
      take: 20
    });
    
    console.log('Raw movements (top 20 by amount):');
    rawMovimientos.forEach(m => {
      console.log(`ID: ${m.id}, Monto: ${m.monto}, Categoria: ${m.categoria?.nombre || 'N/A'}, Método: ${m.metodo}, Fecha: ${m.fecha}`);
    });
    
    console.log('\n=== GROUP BY CATEGORY ===\n');
    
    // 2. Check grouped data
    const grouped = await prisma.movimientoContable.groupBy({
      by: ['categoriaId'],
      where: {
        tipo: 'ingreso',
        metodo: { not: 'banco' }
      },
      _sum: {
        monto: true,
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          monto: 'desc',
        },
      },
      take: 5,
    });
    
    console.log('Grouped by category:');
    for (const group of grouped) {
      const categoria = await prisma.categoriaCuenta.findUnique({
        where: { id: group.categoriaId },
        select: { nombre: true }
      });
      
      const montoNum = Number(group._sum.monto || 0);
      console.log(`Category: ${categoria?.nombre || 'N/A'}`);
      console.log(`  Raw amount: ${group._sum.monto}`);
      console.log(`  Converted: ${montoNum}`);
      console.log(`  Count: ${group._count.id}`);
      console.log('');
    }
    
    // 3. Calculate total
    const totalSum = grouped.reduce((sum, g) => sum + Number(g._sum.monto || 0), 0);
    console.log(`Total calculated: ${totalSum}`);
    console.log(`Total formatted: ${new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(totalSum)}`);
    
    // 4. Check for potential issues
    console.log('\n=== POTENTIAL ISSUES ===\n');
    
    // Check for very large amounts
    const largeAmounts = await prisma.movimientoContable.findMany({
      where: {
        tipo: 'ingreso',
        metodo: { not: 'banco' },
        monto: { gt: 1000000 } // More than 1M
      },
      select: {
        id: true,
        monto: true,
        descripcion: true,
        categoria: { select: { nombre: true } },
        fecha: true
      }
    });
    
    console.log('Large amounts (>1M):');
    largeAmounts.forEach(m => {
      console.log(`ID: ${m.id}, Monto: ${m.monto}, Desc: ${m.descripcion}, Cat: ${m.categoria?.nombre}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugTopSources();