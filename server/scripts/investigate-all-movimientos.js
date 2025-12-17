const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateAllMovimientos() {
    try {
        console.log('=== TODOS LOS MOVIMIENTOS DE INGRESO ===\n');

        const movimientos = await prisma.movimientoContable.findMany({
            where: {
                tipo: 'ingreso'
            },
            select: {
                descripcion: true,
                monto: true,
                metodo: true,
                cajaId: true,
                fecha: true
            },
            orderBy: {
                fecha: 'desc'
            }
        });

        console.log(`Total movimientos de ingreso: ${movimientos.length}\n`);

        let totalCaja = 0;
        let totalBanco = 0;
        let totalOtros = 0;

        movimientos.forEach(m => {
            const monto = Number(m.monto);
            console.log(`${m.descripcion}: RD$${monto} - Método: ${m.metodo} - CajaID: ${m.cajaId || 'NULL'}`);

            if (m.metodo === 'caja') {
                totalCaja += monto;
            } else if (m.metodo === 'banco') {
                totalBanco += monto;
            } else {
                totalOtros += monto;
            }
        });

        console.log(`\n=== TOTALES POR MÉTODO ===`);
        console.log(`Total CAJA: RD$${totalCaja}`);
        console.log(`Total BANCO: RD$${totalBanco}`);
        console.log(`Total OTROS: RD$${totalOtros}`);
        console.log(`TOTAL GENERAL: RD$${totalCaja + totalBanco + totalOtros}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

investigateAllMovimientos();
