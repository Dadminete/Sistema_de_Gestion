const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('START_DEBUG');

    try {
        const allCount = await prisma.pagoCuentaPorPagar.count();
        console.log('Total Pagos in DB:', allCount);

        if (allCount > 0) {
            const lastPago = await prisma.pagoCuentaPorPagar.findFirst({
                orderBy: { fechaPago: 'desc' }
            });
            console.log('Last Payment:', JSON.stringify(lastPago, null, 2));
        }

        const now = new Date();
        // Force UTC dates for range to cover everything
        const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
        const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

        console.log('Range Start (UTC):', startOfMonth.toISOString());
        console.log('Range End (UTC):', endOfMonth.toISOString());

        const result = await prisma.pagoCuentaPorPagar.aggregate({
            _sum: { monto: true },
            where: {
                fechaPago: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });
        console.log('Aggregate Result:', JSON.stringify(result, null, 2));

    } catch (err) {
        console.error('ERROR:', err);
    }

    console.log('END_DEBUG');
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
