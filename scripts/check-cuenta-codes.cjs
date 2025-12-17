const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCuentaCodes() {
  try {
    const cuentas = await prisma.cuentaContable.findMany({
      where: { activa: true }
    });
    
    console.log('Cuentas contables:');
    cuentas.forEach(cuenta => {
      console.log(`${cuenta.codigo} - ${cuenta.nombre}: ${cuenta.saldoActual}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCuentaCodes();