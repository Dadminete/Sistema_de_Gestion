const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugPayments() {
    const docNum = '840819940';
    console.log(`--- DEBUGGING ACCOUNT: ${docNum} ---`);

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
        console.log('ERROR: Account not found by document number.');
        return;
    }

    console.log('ACCOUNT DETAILS:');
    console.log(`- ID: ${cuenta.id}`);
    console.log(`- Prov: ${cuenta.proveedor?.nombre}`);
    console.log(`- Original: ${cuenta.montoOriginal}`);
    console.log(`- Pendiente: ${cuenta.montoPendiente}`);
    console.log(`- Estado: ${cuenta.estado}`);

    console.log(`\nPAYMENTS LINKED TO THIS ACCOUNT (${cuenta.pagos.length}):`);
    cuenta.pagos.forEach((p, i) => {
        console.log(`  [${i + 1}] ID: ${p.id}, Amount: ${p.monto}, Date: ${p.fechaPago}, CreatedBy: ${p.creadoPor?.nombre || 'N/A'}`);
    });

    console.log('\nSEARCHING MOVEMENTS FOR THIS ACCOUNT...');
    // Find movements that mention this provider or document in description
    const provName = cuenta.proveedor?.nombre || '';
    const movements = await prisma.movimientoContable.findMany({
        where: {
            OR: [
                { descripcion: { contains: docNum, mode: 'insensitive' } },
                { descripcion: { contains: provName, mode: 'insensitive' } }
            ],
            fecha: {
                gte: new Date('2026-01-01')
            }
        },
        include: {
            usuario: true
        }
    });

    console.log(`Found ${movements.length} related movements:`);
    movements.forEach((m, i) => {
        console.log(`  [${i + 1}] ID: ${m.id}, Amount: ${m.monto}, Type: ${m.tipo}, Desc: ${m.descripcion}, Date: ${m.fecha}`);
    });

    // Recent general account payable payments
    const recentPagos = await prisma.pagoCuentaPorPagar.findMany({
        where: {
            fechaPago: {
                gte: new Date('2026-01-01')
            }
        },
        include: {
            cuentaPorPagar: true
        },
        take: 10,
        orderBy: { fechaPago: 'desc' }
    });

    console.log('\nRECENT ACCOUNT PAYABLE PAYMENTS (LAST 10):');
    recentPagos.forEach(p => {
        console.log(`- Date: ${p.fechaPago}, Amount: ${p.monto}, Doc: ${p.cuentaPorPagar?.numeroDocumento}`);
    });
}

debugPayments()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
