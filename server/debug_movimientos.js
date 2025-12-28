const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('START_DEBUG_MOVIMIENTOS');

    try {
        const movimientos = await prisma.movimientoContable.findMany({
            take: 5,
            orderBy: { fecha: 'desc' },
            where: { tipo: 'gasto' }
        });
        console.log('Recent Expenses (Movimientos):', JSON.stringify(movimientos, null, 2));

    } catch (err) {
        console.error('ERROR:', err);
    }

    console.log('END_DEBUG_MOVIMIENTOS');
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
