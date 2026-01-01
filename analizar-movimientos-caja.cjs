const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function analizarMovimientosCaja() {
  try {
    console.log('=== ANÁLISIS DE MOVIMIENTOS CAJA PRINCIPAL ===\n');

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
      console.log('❌ NO se encontró Caja Principal');
      return;
    }

    console.log(`📦 Caja: ${cajaPrincipal.nombre}`);
    console.log(`   ID: ${cajaPrincipal.id}`);
    console.log(`   Saldo Inicial: RD$${Number(cajaPrincipal.saldoInicial)}`);
    console.log(`   Saldo Actual: RD$${Number(cajaPrincipal.saldoActual)}`);

    // Obtener resumen por método y tipo
    const resumenPorMetodo = await prisma.movimientoContable.groupBy({
      by: ['metodo', 'tipo'],
      where: { cajaId: cajaPrincipal.id },
      _sum: { monto: true },
      _count: true
    });

    console.log('\n📊 Resumen por método y tipo:');
    resumenPorMetodo.forEach(item => {
      console.log(`   ${item.metodo} - ${item.tipo}: RD$${Number(item._sum.monto)} (${item._count} movimientos)`);
    });

    // Movimientos de ajuste
    const ajustes = await prisma.movimientoContable.findMany({
      where: {
        cajaId: cajaPrincipal.id,
        metodo: 'ajuste'
      },
      orderBy: { fecha: 'desc' }
    });

    console.log(`\n🔧 Movimientos de ajuste (${ajustes.length}):`);
    ajustes.forEach(ajuste => {
      console.log(`   ${ajuste.fecha.toISOString().split('T')[0]} - ${ajuste.tipo}: RD$${Number(ajuste.monto)}`);
      console.log(`      ${ajuste.descripcion}`);
    });

    // Calcular saldo sin ajustes
    const movimientosSinAjustes = await prisma.movimientoContable.groupBy({
      by: ['tipo'],
      where: {
        cajaId: cajaPrincipal.id,
        metodo: { not: 'ajuste' }
      },
      _sum: { monto: true }
    });

    let ingresos = 0;
    let gastos = 0;

    movimientosSinAjustes.forEach(m => {
      if (m.tipo === 'ingreso') {
        ingresos += parseFloat(m._sum.monto || 0);
      } else if (m.tipo === 'gasto') {
        gastos += parseFloat(m._sum.monto || 0);
      }
    });

    const saldoSinAjustes = parseFloat(cajaPrincipal.saldoInicial) + ingresos - gastos;

    console.log('\n🧮 Cálculo sin ajustes:');
    console.log(`   Saldo Inicial: RD$${parseFloat(cajaPrincipal.saldoInicial)}`);
    console.log(`   Ingresos (sin ajustes): RD$${ingresos}`);
    console.log(`   Gastos (sin ajustes): RD$${gastos}`);
    console.log(`   Saldo calculado: RD$${saldoSinAjustes}`);

    console.log('\n💡 Para tener saldo de RD$10,535:');
    console.log(`   Ajuste necesario: RD$${10535 - saldoSinAjustes}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analizarMovimientosCaja();
