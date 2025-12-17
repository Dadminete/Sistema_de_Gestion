const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function asignarMovimientosAntiguos() {
  console.log('🔄 Asignando movimientos antiguos a las cajas correspondientes...\n');

  try {
    // 1. Obtener las cajas disponibles
    const cajas = await prisma.caja.findMany({
      select: {
        id: true,
        nombre: true,
        cuentaContable: {
          select: {
            codigo: true,
            nombre: true
          }
        }
      }
    });

    if (cajas.length === 0) {
      console.log('⚠️  No hay cajas en el sistema');
      return;
    }

    console.log('📦 Cajas disponibles:');
    cajas.forEach(caja => {
      console.log(`   - ${caja.nombre} (ID: ${caja.id})`);
      if (caja.cuentaContable) {
        console.log(`     Cuenta: ${caja.cuentaContable.codigo} - ${caja.cuentaContable.nombre}`);
      }
    });
    console.log('');

    // Buscar IDs de las cajas
    const cajaPrincipal = cajas.find(c => c.nombre === 'Caja');
    const cajaPapeleria = cajas.find(c => c.nombre === 'Papeleria');

    if (!cajaPrincipal || !cajaPapeleria) {
      console.log('⚠️  No se encontraron las cajas "Caja" y "Papeleria"');
      return;
    }

    console.log('🔍 Verificando movimientos sin caja_id...\n');

    // 2. Contar movimientos sin caja_id
    const movimientosSinCaja = await prisma.movimientoContable.count({
      where: {
        cajaId: null
      }
    });

    console.log(`Total de movimientos sin caja_id: ${movimientosSinCaja}\n`);

    if (movimientosSinCaja === 0) {
      console.log('✅ No hay movimientos sin caja_id. Todo está correcto.\n');
      return;
    }

    // 3. Ver ejemplos de movimientos sin caja
    const ejemplos = await prisma.movimientoContable.findMany({
      where: {
        cajaId: null
      },
      select: {
        id: true,
        tipo: true,
        monto: true,
        metodo: true,
        descripcion: true,
        fecha: true
      },
      take: 5,
      orderBy: {
        fecha: 'desc'
      }
    });

    console.log('📋 Ejemplos de movimientos sin caja_id:');
    ejemplos.forEach((mov, index) => {
      console.log(`\n   ${index + 1}. ${mov.tipo.toUpperCase()} - $${mov.monto}`);
      console.log(`      Método: ${mov.metodo}`);
      console.log(`      Fecha: ${mov.fecha.toISOString()}`);
      console.log(`      Descripción: ${mov.descripcion || 'Sin descripción'}`);
    });
    console.log('');

    // 4. Contar por método
    const porMetodo = await prisma.$queryRaw`
      SELECT metodo, COUNT(*) as count
      FROM movimientos_contables
      WHERE caja_id IS NULL
      GROUP BY metodo
      ORDER BY count DESC
    `;

    console.log('📊 Movimientos sin caja_id por método:');
    porMetodo.forEach(item => {
      console.log(`   - ${item.metodo}: ${item.count} movimientos`);
    });
    console.log('');

    // 5. Asignar movimientos según el método
    console.log('🔄 Asignando movimientos a cajas...\n');

    // Asignar movimientos de efectivo/caja a la Caja Principal
    const metodosEfectivo = ['efectivo', 'caja', 'cash'];
    let totalAsignadosCaja = 0;

    for (const metodo of metodosEfectivo) {
      const result = await prisma.movimientoContable.updateMany({
        where: {
          metodo: metodo,
          cajaId: null
        },
        data: {
          cajaId: cajaPrincipal.id
        }
      });

      if (result.count > 0) {
        console.log(`   ✅ Asignados ${result.count} movimientos de método "${metodo}" a Caja Principal`);
        totalAsignadosCaja += result.count;
      }
    }

    // Asignar movimientos de papelería a la Caja Papelería
    const result2 = await prisma.movimientoContable.updateMany({
      where: {
        metodo: 'papeleria',
        cajaId: null
      },
      data: {
        cajaId: cajaPapeleria.id
      }
    });

    if (result2.count > 0) {
      console.log(`   ✅ Asignados ${result2.count} movimientos de método "papeleria" a Caja Papelería`);
    }

    const totalAsignadosPapeleria = result2.count;

    console.log('');

    // 6. Verificar movimientos restantes sin caja
    const movimientosRestantes = await prisma.movimientoContable.count({
      where: {
        cajaId: null
      }
    });

    console.log('═══════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE ASIGNACIÓN');
    console.log('═══════════════════════════════════════════════════\n');
    console.log(`✅ Asignados a Caja Principal: ${totalAsignadosCaja} movimientos`);
    console.log(`✅ Asignados a Caja Papelería: ${totalAsignadosPapeleria} movimientos`);
    console.log(`⚠️  Movimientos sin asignar: ${movimientosRestantes}\n`);

    if (movimientosRestantes > 0) {
      console.log('⚠️  Hay movimientos que no se pudieron asignar automáticamente.');
      console.log('    Estos movimientos tienen métodos que no coinciden con ninguna caja.\n');

      // Mostrar métodos no asignados
      const metodosNoAsignados = await prisma.$queryRaw`
        SELECT metodo, COUNT(*) as count
        FROM movimientos_contables
        WHERE caja_id IS NULL
        GROUP BY metodo
        ORDER BY count DESC
      `;

      if (metodosNoAsignados.length > 0) {
        console.log('📋 Métodos sin asignar:');
        metodosNoAsignados.forEach(item => {
          console.log(`   - ${item.metodo}: ${item.count} movimientos`);
        });
        console.log('');
        console.log('💡 Solución: Asigna manualmente estos movimientos o actualiza el script.');
      }
    } else {
      console.log('🎉 ¡Todos los movimientos han sido asignados exitosamente!\n');
    }

    // 7. Mostrar resumen por caja
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 MOVIMIENTOS POR CAJA');
    console.log('═══════════════════════════════════════════════════\n');

    for (const caja of cajas) {
      const totalMovimientos = await prisma.movimientoContable.count({
        where: {
          cajaId: caja.id
        }
      });

      const totalIngresos = await prisma.movimientoContable.aggregate({
        where: {
          cajaId: caja.id,
          tipo: 'ingreso'
        },
        _sum: {
          monto: true
        },
        _count: true
      });

      const totalGastos = await prisma.movimientoContable.aggregate({
        where: {
          cajaId: caja.id,
          tipo: 'gasto'
        },
        _sum: {
          monto: true
        },
        _count: true
      });

      console.log(`📦 ${caja.nombre}`);
      console.log(`   Total de movimientos: ${totalMovimientos}`);
      console.log(`   Ingresos: ${totalIngresos._count} movimientos - $${totalIngresos._sum.monto || 0}`);
      console.log(`   Gastos: ${totalGastos._count} movimientos - $${totalGastos._sum.monto || 0}`);
      console.log('');
    }

    console.log('✅ Proceso completado\n');
    console.log('📋 Próximos pasos:');
    console.log('   1. Reinicia el servidor backend');
    console.log('   2. Refresca el navegador en /cajas/apertura-cierre');
    console.log('   3. Verifica que cada caja muestre sus movimientos correctos\n');

  } catch (error) {
    console.error('\n❌ Error durante la asignación:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

asignarMovimientosAntiguos();
