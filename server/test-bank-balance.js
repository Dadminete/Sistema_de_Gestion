const prisma = require('./prismaClient');

async function testBankBalance() {
    try {
        console.log('===== CALCULANDO BALANCE DE BANCO =====\n');

        // 1. Obtener cuentas bancarias activas
        const cuentasBancarias = await prisma.cuentaBancaria.findMany({
            where: { activo: true },
            select: {
                id: true,
                numeroCuenta: true,
                nombreOficialCuenta: true,
                bank: { select: { nombre: true } }
            }
        });

        console.log(`Total cuentas bancarias activas: ${cuentasBancarias.length}\n`);

        let balanceBancoTotal = 0;

        // 2. Calcular balance por movimientos contables
        for (const cb of cuentasBancarias) {
            const movimientos = await prisma.movimientoContable.findMany({
                where: { cuentaBancariaId: cb.id },
                select: { tipo: true, monto: true },
            });

            const balance = movimientos.reduce((acc, mov) => {
                const monto = parseFloat(mov.monto);
                return mov.tipo === 'ingreso' ? acc + monto : acc - monto;
            }, 0);

            console.log(`${cb.bank.nombre} - ${cb.numeroCuenta || cb.nombreOficialCuenta}`);
            console.log(`  Movimientos: ${movimientos.length}`);
            console.log(`  Balance de movimientos: RD$${balance.toFixed(2)}`);

            balanceBancoTotal += balance;
        }

        console.log(`\nBalance total de movimientos: RD$${balanceBancoTotal.toFixed(2)}\n`);

        // 3. Sumar pagos de clientes
        const pagosClientesBanco = await prisma.pagoCliente.findMany({
            where: {
                cuentaBancariaId: { not: null },
                estado: 'confirmado'
            },
            select: { monto: true, cuentaBancariaId: true }
        });

        const totalPagos = pagosClientesBanco.reduce((sum, pago) => sum + Number(pago.monto || 0), 0);
        console.log(`Total pagos de clientes a bancos: ${pagosClientesBanco.length} pagos`);
        console.log(`Suma de pagos: RD$${totalPagos.toFixed(2)}\n`);

        const balanceFinal = balanceBancoTotal + totalPagos;
        console.log(`===== BALANCE TOTAL BANCOS =====`);
        console.log(`RD$${balanceFinal.toFixed(2)}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testBankBalance();
