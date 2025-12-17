const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function crearMovimientoPrueba() {
  try {
    console.log('🧪 CREANDO MOVIMIENTO DE PRUEBA PARA VERIFICAR VISIBILIDAD');
    console.log('='.repeat(60));

    // Obtener caja principal
    const cajaPrincipal = await prisma.caja.findFirst({
      where: {
        OR: [
          { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
          { tipo: 'general' }
        ],
        activa: true
      }
    });

    if (!cajaPrincipal) {
      console.log('❌ No se encontró caja principal');
      return;
    }

    // Buscar categoria de nómina
    const categoriaNomina = await prisma.categoriaCuenta.findFirst({
      where: {
        nombre: { contains: 'nómina', mode: 'insensitive' }
      }
    });

    if (!categoriaNomina) {
      console.log('❌ No se encontró categoría de nómina');
      return;
    }

    // Crear movimiento de prueba
    const movimientoPrueba = await prisma.movimientoContable.create({
      data: {
        descripcion: '🧪 PRUEBA - Pago Nómina Test - Verificación Frontend',
        tipo: 'gasto',
        monto: 1,  // RD$1 para prueba
        fecha: new Date(),
        metodo: 'caja',
        cajaId: cajaPrincipal.id,
        categoriaId: categoriaNomina.id
      },
      include: {
        caja: { select: { nombre: true } },
        categoria: { select: { nombre: true } }
      }
    });

    console.log('✅ MOVIMIENTO DE PRUEBA CREADO:');
    console.log(`   ID: ${movimientoPrueba.id}`);
    console.log(`   Descripción: ${movimientoPrueba.descripcion}`);
    console.log(`   Monto: RD$${Number(movimientoPrueba.monto)}`);
    console.log(`   Fecha: ${movimientoPrueba.fecha.toLocaleString()}`);
    console.log(`   Caja: ${movimientoPrueba.caja.nombre}`);
    console.log(`   Categoría: ${movimientoPrueba.categoria.nombre}`);

    console.log('\n🎯 AHORA DEBERÍAS VER ESTE MOVIMIENTO EN:');
    console.log('   1. ✅ Datatable: http://172.16.0.23:5173/contabilidad/ingresos-gastos (posición #1)');
    console.log('   2. ✅ Dashboard: http://172.16.0.23:5173/ en "Últimas Transacciones" (posición #1)');

    console.log('\n📝 INSTRUCCIONES:');
    console.log('   1. Abre las dos URLs en tu navegador');
    console.log('   2. Recarga las páginas (Ctrl+F5)');
    console.log('   3. Busca el movimiento que dice "🧪 PRUEBA - Pago Nómina Test"');
    console.log('   4. Si aparece, confirma que el sistema funciona correctamente');
    console.log('   5. Para eliminar este movimiento de prueba, ejecuta: eliminar-movimiento-prueba.cjs');

    // Crear script para eliminar el movimiento de prueba
    const scriptEliminar = `
const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function eliminarMovimientoPrueba() {
  try {
    const resultado = await prisma.movimientoContable.delete({
      where: { id: '${movimientoPrueba.id}' }
    });
    
    console.log('✅ Movimiento de prueba eliminado correctamente');
    console.log('ID eliminado:', resultado.id);
  } catch (error) {
    console.error('❌ Error eliminando movimiento de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

eliminarMovimientoPrueba();
`;

    // Guardar script de eliminación
    const fs = require('fs');
    fs.writeFileSync('eliminar-movimiento-prueba.cjs', scriptEliminar.trim());
    
    console.log('\n💾 Script de eliminación creado: eliminar-movimiento-prueba.cjs');

  } catch (error) {
    console.error('❌ Error creando movimiento de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

crearMovimientoPrueba();