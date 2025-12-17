const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPapeleriaCategoria() {
  try {
    console.log('Verificando si existe categoría para ventas de papelería...');
    
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
      console.log('Categoría para ventas de papelería ya existe:', existingCategoria.nombre);
      return existingCategoria;
    }

    console.log('Creando nueva categoría para ventas de papelería...');
    
    // Crear una nueva categoría para ventas de papelería
    const newCategoria = await prisma.categoriaCuenta.create({
      data: {
        nombre: 'Ventas Papelería',
        tipo: 'ingreso',
        subtipo: 'ventas',
        codigo: 'VENTAS_PAP',
        esDetalle: true,
        activa: true
      }
    });

    console.log('Categoría para ventas de papelería creada exitosamente:', newCategoria.nombre);
    return newCategoria;
  } catch (error) {
    console.error('Error creando categoría para ventas de papelería:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la creación si se corre directamente
if (require.main === module) {
  createPapeleriaCategoria()
    .then(() => console.log('Proceso completado'))
    .catch(error => {
      console.error('Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = createPapeleriaCategoria;