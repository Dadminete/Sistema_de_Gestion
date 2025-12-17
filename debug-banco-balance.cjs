const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugBancoBalance() {
  try {
    console.log('🏦 DEBUG: BALANCE DEL BANCO');
    console.log('='.repeat(50));

    // 1. Verificar cuentas bancarias activas
    const cuentasBancarias = await prisma.cuentaBancaria.findMany({
      where: { activo: true },
      include: {
        bank: { select: { nombre: true } },
        cuentaContable: { select: { nombre: true, saldoInicial: true, saldoActual: true } }
      }
    });

    console.log(`\n📊 CUENTAS BANCARIAS ACTIVAS: ${cuentasBancarias.length}`);
    cuentasBancarias.forEach(cuenta => {
      console.log(`   ${cuenta.bank.nombre} - ${cuenta.numeroCuenta}`);
      console.log(`   Saldo Inicial: RD$ ${cuenta.cuentaContable.saldoInicial}`);
      console.log(`   Saldo Actual: RD$ ${cuenta.cuentaContable.saldoActual}`);
      console.log(`   ---`);
    });

    // 2. Verificar movimientos contables bancarios
    console.log(`\n💰 MOVIMIENTOS CONTABLES BANCARIOS:`);

    const ingresosMovimientosBanco = await prisma.movimientoContable.aggregate({
      _sum: { monto: true },
      _count: true,
      where: { 
        cuentaBancariaId: { not: null }, 
        tipo: 'ingreso' 
      }
    });

    const gastosMovimientosBanco = await prisma.movimientoContable.aggregate({
      _sum: { monto: true },
      _count: true,
      where: { 
        cuentaBancariaId: { not: null }, 
        tipo: 'gasto' 
      }
    });

    console.log(`   Ingresos: ${ingresosMovimientosBanco._count} movimientos, RD$ ${ingresosMovimientosBanco._sum.monto || 0}`);
    console.log(`   Gastos: ${gastosMovimientosBanco._count} movimientos, RD$ ${gastosMovimientosBanco._sum.monto || 0}`);

    // 3. Verificar pagos de clientes por banco
    const pagosClientesBanco = await prisma.pagoCliente.aggregate({
      _sum: { monto: true },
      _count: true,
      where: { 
        cuentaBancariaId: { not: null }, 
        estado: 'confirmado' 
      }
    });

    console.log(`   Pagos clientes: ${pagosClientesBanco._count} pagos, RD$ ${pagosClientesBanco._sum.monto || 0}`);

    // 4. Calcular balance total
    const totalIngresos = Number(ingresosMovimientosBanco._sum.monto || 0);
    const totalGastos = Number(gastosMovimientosBanco._sum.monto || 0);
    const totalPagos = Number(pagosClientesBanco._sum.monto || 0);

    const balanceCalculado = (totalIngresos + totalPagos) - totalGastos;

    console.log(`\n📈 BALANCE CALCULADO:`);
    console.log(`   Ingresos movimientos: RD$ ${totalIngresos}`);
    console.log(`   Pagos clientes: RD$ ${totalPagos}`);
    console.log(`   Total ingresos: RD$ ${totalIngresos + totalPagos}`);
    console.log(`   Gastos: RD$ ${totalGastos}`);
    console.log(`   BALANCE FINAL: RD$ ${balanceCalculado}`);

    // 5. Verificar algunos movimientos de ejemplo
    console.log(`\n🔍 ÚLTIMOS 10 MOVIMIENTOS BANCARIOS:`);
    const ultimosMovimientos = await prisma.movimientoContable.findMany({
      where: { cuentaBancariaId: { not: null } },
      include: {
        cuentaBancaria: { 
          select: { 
            numeroCuenta: true,
            bank: { select: { nombre: true } }
          }
        }
      },
      orderBy: { fecha: 'desc' },
      take: 10
    });

    ultimosMovimientos.forEach(mov => {
      console.log(`   ${mov.fecha.toISOString().split('T')[0]} | ${mov.tipo.toUpperCase()} | RD$ ${mov.monto} | ${mov.descripcion || 'Sin descripción'}`);
      console.log(`     Banco: ${mov.cuentaBancaria.bank.nombre} - ${mov.cuentaBancaria.numeroCuenta}`);
    });

    // 6. Comparar con el balance reportado en cuentas contables
    console.log(`\n💳 SALDOS EN CUENTAS CONTABLES:`);
    const totalSaldosContables = cuentasBancarias.reduce((total, cuenta) => {
      return total + Number(cuenta.cuentaContable.saldoActual);
    }, 0);

    console.log(`   Total saldos en cuentas contables: RD$ ${totalSaldosContables}`);
    console.log(`   Diferencia con balance calculado: RD$ ${balanceCalculado - totalSaldosContables}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBancoBalance();