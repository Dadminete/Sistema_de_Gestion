const prisma = require('./prismaClient');

async function checkBankStructure() {
    try {
        // Ver cuántas cuentas contables únicas tienen las cuentas bancarias
        const cuentasBancarias = await prisma.cuentaBancaria.findMany({
            where: { activo: true },
            select: {
                id: true,
                numeroCuenta: true,
                nombreOficialCuenta: true,
                cuentaContableId: true,
                bank: {
                    select: { nombre: true }
                }
            }
        });

        console.log('===== ESTRUCTURA DE CUENTAS BANCARIAS =====\n');

        const cuentaContableIds = new Set();
        cuentasBancarias.forEach(cb => {
            cuentaContableIds.add(cb.cuentaContableId);
            console.log(`${cb.bank.nombre} - ${cb.numeroCuenta || cb.nombreOficialCuenta}`);
            console.log(`  CuentaContableId: ${cb.cuentaContableId}`);
            console.log('');
        });

        console.log(`Total cuentas bancarias: ${cuentasBancarias.length}`);
        console.log(`Total cuentas contables únicas: ${cuentaContableIds.size}`);
        console.log('\n¿Problema? Todas las cuentas bancarias comparten la misma cuenta contable\n');

        // Verificar los saldos reales en las cuentas contables de bancos
        const cuentasContablesBanco = await prisma.cuentaContable.findMany({
            where: {
                id: { in: Array.from(cuentaContableIds) }
            }
        });

        console.log('===== CUENTAS CONTABLES DE BANCOS =====\n');
        cuentasContablesBanco.forEach(cc => {
            console.log(`${cc.nombre} (${cc.codigo}): Saldo = RD$${cc.saldoActual}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkBankStructure();
