import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        // Use findFirst safely
        const caja = await prisma.caja.findFirst({
            where: { nombre: { contains: 'Principal', mode: 'insensitive' } }
        });

        const movs = await prisma.movimientoContable.findMany({
            where: {
                monto: 9000
            },
            include: { categoria: true },
            orderBy: { createdAt: 'desc' }
        });

        console.log('Result:', JSON.stringify({ caja, movs }, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
