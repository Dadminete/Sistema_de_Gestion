const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigatePayments() {
    try {
        console.log('=== PAGOS DE CLIENTES ===\n');

        const pagos = await prisma.pagoCliente.findMany({
            select: {
                numeroPago: true,
                monto: true,
                metodoPago: true,
                cajaId: true,
                fechaPago: true
            },
            orderBy: {
                fechaPago: 'desc'
            }
        });

        console.log(`Total pagos: ${pagos.length}`);
        let total = 0;
        pagos.forEach(p => {
            console.log(`${p.numeroPago}: RD$${Number(p.monto)} - ${p.metodoPago} - CajaID: ${p.cajaId || 'NULL'}`);
            total += Number(p.monto);
        });
        console.log(`\nTOTAL PAGOS: RD$${total}\n`);

        console.log('=== MOVIMIENTOS CONTABLES (CAJA) ===\n');

        const movimientos = await prisma.movimientoContable.findMany({
            where: {
                tipo: 'ingreso',
                metodo: 'caja'
            },
            select: {
                descripcion: true,
                monto: true,
                cajaId: true,
                fecha: true
            },
            orderBy: {
                fecha: 'desc'
            }
        });

        console.log(`Total movimientos: ${movimientos.length}`);
        let totalMov = 0;
        movimientos.forEach(m => {
            console.log(`${m.descripcion}: RD$${Number(m.monto)} - CajaID: ${m.cajaId || 'NULL'}`);
            totalMov += Number(m.monto);
        });
        console.log(`\nTOTAL MOVIMIENTOS: RD$${totalMov}\n`);

        console.log(`DIFERENCIA: RD$${total - totalMov}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

investigatePayments();
