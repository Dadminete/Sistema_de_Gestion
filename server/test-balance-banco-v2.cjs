require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBalanceBancoCorregido() {
  try {
    console.log('🏦 TEST: BALANCE DEL BANCO (MÉTODO CORREGIDO v2)');
    console.log('='.repeat(50));

    // Método corregido v2: obtener cuentas contables únicas de bancos
    const cuentasBancarias = await prisma.cuentaBancaria.findMany({
      where: { activo: true },
      select: { cuentaContableId: true }
    });

    console.log(`📊 CUENTAS BANCARIAS ACTIVAS: ${cuentasBancarias.length}`);

    // Get unique cuenta contable IDs 
    const uniqueCuentaContableIds = [...new Set(cuentasBancarias.map(c => c.cuentaContableId))];
    console.log(`📊 CUENTAS CONTABLES ÚNICAS: ${uniqueCuentaContableIds.length}`);

    // Sum saldos from unique cuentas contables only
    const cuentasContables = await prisma.cuentaContable.findMany({
      where: { 
        id: { in: uniqueCuentaContableIds },
        activa: true 
      },
      select: { id: true, nombre: true, saldoActual: true }
    });

    console.log(`\n💳 CUENTAS CONTABLES DE BANCOS:`);
    let totalBalanceBanco = 0;

    cuentasContables.forEach((cuenta, index) => {
      const saldo = Number(cuenta.saldoActual || 0);
      totalBalanceBanco += saldo;
      
      console.log(`${index + 1}. ${cuenta.nombre}: RD$ ${saldo.toLocaleString()}`);
    });

    console.log(`\n🎯 BALANCE TOTAL DEL BANCO (MÉTODO CORREGIDO):`);
    console.log(`   RD$ ${totalBalanceBanco.toLocaleString()}`);
    
    // Verificar que coincide con el valor esperado
    const valorEsperado = 206000; // El usuario menciona que debería andar por los 206,000
    const diferencia = Math.abs(totalBalanceBanco - valorEsperado);
    const porcentajeDiferencia = (diferencia / valorEsperado) * 100;

    console.log(`\n📊 COMPARACIÓN CON VALOR ESPERADO:`);
    console.log(`   Esperado: ~RD$ ${valorEsperado.toLocaleString()}`);
    console.log(`   Calculado: RD$ ${totalBalanceBanco.toLocaleString()}`);
    console.log(`   Diferencia: RD$ ${diferencia.toLocaleString()} (${porcentajeDiferencia.toFixed(2)}%)`);
    
    if (porcentajeDiferencia < 5) {
      console.log(`   ✅ ¡EXCELENTE! La diferencia está dentro del rango aceptable`);
    } else {
      console.log(`   ⚠️  Diferencia significativa detectada`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBalanceBancoCorregido();