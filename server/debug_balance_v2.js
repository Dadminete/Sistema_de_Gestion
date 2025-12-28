const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugFilter() {
    try {
        console.log('--- DEBUGGING BANK FILTER ---');

        const excludedBanks = await prisma.bank.findMany({
            where: { nombre: { contains: 'fondesa', mode: 'insensitive' } },
            select: { id: true, nombre: true }
        });
        console.log('Excluded Banks:', excludedBanks);
        const excludedBankIds = excludedBanks.map(b => b.id);

        const excludedCCs = await prisma.cuentaBancaria.findMany({
            where: { bankId: { in: excludedBankIds } },
            select: { cuentaContableId: true, numeroCuenta: true, bank: { select: { nombre: true } } }
        });
        console.log('Fondesa Bank Accounts & their CC IDs:');
        excludedCCs.forEach(c => console.log(`  - ${c.bank.nombre} (${c.numeroCuenta}) | CC ID: ${c.cuentaContableId}`));

        const ccIdsToExclude = [...new Set(excludedCCs.map(c => c.cuentaContableId))];
        console.log('CC IDs to Exclude:', ccIdsToExclude);

        const accounts = await prisma.cuentaBancaria.findMany({
            where: {
                activo: true,
                bankId: { notIn: excludedBankIds },
                NOT: {
                    cuentaContableId: { in: ccIdsToExclude }
                }
            },
            include: {
                bank: true,
                cuentaContable: true
            }
        });

        console.log(`\nFound ${accounts.length} ACTIVE accounts (excluding Fondesa & shared CCs):`);
        let total = 0;
        const uniqueBalances = new Map();

        accounts.forEach(a => {
            const balance = Number(a.cuentaContable?.saldoActual || 0);
            console.log(`- ${a.bank.nombre} (${a.numeroCuenta}) | CC: ${a.cuentaContableId} | Balance: ${balance}`);
            if (a.cuentaContableId) {
                uniqueBalances.set(a.cuentaContableId, balance);
            }
        });

        const sum = Array.from(uniqueBalances.values()).reduce((acc, v) => acc + v, 0);
        console.log('\nFinal Calculated Balance:', sum);

        if (sum === 0 && accounts.length > 0) {
            console.log('!!! WARNING: Found accounts but total is 0. Check saldoActual in CuentaContable.');
        }

        // Check all active accounts regardless of filter to see what's being left out
        const allActive = await prisma.cuentaBancaria.findMany({
            where: { activo: true },
            include: { bank: true, cuentaContable: true }
        });
        console.log(`\n--- ALL ACTIVE ACCOUNTS (${allActive.length}) ---`);
        allActive.forEach(a => {
            const isExcluded = excludedBankIds.includes(a.bankId) || ccIdsToExclude.includes(a.cuentaContableId);
            console.log(`- ${a.bank.nombre} | ${a.numeroCuenta} | Balance: ${a.cuentaContable?.saldoActual} | EXCLUDED: ${isExcluded}`);
        });

    } catch (error) {
        console.error('Debug script failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugFilter();
