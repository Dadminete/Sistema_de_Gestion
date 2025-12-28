const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    const excludedBanks = await prisma.bank.findMany({
        where: { nombre: { contains: 'fondesa', mode: 'insensitive' } },
        select: { id: true, nombre: true }
    });
    const excludedBankIds = excludedBanks.map(b => b.id);

    const excludedCCs = await prisma.cuentaBancaria.findMany({
        where: { bankId: { in: excludedBankIds } },
        select: { cuentaContableId: true }
    });
    const ccIdsToExclude = [...new Set(excludedCCs.map(c => c.cuentaContableId))];

    const allActive = await prisma.cuentaBancaria.findMany({
        where: { activo: true },
        include: { bank: true, cuentaContable: true }
    });

    console.log('--- SUMMARY BY BANK ---');
    const summary = {};
    allActive.forEach(a => {
        const bankName = a.bank.nombre;
        const isExcludedBank = excludedBankIds.includes(a.bankId);
        const isExcludedCC = ccIdsToExclude.includes(a.cuentaContableId);
        const isExcluded = isExcludedBank || isExcludedCC;
        const balance = Number(a.cuentaContable?.saldoActual || 0);

        if (!summary[bankName]) summary[bankName] = { total: 0, excluded: 0, accounts: 0 };
        summary[bankName].accounts++;
        summary[bankName].total += balance;
        if (isExcluded) summary[bankName].excluded += balance;
    });

    for (const [bank, data] of Object.entries(summary)) {
        console.log(`${bank}: ${data.accounts} accounts | Total Balance: ${data.total} | Excluded: ${data.excluded} | Final in Dashboard: ${data.total - data.excluded}`);
    }

    await prisma.$disconnect();
}
debug();
