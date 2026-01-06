const prisma = require('./server/prismaClient');

async function verificar() {
    try {
        console.log('=== ANÁLISIS FACTURAS Y PAGOS ENERO 2026 ===\n');

        // Facturas emitidas en enero 2026
        const facturasEnero = await prisma.facturaCliente.count({
            where: {
                fechaFactura: {
                    gte: new Date(2026, 0, 1),
                    lt: new Date(2026, 1, 1)
                }
            }
        });
        console.log(`Facturas EMITIDAS en enero 2026: ${facturasEnero}`);

        // Facturas con estado "pagada" emitidas en enero
        const facturasPagadasEnero = await prisma.facturaCliente.count({
            where: {
                fechaFactura: {
                    gte: new Date(2026, 0, 1),
                    lt: new Date(2026, 1, 1)
                },
                estado: 'pagada'
            }
        });
        console.log(`Facturas con estado "pagada" emitidas en enero 2026: ${facturasPagadasEnero}\n`);

        // Facturas que recibieron pagos en enero (sin importar fecha emisión)
        const facturasConPagosEnero = await prisma.facturaCliente.findMany({
            where: {
                pagos: {
                    some: {
                        fechaPago: {
                            gte: new Date(2026, 0, 1),
                            lt: new Date(2026, 1, 1)
                        },
                        estado: 'confirmado'
                    }
                }
            },
            include: {
                pagos: {
                    where: {
                        fechaPago: {
                            gte: new Date(2026, 0, 1),
                            lt: new Date(2026, 1, 1)
                        },
                        estado: 'confirmado'
                    }
                }
            }
        });

        console.log(`Facturas que RECIBIERON PAGOS en enero 2026: ${facturasConPagosEnero.length}`);
        console.log('\nDetalle:');
        facturasConPagosEnero.forEach(f => {
            const totalPagado = f.pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);
            console.log(`  - ${f.numeroFactura} (${f.estado}): ${f.pagos.length} pago(s) = RD$ ${totalPagado.toFixed(2)}`);
        });

        // Contar facturas por estado que recibieron pagos en enero
        const estados = {};
        facturasConPagosEnero.forEach(f => {
            estados[f.estado] = (estados[f.estado] || 0) + 1;
        });
        
        console.log('\nFacturas por estado (que recibieron pagos en enero):');
        Object.entries(estados).forEach(([estado, count]) => {
            console.log(`  - ${estado}: ${count}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verificar();
