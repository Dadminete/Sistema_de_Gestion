const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLegacyData() {
    const accountId = '07acf97a-80d3-4270-bd20-f587bfc7d6d5';
    const movementIds = [
        'b0ad4f0a-3e46-4db9-9e72-298c1976aa1d',
        'fdba0e73-9f3f-413e-ad55-6a1e18153371'
    ];

    console.log('--- FIXING LEGACY PAYMENTS (RAW) ---');

    const admin = await prisma.usuario.findFirst({ where: { username: 'Admin' } });
    if (!admin) {
        console.log('Admin user not found!');
        return;
    }
    const adminId = admin.id;

    for (const movId of movementIds) {
        // 1. Link movement using RAW query because client is not regenerated
        try {
            await prisma.$executeRawUnsafe(`UPDATE movimientos_contables SET "cuenta_por_pagar_id" = '${accountId}'::uuid WHERE id_movimiento = '${movId}'::uuid`);
            console.log(`Linked movement ${movId} using raw query.`);
        } catch (e) {
            // Try without double quotes or with different field name if it fails
            try {
                await prisma.$executeRawUnsafe(`UPDATE movimientos_contables SET cuenta_por_pagar_id = '${accountId}'::uuid WHERE id = '${movId}'::uuid`);
                console.log(`Linked movement ${movId} using raw query (alt).`);
            } catch (e2) {
                console.error(`Failed to link movement ${movId}:`, e2.message);
            }
        }

        // 2. Create missing PagoCuentaPorPagar (this doesn't need new schema info)
        const mov = await prisma.movimientoContable.findUnique({ where: { id: movId } });
        if (!mov) {
            console.log(`Movement ${movId} could not be read for payment creation.`);
            continue;
        }

        const existingPago = await prisma.pagoCuentaPorPagar.findFirst({
            where: {
                cuentaPorPagarId: accountId,
                monto: mov.monto,
                fechaPago: mov.fecha,
                metodoPago: mov.metodo
            }
        });

        if (!existingPago) {
            await prisma.pagoCuentaPorPagar.create({
                data: {
                    cuentaPorPagarId: accountId,
                    monto: mov.monto,
                    fechaPago: mov.fecha,
                    metodoPago: mov.metodo,
                    observaciones: `Pago reconstruido desde movimiento contable: ${mov.descripcion}`,
                    creadoPorId: adminId
                }
            });
            console.log(`Created payment for movement ${movId}`);
        } else {
            console.log(`Payment already exists for movement ${movId}`);
        }
    }

    console.log('Legacy data fix complete.');
}

fixLegacyData()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
