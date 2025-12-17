const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function diagnosticoPagosNomina() {
  try {
    console.log('=== DIAGNÓSTICO DE PAGOS DE NÓMINA ===\n');

    // 1. Verificar caja principal
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

    console.log('✅ Caja Principal encontrada:');
    console.log(`   ID: ${cajaPrincipal.id}`);
    console.log(`   Nombre: ${cajaPrincipal.nombre}`);
    console.log(`   Saldo Inicial: RD$${Number(cajaPrincipal.saldoInicial)}`);
    console.log(`   Saldo Actual: RD$${Number(cajaPrincipal.saldoActual)}`);

    // 2. Buscar movimientos de nómina recientes (últimas 24 horas)
    const fechaInicioHoy = new Date();
    fechaInicioHoy.setHours(0, 0, 0, 0);
    
    const movimientosNominaHoy = await prisma.movimientoContable.findMany({
      where: {
        descripcion: { contains: 'Nómina', mode: 'insensitive' },
        fecha: { gte: fechaInicioHoy }
      },
      orderBy: { fecha: 'desc' },
      take: 10
    });

    console.log(`\n📊 Movimientos de nómina hoy: ${movimientosNominaHoy.length}`);
    if (movimientosNominaHoy.length > 0) {
      console.log('Últimos movimientos:');
      movimientosNominaHoy.forEach(mov => {
        console.log(`   ${mov.tipo}: RD$${Number(mov.monto)} - ${mov.descripcion}`);
        console.log(`   Fecha: ${mov.fecha.toLocaleString()}, CajaID: ${mov.cajaId || 'NULL'}, Método: ${mov.metodo}`);
      });
    }

    // 3. Verificar pagos de nómina recientes
    const pagosNominaHoy = await prisma.nomina.findMany({
      where: {
        estadoPago: 'PAGADO',
        fechaPago: { gte: fechaInicioHoy }
      },
      include: {
        empleado: { select: { nombres: true, apellidos: true } }
      },
      orderBy: { fechaPago: 'desc' }
    });

    console.log(`\n💰 Pagos de nómina realizados hoy: ${pagosNominaHoy.length}`);
    if (pagosNominaHoy.length > 0) {
      pagosNominaHoy.forEach(pago => {
        console.log(`   ${pago.empleado.nombres} ${pago.empleado.apellidos}: RD$${Number(pago.salarioNeto)}`);
        console.log(`   Forma: ${pago.formaPago}, Caja: RD$${Number(pago.montoCaja || 0)}, Banco: RD$${Number(pago.montoBanco || 0)}`);
        console.log(`   Fecha: ${pago.fechaPago?.toLocaleString()}`);
      });
    }

    // 4. Recalcular saldo real de caja principal
    const movimientosCaja = await prisma.movimientoContable.groupBy({
      by: ['tipo'],
      where: { cajaId: cajaPrincipal.id },
      _sum: { monto: true }
    });

    let totalIngresos = 0;
    let totalGastos = 0;
    movimientosCaja.forEach(m => {
      if (m.tipo === 'ingreso') {
        totalIngresos += parseFloat(m._sum.monto || 0);
      } else if (m.tipo === 'gasto') {
        totalGastos += parseFloat(m._sum.monto || 0);
      }
    });

    const saldoCalculado = parseFloat(cajaPrincipal.saldoInicial) + totalIngresos - totalGastos;
    
    console.log('\n🧮 CÁLCULO DE SALDO:');
    console.log(`   Saldo Inicial: RD$${parseFloat(cajaPrincipal.saldoInicial)}`);
    console.log(`   Total Ingresos: RD$${totalIngresos}`);
    console.log(`   Total Gastos: RD$${totalGastos}`);
    console.log(`   Saldo Calculado: RD$${saldoCalculado}`);
    console.log(`   Saldo en DB: RD$${Number(cajaPrincipal.saldoActual)}`);
    console.log(`   Diferencia: RD$${saldoCalculado - Number(cajaPrincipal.saldoActual)}`);

    // 5. Verificar si hay movimientos de nómina sin cajaId
    const movimientosSinCaja = await prisma.movimientoContable.findMany({
      where: {
        descripcion: { contains: 'Nómina', mode: 'insensitive' },
        cajaId: null
      },
      orderBy: { fecha: 'desc' },
      take: 5
    });

    console.log(`\n⚠️  Movimientos de nómina sin cajaId: ${movimientosSinCaja.length}`);
    if (movimientosSinCaja.length > 0) {
      movimientosSinCaja.forEach(mov => {
        console.log(`   ${mov.tipo}: RD$${Number(mov.monto)} - ${mov.descripcion}`);
        console.log(`   Fecha: ${mov.fecha.toLocaleString()}, Método: ${mov.metodo}`);
      });
    }

    // 6. Buscar todos los movimientos de nómina (últimos 7 días)
    const fechaUltimaSemana = new Date();
    fechaUltimaSemana.setDate(fechaUltimaSemana.getDate() - 7);
    
    const todosMovimientosNomina = await prisma.movimientoContable.findMany({
      where: {
        descripcion: { contains: 'Nómina', mode: 'insensitive' },
        fecha: { gte: fechaUltimaSemana }
      },
      orderBy: { fecha: 'desc' }
    });

    console.log(`\n📋 Todos los movimientos de nómina (últimos 7 días): ${todosMovimientosNomina.length}`);
    if (todosMovimientosNomina.length > 0) {
      todosMovimientosNomina.forEach(mov => {
        console.log(`   ${mov.tipo}: RD$${Number(mov.monto)} - ${mov.descripcion}`);
        console.log(`   Fecha: ${mov.fecha.toLocaleString()}, CajaID: ${mov.cajaId || 'NULL'}, Método: ${mov.metodo}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticoPagosNomina();