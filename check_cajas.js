const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCajas() {
    const cajas = await prisma.caja.findMany();
    console.log('Listado de Cajas:', cajas);
}

checkCajas()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
