const PrismaRetry = require('../prismaRetry');
const prisma = new PrismaRetry();

async function createPapeleriaCategoria() {
  try {
    // Verificar si ya existe una categoría para ventas de papelería
    const existingCategoria = await prisma.findFirst({
      where: {
        OR: [
          { nombre: { contains: 'Venta Papeleria', mode: 'insensitive' } },
          { nombre: { contains: 'Ventas Papelería', mode: 'insensitive' } },
          { nombre: { contains: 'Ingreso Papeleria', mode: 'insensitive' } }
        ]
      }
    });

    if (existingCategoria) {
      console.log('Categoría para ventas de papelería ya existe:', existingCategoria);
      return existingCategoria;
    }

    // Crear una nueva categoría para ventas de papelería
    const newCategoria = await prisma.create({
      data: {
        nombre: 'Ventas Papelería',
        descripcion: 'Ingresos por ventas de productos de papelería',
        tipo: 'ingreso',
        subtipo: 'ventas',
        codigo: 'VENTAS_PAP',
        esDetalle: true,
        activa: true
      }
    });

    console.log('Categoría para ventas de papelería creada:', newCategoria);
    return newCategoria;
  } catch (error) {
    console.error('Error creando categoría para ventas de papelería:', error);
    throw error;
  }
}

module.exports = createPapeleriaCategoria;