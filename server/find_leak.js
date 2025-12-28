const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findTheLeak() {
    console.log('--- FINDING THE LEAK ---');

    const bankRestriction = {
        OR: [
            { nombre: { contains: 'popular', mode: 'insensitive' } },
            { nombre: { contains: 'reserva', mode: 'insensitive' } },
            { nombre: { contains: 'qik', mode: 'insensitive' } },
            { nombre: { contains: 'bhd', mode: 'insensitive' } },
        ]
    };

    const activeAccounts = await prisma.cuentaBancaria.findMany({
        where: { activo: true },
        include: { bank: true, cuentaContable: true }
    });

    console.log(`Active Accounts: ${activeAccounts.length}`);

    const included = activeAccounts.filter(a => {
        const name = a.bank?.nombre.toLowerCase() || '';
        return name.includes('popular') || name.includes('reserva') || name.includes('qik') || name.includes('bhd');
    });

    const excluded = activeAccounts.filter(a => {
        const name = a.bank?.nombre.toLowerCase() || '';
        return !(name.includes('popular') || name.includes('reserva') || name.includes('qik') || name.includes('bhd'));
    });

    console.log(`Included by Filter (${included.length}):`);
    included.forEach(a => console.log(`  - ${a.bank.nombre} | ${a.numeroCuenta} | Balance: ${a.cuentaContable.saldoActual}`));

    console.log(`Excluded by Filter (${excluded.length}):`);
    excluded.forEach(a => console.log(`  - ${a.bank ? a.bank.nombre : 'NO BANK'} | ${a.numeroCuenta} | Balance: ${a.cuentaContable.saldoActual}`));

    process.exit(0);
}

findTheLeak().catch(e => {
    console.error(e);
    process.exit(1);
});
