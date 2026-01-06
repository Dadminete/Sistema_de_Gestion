const prisma = require('./server/prismaClient');

async function verificarPagos() {
    try {
        console.log('=== VERIFICANDO PAGOS ENERO 2026 ===\n');

        // Pagos por fecha de pago
        const pagosPorFechaPago = await prisma.pagoCliente.aggregate({
            where: {
                fechaPago: {
                    gte: new Date(2026, 0, 1),
                    lt: new Date(2026, 1, 1)
                },
                estado: 'confirmado'
            },
            _sum: { monto: true },
            _count: true
        });

        console.log('Pagos filtrados por fechaPago (enero 2026):');
        console.log(`  - Cantidad: ${pagosPorFechaPago._count}`);
        console.log(`  - Total: RD$ ${(pagosPorFechaPago._sum.monto || 0).toFixed(2)}\n`);

        // Pagos por fecha de factura
        const pagosPorFechaFactura = await prisma.pagoCliente.aggregate({
            where: {
                factura: {
                    fechaFactura: {
                        gte: new Date(2026, 0, 1),
                        lt: new Date(2026, 1, 1)
                    }
                },
                estado: 'confirmado'
            },
            _sum: { monto: true },
            _count: true
        });

        console.log('Pagos filtrados por fechaFactura (enero 2026):');
        console.log(`  - Cantidad: ${pagosPorFechaFactura._count}`);
        console.log(`  - Total: RD$ ${(pagosPorFechaFactura._sum.monto || 0).toFixed(2)}\n`);

        // Listar algunos pagos de enero 2026
        const pagosDetalle = await prisma.pagoCliente.findMany({
            where: {
                fechaPago: {
                    gte: new Date(2026, 0, 1),
                    lt: new Date(2026, 1, 1)
                },
                estado: 'confirmado'
            },
            include: {
                factura: {
                    select: {
                        numeroFactura: true,
                        fechaFactura: true
                    }
                }
            },
            take: 5,
            orderBy: {
                fechaPago: 'desc'
            }
        });

        console.log('Primeros 5 pagos de enero 2026:');
        pagosDetalle.forEach(pago => {
            console.log(`  - Pago ${pago.numeroPago}: RD$ ${pago.monto.toFixed(2)}`);
            console.log(`    Fecha Pago: ${pago.fechaPago.toISOString().split('T')[0]}`);
            console.log(`    Factura: ${pago.factura?.numeroFactura || 'N/A'}`);
            console.log(`    Fecha Factura: ${pago.factura?.fechaFactura ? pago.factura.fechaFactura.toISOString().split('T')[0] : 'N/A'}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verificarPagos();
