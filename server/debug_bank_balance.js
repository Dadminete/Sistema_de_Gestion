const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Bank Balances ---');

    const cuentasBancarias = await prisma.cuentaBancaria.findMany({
        where: { activo: true },
        include: {
            bank: true,
            cuentaContable: {
                select: {
                    id: true,
                    nombre: true,
                    saldoActual: true
                }
            }
        }
    });

    console.log(`Found ${cuentasBancarias.length} active bank accounts.`);

    const uniqueCCIds = new Set();
    let totalBalance = 0;

    for (const c of cuentasBancarias) {
        if (c.cuentaContable) {
            if (!uniqueCCIds.has(c.cuentaContableId)) {
                uniqueCCIds.add(c.cuentaContableId);
                totalBalance += Number(c.cuentaContable.saldoActual);
                console.log(`[+] ${c.bank.nombre} (${c.numeroCuenta}): ${Number(c.cuentaContable.saldoActual).toFixed(2)}`);
            } else {
                console.log(`[SKIP] ${c.bank.nombre} (${c.numeroCuenta}) - Duplicate CC`);
            }
        }
    }
    console.log(`TOTAL: ${totalBalance.toFixed(2)}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
