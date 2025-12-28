const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
    const bankId = 'bc1a7778-2ee9-4f0d-ab60-d141742db94e';

    const bank = await prisma.bank.findUnique({
        where: { id: bankId },
        include: {
            cuentas: true
        }
    });

    if (!bank) {
        console.log('Bank not found');
        return;
    }

    console.log(`Bank: ${bank.nombre}`);

    for (const cuenta of bank.cuentas) {
        console.log(`\nCuenta: ${cuenta.numeroCuenta}`);
        console.log(`ID Cuenta Bancaria: ${cuenta.id}`);
        console.log(`ID Cuenta Contable: ${cuenta.cuentaContableId}`);

        const account = await prisma.cuentaContable.findUnique({
            where: { id: cuenta.cuentaContableId }
        });
        console.log(`Nombre Cuenta Contable: ${account.nombre}`);
        console.log(`Saldo Actual: ${account.saldoActual}`);
    }

    await prisma.$disconnect();
}

diagnose();
