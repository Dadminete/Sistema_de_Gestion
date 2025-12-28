const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { CuentaContableService } = require('./services/cuentaContableService');
const { CajaService } = require('./services/cajaService');

async function repair() {
    console.log('--- Starting Balance Repair ---');

    // 1. Recalculate all Cajas
    const cajas = await prisma.caja.findMany({ where: { activa: true } });
    console.log(`Processing ${cajas.length} active cajas...`);
    for (const caja of cajas) {
        const nuevoSaldo = await CajaService.recalculateAndUpdateSaldo(caja.id);
        console.log(`  > Caja: ${caja.nombre} - New Balance: ${nuevoSaldo}`);
    }

    // 2. Recalculate all Cuentas Contables (includes Banks and Cajas)
    const cuentasContables = await prisma.cuentaContable.findMany({ where: { activa: true } });
    console.log(`Processing ${cuentasContables.length} active accounting accounts...`);
    for (const cc of cuentasContables) {
        const nuevoSaldo = await CuentaContableService.recalculateAndUpdateSaldo(cc.id);
        console.log(`  > CC: [${cc.codigo}] ${cc.nombre} - New Balance: ${nuevoSaldo}`);
    }

    console.log('--- Repair Complete ---');
    await prisma.$disconnect();
}

repair().catch(err => {
    console.error(err);
    process.exit(1);
});
