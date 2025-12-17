const prisma = require('./server/prismaClient');

async function recalcularCajaPrincipal() {
  try {
    console.log('=== RECALCULANDO CAJA PRINCIPAL ===');
    
    // Buscar la caja principal
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
      console.log('No se encontró la caja principal');
      return;
    }

    console.log(`Caja encontrada: ${cajaPrincipal.nombre}`);
    console.log(`Saldo inicial: ${cajaPrincipal.saldoInicial}`);
    console.log(`Saldo actual: ${cajaPrincipal.saldoActual}`);

    // Obtener todos los movimientos de esta caja
    const movimientos = await prisma.movimientoContable.findMany({
      where: { cajaId: cajaPrincipal.id },
      select: {
        id: true,
        tipo: true,
        monto: true,
        descripcion: true,
        fecha: true
      },
      orderBy: { fecha: 'desc' }
    });

    console.log(`\nTotal movimientos: ${movimientos.length}`);

    // Calcular totales
    let totalIngresos = 0;
    let totalGastos = 0;

    movimientos.forEach(m => {
      if (m.tipo === 'ingreso') {
        totalIngresos += parseFloat(m.monto);
      } else if (m.tipo === 'gasto') {
        totalGastos += parseFloat(m.monto);
      }
    });

    const saldoInicial = parseFloat(cajaPrincipal.saldoInicial);
    const saldoCalculado = saldoInicial + totalIngresos - totalGastos;

    console.log(`\nRESUMEN:`);
    console.log(`Saldo inicial: ${saldoInicial}`);
    console.log(`Total ingresos: ${totalIngresos}`);
    console.log(`Total gastos: ${totalGastos}`);
    console.log(`Saldo calculado: ${saldoCalculado}`);
    console.log(`Saldo actual en BD: ${cajaPrincipal.saldoActual}`);

    // Actualizar si es diferente
    if (Math.abs(saldoCalculado - parseFloat(cajaPrincipal.saldoActual)) > 0.01) {
      await prisma.caja.update({
        where: { id: cajaPrincipal.id },
        data: { saldoActual: saldoCalculado }
      });
      console.log(`\n✅ Saldo actualizado a: ${saldoCalculado}`);
    } else {
      console.log(`\n✅ El saldo ya está correcto`);
    }

    // Mostrar últimos movimientos
    console.log(`\nÚLTIMOS 10 MOVIMIENTOS:`);
    console.table(movimientos.slice(0, 10).map(m => ({
      id: m.id.substring(0, 8),
      tipo: m.tipo,
      monto: m.monto.toString(),
      descripcion: m.descripcion?.substring(0, 50),
      fecha: m.fecha.toISOString().substring(0, 19)
    })));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recalcularCajaPrincipal();