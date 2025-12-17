const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPapeleriaCategoria() {
  try {
    console.log('Buscando categoría para ventas de papelería...');
    
    // Buscar categoría existente para ventas de papelería
    const existingCategoria = await prisma.categoriaCuenta.findFirst({
      where: {
        OR: [
          { nombre: { contains: 'Venta Papeleria', mode: 'insensitive' } },
          { nombre: { contains: 'Ventas Papelería', mode: 'insensitive' } },
          { nombre: { contains: 'Ingreso Papeleria', mode: 'insensitive' } }
        ]
      }
    });

    if (existingCategoria) {
      console.log('Categoría encontrada:', existingCategoria);
      return existingCategoria;
    } else {
      console.log('No se encontró categoría específica para ventas de papelería');
      
      // Buscar categoría genérica de ingresos
      const genericCategoria = await prisma.categoriaCuenta.findFirst({
        where: { tipo: 'ingreso', activa: true }
      });
      
      if (genericCategoria) {
        console.log('Usando categoría genérica de ingresos:', genericCategoria.nombre);
        return genericCategoria;
      } else {
        console.log('No se encontró ninguna categoría de ingresos');
        return null;
      }
    }
  } catch (error) {
    console.error('Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba si se corre directamente
if (require.main === module) {
  testPapeleriaCategoria();
}

module.exports = testPapeleriaCategoria;