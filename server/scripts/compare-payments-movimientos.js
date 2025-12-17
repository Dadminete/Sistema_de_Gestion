const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function comparePaymentsAndMovimientos() {
    try {
        console.log('=== COMPARACIÓN DETALLADA ===\n');

        // 1. Pagos de caja
        const pagosCaja = await prisma.pagoCliente.findMany({
            where: {
                metodoPago: {
                    in: ['caja', 'efectivo', 'Caja', 'Efectivo']
                }
            },
            include: {
                factura: {
                    select: {
                        numeroFactura: true
                    }
                }
            },
            orderBy: {
                fechaPago: 'asc'
            }
        });

        console.log(`PAGOS CON MÉTODO CAJA/EFECTIVO: ${pagosCaja.length}`);
        let totalPagosCaja = 0;
        pagosCaja.forEach(p => {
            if (p.factura) {
                console.log(`  ${p.numeroPago}: RD$${Number(p.monto)} - Factura: ${p.factura.numeroFactura}`);
                totalPagosCaja += Number(p.monto);
            }
        });
        console.log(`TOTAL PAGOS CAJA: RD$${totalPagosCaja}\n`);

        // 2. Movimientos de caja
        const movimientosCaja = await prisma.movimientoContable.findMany({
            where: {
                metodo: 'caja',
                tipo: 'ingreso'
            },
            orderBy: {
                fecha: 'asc'
            }
        });

        console.log(`MOVIMIENTOS CON MÉTODO CAJA (INGRESOS): ${movimientosCaja.length}`);
        let totalMovimientosCaja = 0;
        movimientosCaja.forEach(m => {
            console.log(`  ${m.descripcion}: RD$${Number(m.monto)} - CajaID: ${m.cajaId || 'NULL'}`);
            totalMovimientosCaja += Number(m.monto);
        });
        console.log(`TOTAL MOVIMIENTOS CAJA: RD$${totalMovimientosCaja}\n`);

        console.log(`DIFERENCIA: RD$${totalPagosCaja - totalMovimientosCaja}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

comparePaymentsAndMovimientos();
