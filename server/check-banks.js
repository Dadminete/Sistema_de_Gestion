const prisma = require('./prismaClient');

async function checkBankAccounts() {
    try {
        const cuentasBancarias = await prisma.cuentaBancaria.findMany({
            where: { activo: true },
            include: {
                bank: {
                    select: { nombre: true }
                },
                cuentaContable: {
                    select: {
                        nombre: true,
                        saldoActual: true,
                        saldoInicial: true
                    }
                }
            },
            take: 5 // Solo las primeras 5 para no saturar
        });

        console.log('===== CUENTAS BANCARIAS ACTIVAS =====\n');

        let totalBalance = 0;
        cuentasBancarias.forEach(cb => {
            const saldo = parseFloat(cb.cuentaContable?.saldoActual || 0);
            totalBalance += saldo;
            console.log(`${cb.bank.nombre} - ${cb.numeroCuenta}`);
            console.log(`  Cuenta Contable: ${cb.cuentaContable?.nombre || 'N/A'}`);
            console.log(`  Saldo: RD$${saldo.toFixed(2)}`);
            console.log('');
        });

        console.log(`TOTAL BALANCE BANCOS: RD$${totalBalance.toFixed(2)}`);
        console.log(`\nTotal cuentas bancarias activas: ${cuentasBancarias.length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkBankAccounts();
