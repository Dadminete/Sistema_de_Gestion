const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllLinks() {
    const cajas = await prisma.caja.findMany({
        include: { cuentaContable: true }
    });
    const bancos = await prisma.cuentaBancaria.findMany({
        include: { bank: true, cuentaContable: true }
    });

    console.log('--- CAJAS ---');
    cajas.forEach(c => {
        console.log(`Caja: ${c.nombre} | ID: ${c.id} | CC ID: ${c.cuentaContableId} | CC Name: ${c.cuentaContable?.nombre} | Balance: ${c.cuentaContable?.saldoActual}`);
    });

    console.log('\n--- BANCOS ---');
    bancos.forEach(b => {
        console.log(`Bank: ${b.bank?.nombre} | Acc: ${b.numeroCuenta} | CC ID: ${b.cuentaContableId} | CC Name: ${b.cuentaContable?.nombre}`);
    });

    await prisma.$disconnect();
}
checkAllLinks();
