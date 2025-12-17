const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCajas() {
    try {
        const cajas = await prisma.caja.findMany();
        console.log('Listado de Cajas:', JSON.stringify(cajas, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCajas();
