const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugBankBalances() {
    console.log('--- DEBUG BANK BALANCES ---');
    const accounts = await prisma.cuentaBancaria.findMany({
        where: {
            activo: true,
            bank: {
                OR: [
                    { nombre: { contains: 'popular', mode: 'insensitive' } },
                    { nombre: { contains: 'reserva', mode: 'insensitive' } },
                    { nombre: { contains: 'qik', mode: 'insensitive' } },
                    { nombre: { contains: 'bhd', mode: 'insensitive' } },
                ]
            }
        },
        include: {
            bank: true,
            cuentaContable: true
        }
    });

    console.log(`Total Bank Accounts Found: ${accounts.length}`);

    const uniqueAccounting = new Map();
    let totalSum = 0;

    accounts.forEach(a => {
        const cc = a.cuentaContable;
        console.log(`Account: ${a.bank.nombre} - ${a.numeroCuenta}`);
        console.log(`  CC ID: ${cc.id} | Code: ${cc.codigo} | Level: ${cc.nivel}`);
        console.log(`  Name: ${cc.nombre}`);
        console.log(`  Balance: ${cc.saldoActual}`);

        totalSum += Number(cc.saldoActual);
        uniqueAccounting.set(cc.id, cc.saldoActual);
    });

    console.log('---');
    console.log(`Sum of all account-linked balances: ${totalSum}`);

    let uniqueSum = 0;
    uniqueAccounting.forEach((bal) => uniqueSum += Number(bal));
    console.log(`Sum of unique accounting balances: ${uniqueSum}`);

    // Check for parents
    const parents = await prisma.cuentaContable.findMany({
        where: {
            id: { in: Array.from(uniqueAccounting.keys()) },
            padreId: { not: null }
        }
    });
    console.log(`Accounts with parents: ${parents.length}`);

    process.exit(0);
}

debugBankBalances().catch(e => {
    console.error(e);
    process.exit(1);
});
