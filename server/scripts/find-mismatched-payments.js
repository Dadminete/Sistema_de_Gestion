const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findMismatchedPayments() {
    try {
        console.log('=== BUSCANDO PAGOS CON MÉTODO INCORRECTO ===\n');

        // Obtener pagos que dicen ser "caja" pero tienen movimientos con método "banco"
        const pagos = await prisma.pagoCliente.findMany({
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
            }
        });

        console.log(`Pagos con método CAJA/EFECTIVO: ${pagos.length}\n`);

        for (const pago of pagos) {
            if (!pago.factura) continue;

            // Buscar movimiento contable asociado
            const movimiento = await prisma.movimientoContable.findFirst({
                where: {
                    descripcion: {
                        contains: pago.factura.numeroFactura
                    },
                    monto: Number(pago.monto),
                    tipo: 'ingreso'
                }
            });

            if (movimiento) {
                if (movimiento.metodo !== 'caja') {
                    console.log(`❌ MISMATCH ENCONTRADO:`);
                    console.log(`   Pago: ${pago.numeroPago} - Método: ${pago.metodoPago}`);
                    console.log(`   Movimiento: Método: ${movimiento.metodo}`);
                    console.log(`   Monto: RD$${Number(pago.monto)}`);
                    console.log(`   Movimiento ID: ${movimiento.id}`);
                    console.log('');
                }
            } else {
                console.log(`⚠ Pago ${pago.numeroPago} NO tiene movimiento contable`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findMismatchedPayments();
