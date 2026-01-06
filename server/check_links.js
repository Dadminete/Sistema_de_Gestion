const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function checkLinks() {
    let output = '--- MOVEMENT LINK DEBUG ---\n';

    const movements = await prisma.movimientoContable.findMany({
        where: {
            descripcion: { contains: 'Extracredito', mode: 'insensitive' }
        }
    });

    output += `Found ${movements.length} movements for 'Extracredito':\n`;
    movements.forEach(m => {
        output += `- ID: ${m.id}, Amount: ${m.monto}, cuentaPorPagarId: ${m.cuentaPorPagarId}, Date: ${m.fecha}\n`;
    });

    // Verify the count in PagoCuentaPorPagar again
    const totalPagos = await prisma.pagoCuentaPorPagar.count();
    output += `\nTotal PagoCuentaPorPagar count in DB: ${totalPagos}\n`;

    fs.writeFileSync('link_debug_results.txt', output);
}

checkLinks()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
