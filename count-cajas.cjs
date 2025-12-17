const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countCajas() {
  try {
    const count = await prisma.caja.count();
    console.log('Total de cajas:', count);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countCajas();