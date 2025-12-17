const prisma = require('./server/prismaClient');

async function checkBalancesData() {
    try {
        console.log('=== Checking Database for Balance Data ===\n');

        // Check movimientos_contables
        const movimientos = await prisma.movimientoContable.count();
        console.log(`Movimientos Contables: ${movimientos}`);

        // Check pagos_clientes
        const pagos = await prisma.pagoCliente.count({
            where: { estado: { not: 'anulado' } }
        });
        console.log(`Pagos Clientes (no anulados): ${pagos}`);

        // Check ventas_papeleria
        const ventas = await prisma.ventaPapeleria.count({
            where: { estado: { not: 'anulada' } }
        });
        console.log(`Ventas Papeleria (no anuladas): ${ventas}`);

        // Check cuentas contables with their saldos
        console.log('\n=== Cuentas Contables ===');
        const cuentas = await prisma.cuentaContable.findMany({
            where: { activa: true },
            select: {
                id: true,
                codigo: true,
                nombre: true,
                saldoInicial: true,
                saldoActual: true,
                cajas: {
                    where: { activa: true },
                    select: {
                        id: true,
                        nombre: true,
                        saldoInicial: true,
                        saldoActual: true
                    }
                },
                cuentasBancarias: {
                    where: { activo: true },
                    select: {
                        id: true,
                        numeroCuenta: true
                    }
                }
            },
            take: 5
        });

        cuentas.forEach(cuenta => {
            console.log(`\n${cuenta.codigo} - ${cuenta.nombre}`);
            console.log(`  Saldo Inicial: ${cuenta.saldoInicial}`);
            console.log(`  Saldo Actual: ${cuenta.saldoActual}`);
            console.log(`  Cajas: ${cuenta.cajas.length}`);
            cuenta.cajas.forEach(caja => {
                console.log(`    - ${caja.nombre}: Inicial=${caja.saldoInicial}, Actual=${caja.saldoActual}`);
            });
            console.log(`  Cuentas Bancarias: ${cuenta.cuentasBancarias.length}`);
        });

        // Check if there are any cajas with saldoInicial > 0
        const cajasConSaldo = await prisma.caja.findMany({
            where: {
                activa: true,
                saldoInicial: { gt: 0 }
            },
            select: {
                nombre: true,
                saldoInicial: true,
                saldoActual: true
            }
        });

        console.log(`\n=== Cajas con Saldo Inicial > 0 ===`);
        console.log(`Total: ${cajasConSaldo.length}`);
        cajasConSaldo.forEach(caja => {
            console.log(`  ${caja.nombre}: Inicial=${caja.saldoInicial}, Actual=${caja.saldoActual}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkBalancesData();
