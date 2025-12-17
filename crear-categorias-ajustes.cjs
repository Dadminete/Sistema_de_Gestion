const prisma = require('./server/prismaClient');

async function crearCategoriasAjustes() {
  try {
    console.log('🔧 Creando categorías para ajustes contables...\n');

    const categoriasAjustes = [
      // AJUSTES DE INGRESO
      {
        codigo: '4.9.001',
        nombre: 'Ajuste Contable - Ingreso',
        tipo: 'ingreso',
        subtipo: 'Ajustes y Correcciones'
      },
      {
        codigo: '4.9.002',
        nombre: 'Corrección de Diferencias - Ingreso',
        tipo: 'ingreso',
        subtipo: 'Ajustes y Correcciones'
      },
      {
        codigo: '4.9.003',
        nombre: 'Cuadre de Cajas - Ingreso',
        tipo: 'ingreso',
        subtipo: 'Ajustes y Correcciones'
      },
      {
        codigo: '4.9.004',
        nombre: 'Reclasificación - Ingreso',
        tipo: 'ingreso',
        subtipo: 'Ajustes y Correcciones'
      },

      // AJUSTES DE GASTO
      {
        codigo: '5.9.001',
        nombre: 'Ajuste Contable - Gasto',
        tipo: 'gasto',
        subtipo: 'Ajustes y Correcciones'
      },
      {
        codigo: '5.9.002',
        nombre: 'Corrección de Diferencias - Gasto',
        tipo: 'gasto',
        subtipo: 'Ajustes y Correcciones'
      },
      {
        codigo: '5.9.003',
        nombre: 'Cuadre de Cajas - Gasto',
        tipo: 'gasto',
        subtipo: 'Ajustes y Correcciones'
      },
      {
        codigo: '5.9.004',
        nombre: 'Reclasificación - Gasto',
        tipo: 'gasto',
        subtipo: 'Ajustes y Correcciones'
      }
    ];

    for (const categoriaData of categoriasAjustes) {
      // Verificar si ya existe
      const existingCategoria = await prisma.categoriaCuenta.findUnique({
        where: { codigo: categoriaData.codigo }
      });

      if (existingCategoria) {
        console.log(`⚠️  Categoría ya existe: ${categoriaData.codigo} - ${categoriaData.nombre}`);
        continue;
      }

      // Crear la categoría
      const nuevaCategoria = await prisma.categoriaCuenta.create({
        data: {
          codigo: categoriaData.codigo,
          nombre: categoriaData.nombre,
          tipo: categoriaData.tipo,
          subtipo: categoriaData.subtipo,
          esDetalle: true,
          activa: true,
          nivel: 3
        }
      });

      console.log(`✅ Creada: ${nuevaCategoria.codigo} - ${nuevaCategoria.nombre}`);
    }

    console.log('\n🎉 ¡Categorías de ajustes creadas exitosamente!');
    console.log('\n📋 CÓMO USAR ESTAS CATEGORÍAS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. 🔹 "Ajuste Contable" - Para ajustes generales de cuadre');
    console.log('2. 🔹 "Corrección de Diferencias" - Para corregir diferencias específicas');
    console.log('3. 🔹 "Cuadre de Cajas" - Para ajustar balances de cajas');
    console.log('4. 🔹 "Reclasificación" - Para corregir categorizaciones incorrectas');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 EJEMPLO DE USO:');
    console.log('   Si necesitas cuadrar +$500 en caja:');
    console.log('   → Tipo: Ingreso');
    console.log('   → Categoría: "Cuadre de Cajas - Ingreso"');
    console.log('   → Descripción: "Ajuste para cuadrar diferencia detectada en arqueo"');

  } catch (error) {
    console.error('❌ Error creando categorías:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  crearCategoriasAjustes()
    .then(() => {
      console.log('\n✨ Proceso completado. Ya puedes usar estas categorías en Ingresos/Gastos.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en el proceso:', error);
      process.exit(1);
    });
}

module.exports = crearCategoriasAjustes;