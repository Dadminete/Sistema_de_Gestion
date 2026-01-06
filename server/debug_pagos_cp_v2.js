const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugPayments() {
    const docNum = '840819940';
    console.log(`Searching for account: ${docNum}...`);

    const cuenta = await prisma.cuentaPorPagar.findUnique({
        where: { numeroDocumento: docNum },
        include: {
            proveedor: true,
            pagos: {
                include: {
                    creadoPor: true
                }
            }
        }
    });

    if (!cuenta) {
        console.log('Account not found!');
        return;
    }

    console.log('Account Info:', JSON.stringify({
        id: cuenta.id,
        montoOriginal: cuenta.montoOriginal,
        montoPendiente: cuenta.montoPendiente,
        estado: cuenta.estado
    }, null, 2));

    console.log(`Found ${cuenta.pagos.length} payments.`);
    cuenta.pagos.forEach((pago, idx) => {
        console.log(`Payment ${idx + 1}:`, JSON.stringify({
            id: pago.id,
            monto: pago.monto,
            fechaPago: pago.fechaPago,
            metodo: pago.metodoPago,
            creadoPor: pago.creadoPor ? `${pago.creadoPor.nombre} ${pago.creadoPor.apellido}` : 'Unknown'
        }, null, 2));
    });

    // Also search for payments that might be orphaned or linked differently
    const allPagos = await prisma.pagoCuentaPorPagar.findMany({
        where: {
            fechaPago: {
                gte: new Date('2026-01-01')
            }
        },
        include: {
            cuentaPorPagar: true
        }
    });

    console.log(`\nFound ${allPagos.length} total payments since 2026-01-01:`);
    allPagos.forEach(p => {
        console.log(`- ID: ${p.id}, Monto: ${p.monto}, Account Doc: ${p.cuentaPorPagar?.numeroDocumento}, Date: ${p.fechaPago}`);
    });
}

debugPayments()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
