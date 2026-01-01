const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function revertirUltimoAjuste() {
  try {
    console.log('=== REVIRTIENDO ÚLTIMO AJUSTE ===\n');

    // ID del último ajuste creado
    const ajusteId = '3bf87dcb-0997-4686-b9a9-9e7df161a79d';

    const ajuste = await prisma.movimientoContable.findUnique({
      where: { id: ajusteId },
      include: {
        caja: { select: { nombre: true, id: true } }
      }
    });

    if (!ajuste) {
      console.log('❌ No se encontró el ajuste a eliminar');
      return;
    }

    console.log(`🗑️  Eliminando ajuste:`);
    console.log(`   Caja: ${ajuste.caja?.nombre}`);
    console.log(`   Tipo: ${ajuste.tipo}`);
    console.log(`   Monto: RD$${Number(ajuste.monto)}`);
    console.log(`   Descripción: ${ajuste.descripcion}`);

    await prisma.movimientoContable.delete({
      where: { id: ajusteId }
    });

    console.log('\n✅ Ajuste eliminado');

    // Recalcular saldo correcto
    const cajaPrincipal = await prisma.caja.findUnique({
      where: { id: ajuste.caja.id }
    });

    if (cajaPrincipal) {
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

      console.log('\n🔧 Recalculando saldo...');
      console.log(`   Saldo Inicial: RD$${parseFloat(cajaPrincipal.saldoInicial)}`);
      console.log(`   Total Ingresos: RD$${totalIngresos}`);
      console.log(`   Total Gastos: RD$${totalGastos}`);
      console.log(`   Saldo Calculado: RD$${saldoCalculado}`);

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

      console.log(`\n✅ Saldo actualizado a: RD$${saldoCalculado}`);
    }

    console.log('\n🎉 ¡REVERSIÓN COMPLETADA!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

revertirUltimoAjuste();
