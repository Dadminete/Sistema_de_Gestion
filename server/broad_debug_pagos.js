const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function broadDebug() {
    let output = '--- BROAD PAYMENT DEBUG ---\n';

    // 1. All PagoCuentaPorPagar records
    const allPagos = await prisma.pagoCuentaPorPagar.findMany({
        include: {
            cuentaPorPagar: true
        },
        take: 50,
        orderBy: { createdAt: 'desc' }
    });

    output += `Total PagoCuentaPorPagar records: ${allPagos.length}\n`;
    allPagos.forEach(p => {
        output += `- ID: ${p.id}, Amount: ${p.monto}, Date: ${p.fechaPago}, Doc: ${p.cuentaPorPagar?.numeroDocumento}, Created: ${p.createdAt}\n`;
    });

    // 2. All MovimientoContable since Jan 1st 2026
    const movements = await prisma.movimientoContable.findMany({
        where: {
            fecha: {
                gte: new Date('2026-01-01')
            }
        },
        include: {
            usuario: true,
            categoria: true
        },
        orderBy: { fecha: 'desc' }
    });

    output += `\nTotal MovimientoContable since 2026-01-01: ${movements.length}\n`;
    movements.forEach(m => {
        output += `- ID: ${m.id}, Amount: ${m.monto}, Type: ${m.tipo}, Desc: ${m.descripcion}, Date: ${m.fecha}, Cat: ${m.categoria?.nombre}\n`;
    });

    // 3. Search for "Banco Popular" in anything
    const popularMentions = await prisma.movimientoContable.findMany({
        where: {
            descripcion: { contains: 'Popular', mode: 'insensitive' }
        }
    });
    output += `\nMovements mentioning 'Popular': ${popularMentions.length}\n`;
    popularMentions.forEach(m => {
        output += `- Desc: ${m.descripcion}, Amount: ${m.monto}, Date: ${m.fecha}\n`;
    });

    fs.writeFileSync('broad_debug_results.txt', output);
}

broadDebug()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
