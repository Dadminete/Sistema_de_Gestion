const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCajas() {
  try {
    const cajas = await prisma.caja.findMany();
    console.log('Todas las cajas:');
    cajas.forEach(caja => {
      console.log(`${caja.nombre} (${caja.tipo}) - Activa: ${caja.activa} - Saldo: ${caja.saldoActual}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCajas();