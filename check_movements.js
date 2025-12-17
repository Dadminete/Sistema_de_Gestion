import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkRecentMovements() {
    try {
        const movements = await prisma.movimientoContable.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc', // or 'fecha' depending on your schema, checking 'createdAt' usually safe for insertion order
            },
            include: {
                categoria: true
            }
        });
        console.log('Last 5 Movements:', JSON.stringify(movements, null, 2));

        const caja = await prisma.caja.findFirst({
            where: { nombre: { contains: 'Principal', mode: 'insensitive' } }
        });
        console.log('Caja Principal Balance:', caja?.saldoActual);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentMovements();
