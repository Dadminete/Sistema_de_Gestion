const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const accountId = '07acf97a-80d3-4270-bd20-f587bfc7d6d5'; // ID for account 840819940
    const pagos = await prisma.pagoCuentaPorPagar.findMany({
        where: { cuentaPorPagarId: accountId },
        include: { creadoPor: true }
    });

    console.log(`Found ${pagos.length} payments for account 840819940:`);
    pagos.forEach(p => {
        console.log(`- Amount: ${p.monto}, Date: ${p.fechaPago}, Created by: ${p.creadoPor?.nombre} ${p.creadoPor?.apellido}`);
    });

    const movements = await prisma.movimientoContable.findMany({
        where: { cuentaPorPagarId: accountId }
    });
    console.log(`\nFound ${movements.length} linked movements:`);
    movements.forEach(m => {
        console.log(`- ID: ${m.id}, Concept: ${m.concepto}, Debit: ${m.debito}, Credit: ${m.credito}`);
    });

    await prisma.$disconnect();
}

check().catch(e => {
    console.error(e);
    process.exit(1);
});
