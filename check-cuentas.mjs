import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCuentasContables() {
  try {
    console.log('🔍 Checking cuentas contables...\n');
    
    // Check for cuenta contable with code '003' (papeleria)
    const papeleriaCuenta = await prisma.cuentaContable.findFirst({
      where: { codigo: '003', activa: true }
    });
    
    if (papeleriaCuenta) {
      console.log(`✅ Papeleria cuenta contable found:`);
      console.log(`   Code: ${papeleriaCuenta.codigo}`);
      console.log(`   Name: ${papeleriaCuenta.nombre}`);
      console.log(`   Current balance: ${papeleriaCuenta.saldoActual}`);
      console.log(`   Initial balance: ${papeleriaCuenta.saldoInicial}`);
    } else {
      console.log('❌ No active papeleria cuenta contable (code 003) found!');
    }
    
    // Check all active cuentas contables
    const allCuentas = await prisma.cuentaContable.findMany({
      where: { activa: true },
      orderBy: { codigo: 'asc' }
    });
    
    console.log(`\n📁 Found ${allCuentas.length} active cuentas contables:`);
    allCuentas.forEach((cuenta, index) => {
      console.log(`  ${index + 1}. ${cuenta.codigo} - ${cuenta.nombre}`);
      console.log(`     Balance: ${cuenta.saldoActual}`);
    });
    
    // Check if there's a relationship between caja and cuenta contable
    console.log('\n🔗 Checking caja-cuenta relationships...');
    const papeleriaCaja = await prisma.caja.findFirst({
      where: { tipo: 'papeleria', activa: true },
      include: { cuentaContable: true }
    });
    
    if (papeleriaCaja) {
      console.log(`\n📄 Papeleria caja details:`);
      console.log(`   Name: ${papeleriaCaja.nombre}`);
      console.log(`   Balance: ${papeleriaCaja.saldoActual}`);
      
      if (papeleriaCaja.cuentaContable) {
        console.log(`   Linked cuenta contable: ${papeleriaCaja.cuentaContable.codigo} - ${papeleriaCaja.cuentaContable.nombre}`);
        console.log(`   Linked cuenta balance: ${papeleriaCaja.cuentaContable.saldoActual}`);
      } else {
        console.log(`   ⚠️  No linked cuenta contable`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking cuentas contables:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCuentasContables();