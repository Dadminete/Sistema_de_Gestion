const prisma = require('./server/prismaClient');

(async () => {
  try {
    console.log('🔍 Verificando categorías de ajustes...');
    
    const categorias = await prisma.categoriaCuenta.findMany({
      where: { subtipo: 'Ajustes y Correcciones' },
      orderBy: { codigo: 'asc' }
    });
    
    console.log('✅ Encontradas', categorias.length, 'categorías:');
    categorias.forEach(cat => {
      console.log('  -', cat.codigo, '|', cat.nombre, '(' + cat.tipo + ') | Activa:', cat.activa);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
})();