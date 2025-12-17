require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBalanceBanco() {
  try {
    console.log('🏦 TEST: BALANCE DEL BANCO (MÉTODO CORREGIDO)');
    console.log('='.repeat(50));

    // Método corregido: sumar saldos de cuentas contables de bancos
    const cuentasBancarias = await prisma.cuentaBancaria.findMany({
      where: { activo: true },
      include: {
        bank: { select: { nombre: true } },
        cuentaContable: {
          select: { saldoActual: true, nombre: true }
        }
      }
    });

    console.log(`\n📊 CUENTAS BANCARIAS ACTIVAS (${cuentasBancarias.length}):`);
    let totalBalanceBanco = 0;

    cuentasBancarias.forEach((cuenta, index) => {
      const saldo = Number(cuenta.cuentaContable?.saldoActual || 0);
      totalBalanceBanco += saldo;
      
      console.log(`\n${index + 1}. ${cuenta.bank.nombre} - ${cuenta.numeroCuenta}`);
      console.log(`   Cuenta Contable: ${cuenta.cuentaContable?.nombre || 'N/A'}`);
      console.log(`   Saldo: RD$ ${saldo.toLocaleString()}`);
    });

    console.log(`\n🎯 BALANCE TOTAL DEL BANCO (MÉTODO CORRECTO):`);
    console.log(`   RD$ ${totalBalanceBanco.toLocaleString()}`);
    
    // Comparar con el método anterior (incorrecto)
    console.log(`\n🔄 COMPARACIÓN CON MÉTODO ANTERIOR (SUMAS HISTÓRICAS):`);
    
    const ingresosMovimientosBanco = await prisma.movimientoContable.aggregate({
      _sum: { monto: true },
      where: { 
        cuentaBancariaId: { not: null }, 
        tipo: 'ingreso' 
      }
    });

    const gastosMovimientosBanco = await prisma.movimientoContable.aggregate({
      _sum: { monto: true },
      where: { 
        cuentaBancariaId: { not: null }, 
        tipo: 'gasto' 
      }
    });

    const pagosClientesBanco = await prisma.pagoCliente.aggregate({
      _sum: { monto: true },
      where: { 
        cuentaBancariaId: { not: null }, 
        estado: 'confirmado' 
      }
    });

    const totalIngresos = Number(ingresosMovimientosBanco._sum.monto || 0);
    const totalGastos = Number(gastosMovimientosBanco._sum.monto || 0);
    const totalPagos = Number(pagosClientesBanco._sum.monto || 0);

    const balanceMetodoAnterior = (totalIngresos + totalPagos) - totalGastos;

    console.log(`   Ingresos movimientos: RD$ ${totalIngresos.toLocaleString()}`);
    console.log(`   Pagos clientes: RD$ ${totalPagos.toLocaleString()}`);
    console.log(`   Gastos: RD$ ${totalGastos.toLocaleString()}`);
    console.log(`   Balance (método anterior): RD$ ${balanceMetodoAnterior.toLocaleString()}`);
    
    console.log(`\n📈 DIFERENCIA:`);
    const diferencia = balanceMetodoAnterior - totalBalanceBanco;
    console.log(`   RD$ ${diferencia.toLocaleString()}`);
    console.log(`   ${diferencia > 0 ? '⬆️ El método anterior está inflado por' : '⬇️ El método anterior está reducido por'} RD$ ${Math.abs(diferencia).toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBalanceBanco();