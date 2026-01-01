const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function limpiarAjustesIncorrectos() {
  try {
    console.log('=== ELIMINANDO AJUSTES INCORRECTOS ===\n');

    // IDs de los ajustes incorrectos (los 2 primeros intentos)
    const ajustesAEliminar = [
      '8513f2f0-a98c-4afc-a5c9-4eb6f3d1e53a', // Ajuste #3 (ingreso de 23735)
      '95eadc58-2559-4588-8582-677b1e61e102'  // Ajuste #4 (ingreso de 8670)
    ];

    console.log('🗑️  Eliminando movimientos de ajuste incorrectos...\n');

    for (const id of ajustesAEliminar) {
      const ajuste = await prisma.movimientoContable.findUnique({
        where: { id },
        include: { caja: { select: { nombre: true } } }
      });

      if (ajuste) {
        console.log(`   Eliminando: ${ajuste.caja?.nombre} - RD$${Number(ajuste.monto)} (${ajuste.tipo})`);
        await prisma.movimientoContable.delete({
          where: { id }
        });
      }
    }

    console.log('\n✅ Ajustes eliminados correctamente');

    // Recalcular los saldos correctos
    console.log('\n🔧 Recalculando saldos...');

    const cajaPrincipal = await prisma.caja.findFirst({
      where: {
        OR: [
          { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
          { tipo: 'general' }
        ],
        activa: true
      }
    });

    if (cajaPrincipal) {
      // Calcular saldo correcto
      const movimientos = await prisma.movimientoContable.groupBy({
        by: ['tipo'],
        where: { cajaId: cajaPrincipal.id },
        _sum: { monto: true }
      });

      let totalIngresos = 0;
      let totalGastos = 0;

      movimientos.forEach(m => {
        if (m.tipo === 'ingreso') {
          totalIngresos += parseFloat(m._sum.monto || 0);
        } else if (m.tipo === 'gasto') {
          totalGastos += parseFloat(m._sum.monto || 0);
        }
      });

      const saldoCalculado = parseFloat(cajaPrincipal.saldoInicial) + totalIngresos - totalGastos;

      console.log(`\n   Caja Principal:`);
      console.log(`     Saldo Inicial: RD$${parseFloat(cajaPrincipal.saldoInicial)}`);
      console.log(`     Total Ingresos: RD$${totalIngresos}`);
      console.log(`     Total Gastos: RD$${totalGastos}`);
      console.log(`     Saldo Calculado: RD$${saldoCalculado}`);

      if (Math.abs(saldoCalculado - Number(cajaPrincipal.saldoActual)) > 0.01) {
        console.log(`\n   ⚠️  Diferencia detectada. Actualizando saldo...`);
        await prisma.caja.update({
          where: { id: cajaPrincipal.id },
          data: { saldoActual: saldoCalculado }
        });
        
        if (cajaPrincipal.cuentaContableId) {
          await prisma.cuentaContable.update({
            where: { id: cajaPrincipal.cuentaContableId },
            data: { saldoActual: saldoCalculado }
          });
        }
        
        console.log(`   ✅ Saldo actualizado a: RD$${saldoCalculado}`);
      } else {
        console.log(`   ✅ Saldo correcto: RD$${Number(cajaPrincipal.saldoActual)}`);
      }
    }

    console.log('\n🎉 ¡LIMPIEZA COMPLETADA!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

limpiarAjustesIncorrectos();
