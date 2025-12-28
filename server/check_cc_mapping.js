const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCCs() {
    const accounts = await prisma.cuentaBancaria.findMany({
        where: { activo: true },
        include: { bank: true, cuentaContable: true }
    });

    console.log('--- BANK ACCOUNT TO CC MAPPING ---');
    accounts.forEach(a => {
        console.log(`Bank: ${a.bank.nombre} | Acc: ${a.numeroCuenta} | CC ID: ${a.cuentaContableId} | CC Name: ${a.cuentaContable?.nombre} | Balance: ${a.cuentaContable?.saldoActual}`);
    });

    await prisma.$disconnect();
}
checkCCs();
