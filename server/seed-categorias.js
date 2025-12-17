const prisma = require('./prismaClient');

async function seedCategorias() {
  try {
    console.log('🌱 Seeding categorías...');

    // Verificar si ya existen categorías
    const existingCategorias = await prisma.categoria.findMany();
    if (existingCategorias.length > 0) {
      console.log('✅ Categorías ya existen, saltando seed...');
      return;
    }

    const categorias = [
      {
        nombre: 'Internet Residencial',
        descripcion: 'Servicios de internet para hogares y residencias',
        icono: 'wifi',
        color: '#2196F3',
        activo: true,
        orden: 1
      },
      {
        nombre: 'Internet Empresarial',
        descripcion: 'Servicios de internet para empresas y oficinas',
        icono: 'business',
        color: '#FF9800',
        activo: true,
        orden: 2
      },
      {
        nombre: 'Telefonía',
        descripcion: 'Servicios de telefonía fija y móvil',
        icono: 'phone',
        color: '#4CAF50',
        activo: true,
        orden: 3
      },
      {
        nombre: 'Televisión',
        descripcion: 'Servicios de televisión por cable y streaming',
        icono: 'tv',
        color: '#9C27B0',
        activo: true,
        orden: 4
      },
      {
        nombre: 'Paquetes Combo',
        descripcion: 'Paquetes combinados de internet, telefonía y TV',
        icono: 'package_2',
        color: '#F44336',
        activo: true,
        orden: 5
      },
      {
        nombre: 'Servicios Técnicos',
        descripcion: 'Instalación, mantenimiento y soporte técnico',
        icono: 'build',
        color: '#607D8B',
        activo: true,
        orden: 6
      }
    ];

    for (const categoria of categorias) {
      const created = await prisma.categoria.create({
        data: categoria
      });
      console.log(`✅ Categoría creada: ${created.nombre}`);
    }

    console.log('🎉 Seed de categorías completado exitosamente!');
  } catch (error) {
    console.error('❌ Error seeding categorías:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedCategorias()
    .then(() => {
      console.log('✅ Seed completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en seed:', error);
      process.exit(1);
    });
}

module.exports = { seedCategorias };