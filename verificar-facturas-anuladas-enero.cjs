const prisma = require('./server/prismaClient');

async function verificar() {
    try {
        console.log('=== VERIFICANDO FACTURAS ANULADAS ENERO 2026 ===\n');

        // Facturas anuladas emitidas en enero 2026
        const anuladasEmitidas = await prisma.facturaCliente.count({
            where: {
                fechaFactura: {
                    gte: new Date(2026, 0, 1),
                    lt: new Date(2026, 1, 1)
                },
                estado: 'anulada'
            }
        });
        console.log(`Facturas anuladas EMITIDAS en enero 2026: ${anuladasEmitidas}`);

        // Facturas anuladas que recibieron pagos en enero
        const anuladasConPagos = await prisma.facturaCliente.count({
            where: {
                estado: 'anulada',
                pagos: {
                    some: {
                        fechaPago: {
                            gte: new Date(2026, 0, 1),
                            lt: new Date(2026, 1, 1)
                        },
                        estado: 'confirmado'
                    }
                }
            }
        });
        console.log(`Facturas anuladas que RECIBIERON PAGOS en enero 2026: ${anuladasConPagos}`);

        // Total de facturas anuladas en el sistema
        const totalAnuladas = await prisma.facturaCliente.count({
            where: { estado: 'anulada' }
        });
        console.log(`\nTotal de facturas anuladas en el sistema: ${totalAnuladas}`);

        // Mostrar algunas facturas anuladas
        const detalleAnuladas = await prisma.facturaCliente.findMany({
            where: { estado: 'anulada' },
            select: {
                numeroFactura: true,
                fechaFactura: true,
                total: true,
                estado: true
            },
            take: 5,
            orderBy: { fechaFactura: 'desc' }
        });

        if (detalleAnuladas.length > 0) {
            console.log('\nÚltimas 5 facturas anuladas:');
            detalleAnuladas.forEach(f => {
                console.log(`  - ${f.numeroFactura}: RD$ ${parseFloat(f.total).toFixed(2)} (${f.fechaFactura.toISOString().split('T')[0]})`);
            });
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verificar();
