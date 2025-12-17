import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPapeleriaCaja() {
  try {
    console.log('🔍 Testing papeleria caja...');
    
    // Check if papeleria caja exists
    const papeleriaCaja = await prisma.caja.findFirst({
      where: { tipo: 'papeleria', activa: true }
    });
    
    if (papeleriaCaja) {
      console.log(`✅ Papeleria caja found: ${papeleriaCaja.nombre}`);
      console.log(`   Current balance: ${papeleriaCaja.saldoActual}`);
    } else {
      console.log('❌ Papeleria caja not found');
    }
    
    // Test the balance calculation function
    console.log('\n🔍 Testing balance calculation...');
    const balance = await prisma.caja.findFirst({
      where: { tipo: 'papeleria', activa: true }
    });
    
    const calculatedBalance = balance ? parseFloat(balance.saldoActual) : 0;
    console.log(`   Calculated balance: ${calculatedBalance}`);
    
  } catch (error) {
    console.error('❌ Error testing papeleria caja:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPapeleriaCaja();