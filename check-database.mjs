import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    
    // Check if there are any cajas
    const cajas = await prisma.caja.findMany();
    console.log(`Found ${cajas.length} cajas:`);
    cajas.forEach(caja => {
      console.log(`  - ${caja.nombre} (tipo: ${caja.tipo}, saldo: ${caja.saldoActual})`);
    });
    
    // Check specifically for papeleria caja
    const papeleriaCaja = await prisma.caja.findFirst({
      where: { tipo: 'papeleria', activa: true }
    });
    
    if (papeleriaCaja) {
      console.log(`\nPapeleria caja found: ${papeleriaCaja.nombre} with balance ${papeleriaCaja.saldoActual}`);
    } else {
      console.log('\nNo active papeleria caja found');
    }
    
    // Check cuentas contables
    const cuentas = await prisma.cuentaContable.findMany({
      where: { activa: true }
    });
    console.log(`\nFound ${cuentas.length} active cuentas contables`);
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();