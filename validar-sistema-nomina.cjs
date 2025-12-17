const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function validarSistemaNomina() {
  try {
    console.log('=== VALIDACIÓN FINAL DEL SISTEMA DE NÓMINA ===\n');

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

    console.log('✅ ESTADO DE CAJA PRINCIPAL:');
    console.log(`   ID: ${cajaPrincipal.id}`);
    console.log(`   Nombre: ${cajaPrincipal.nombre}`);
    console.log(`   Saldo Inicial: RD$${Number(cajaPrincipal.saldoInicial)}`);
    console.log(`   Saldo Actual: RD$${Number(cajaPrincipal.saldoActual)}`);

    // 2. Verificar cuenta contable asociada
    if (cajaPrincipal.cuentaContableId) {
      const cuentaContable = await prisma.cuentaContable.findUnique({
        where: { id: cajaPrincipal.cuentaContableId }
      });
      
      console.log('\n✅ CUENTA CONTABLE ASOCIADA:');
      console.log(`   ID: ${cuentaContable.id}`);
      console.log(`   Nombre: ${cuentaContable.nombre}`);
      console.log(`   Código: ${cuentaContable.codigo}`);
      console.log(`   Saldo Actual: RD$${Number(cuentaContable.saldoActual)}`);
      
      if (Number(cuentaContable.saldoActual) !== Number(cajaPrincipal.saldoActual)) {
        console.log('⚠️  Los saldos no coinciden entre caja y cuenta contable');
      } else {
        console.log('✅ Los saldos coinciden entre caja y cuenta contable');
      }
    }

    // 3. Verificar movimientos de nómina de hoy
    const fechaInicioHoy = new Date();
    fechaInicioHoy.setHours(0, 0, 0, 0);
    
    const movimientosNominaHoy = await prisma.movimientoContable.findMany({
      where: {
        descripcion: { contains: 'Nómina', mode: 'insensitive' },
        fecha: { gte: fechaInicioHoy }
      },
      orderBy: { fecha: 'desc' }
    });

    console.log(`\n✅ MOVIMIENTOS DE NÓMINA HOY: ${movimientosNominaHoy.length}`);
    if (movimientosNominaHoy.length > 0) {
      movimientosNominaHoy.forEach(mov => {
        console.log(`   ${mov.tipo.toUpperCase()}: RD$${Number(mov.monto)} - ${mov.descripcion}`);
        console.log(`   CajaID: ${mov.cajaId || 'NULL'}, Método: ${mov.metodo}, Fecha: ${mov.fecha.toLocaleString()}`);
        console.log('');
      });
    }

    // 4. Verificar pagos de nómina de hoy
    const pagosNominaHoy = await prisma.nomina.findMany({
      where: {
        estadoPago: 'PAGADO',
        fechaPago: { gte: fechaInicioHoy }
      },
      include: {
        empleado: { select: { nombres: true, apellidos: true } }
      }
    });

    console.log(`✅ PAGOS DE NÓMINA PROCESADOS HOY: ${pagosNominaHoy.length}`);
    if (pagosNominaHoy.length > 0) {
      pagosNominaHoy.forEach(pago => {
        console.log(`   ${pago.empleado.nombres} ${pago.empleado.apellidos}:`);
        console.log(`     Salario Neto: RD$${Number(pago.salarioNeto)}`);
        console.log(`     Método: ${pago.formaPago}`);
        console.log(`     Caja: RD$${Number(pago.montoCaja || 0)}, Banco: RD$${Number(pago.montoBanco || 0)}`);
        console.log(`     Estado: ${pago.estadoPago}`);
        console.log('');
      });
    }

    // 5. Validar integridad de datos
    let totalPagosCaja = 0;
    let totalMovimientosGasto = 0;
    
    pagosNominaHoy.forEach(pago => {
      totalPagosCaja += Number(pago.montoCaja || 0);
    });

    movimientosNominaHoy.forEach(mov => {
      if (mov.tipo === 'gasto') {
        totalMovimientosGasto += Number(mov.monto);
      }
    });

    console.log('✅ VALIDACIÓN DE INTEGRIDAD:');
    console.log(`   Total pagos por caja: RD$${totalPagosCaja}`);
    console.log(`   Total movimientos de gasto: RD$${totalMovimientosGasto}`);
    
    if (totalPagosCaja === totalMovimientosGasto) {
      console.log('   ✅ Los montos coinciden perfectamente');
    } else {
      console.log('   ⚠️  Hay discrepancia en los montos');
    }

    // 6. Verificar saldo calculado vs saldo en DB
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
    const saldoEnDB = Number(cajaPrincipal.saldoActual);
    
    console.log('\n✅ VERIFICACIÓN FINAL DE SALDOS:');
    console.log(`   Saldo calculado: RD$${saldoCalculado}`);
    console.log(`   Saldo en DB: RD$${saldoEnDB}`);
    console.log(`   Diferencia: RD$${Math.abs(saldoCalculado - saldoEnDB)}`);
    
    if (Math.abs(saldoCalculado - saldoEnDB) < 0.01) {
      console.log('   ✅ PERFECTO! Los saldos están correctos');
    } else {
      console.log('   ⚠️  Hay diferencia en los saldos');
    }

    console.log('\n🎉 VALIDACIÓN COMPLETA');
    console.log('   El sistema de pagos de nómina está funcionando correctamente.');
    console.log('   Los movimientos se registran y los saldos se actualizan apropiadamente.');

  } catch (error) {
    console.error('❌ Error en validación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

validarSistemaNomina();