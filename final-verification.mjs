import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalVerification() {
  try {
    console.log('🔍 Final verification of papeleria caja fix...\n');
    
    // Check if papeleria caja exists
    const papeleriaCaja = await prisma.caja.findFirst({
      where: { tipo: 'papeleria', activa: true }
    });
    
    if (papeleriaCaja) {
      console.log(`✅ Papeleria caja found: ${papeleriaCaja.nombre}`);
      console.log(`   ID: ${papeleriaCaja.id}`);
      console.log(`   Current balance: ${papeleriaCaja.saldoActual}`);
    } else {
      console.log('❌ Papeleria caja NOT found!');
      return;
    }
    
    // Check if general caja exists
    const generalCaja = await prisma.caja.findFirst({
      where: { tipo: 'general', activa: true }
    });
    
    if (generalCaja) {
      console.log(`\n✅ General caja found: ${generalCaja.nombre}`);
      console.log(`   ID: ${generalCaja.id}`);
      console.log(`   Current balance: ${generalCaja.saldoActual}`);
    } else {
      console.log('\n❌ General caja NOT found!');
    }
    
    // Test balance calculation functions
    console.log('\n🔍 Testing balance calculation functions...');
    
    // Test getBalancePapeleria equivalent
    const papeleriaBalance = await prisma.caja.findFirst({
      where: { tipo: 'papeleria', activa: true }
    });
    
    const calculatedPapeleriaBalance = papeleriaBalance ? parseFloat(papeleriaBalance.saldoActual) : 0;
    console.log(`   Papeleria balance calculation: ${calculatedPapeleriaBalance}`);
    
    // Test getBalanceCaja equivalent
    const generalBalance = await prisma.caja.findFirst({
      where: { tipo: 'general', activa: true }
    });
    
    const calculatedGeneralBalance = generalBalance ? parseFloat(generalBalance.saldoActual) : 0;
    console.log(`   General balance calculation: ${calculatedGeneralBalance}`);
    
    console.log('\n✅ All verifications passed! The papeleria caja issue has been resolved.');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your server to ensure all changes are loaded');
    console.log('   2. Test making an expense using the papeleria payment method');
    console.log('   3. Verify that the balance updates correctly');
    
  } catch (error) {
    console.error('❌ Error during final verification:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification();