const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log('Eliminando movimientos contables backfillados...');

    const result = await prisma.movimientoContable.deleteMany({
        where: {
            descripcion: {
                contains: '(Backfill)'
            }
        }
    });

    console.log(`Eliminados ${result.count} movimientos backfillados.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
