const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
    const bankId = 'bc1a7778-2ee9-4f0d-ab60-d141742db94e';

    const bank = await prisma.bank.findUnique({
        where: { id: bankId },
        include: {
            cuentas: {
                include: {
                    cuentaContable: true
                }
            }
        }
    });

    if (!bank) {
        console.log('Bank not found');
        return;
    }

    console.log(`Bank: ${bank.nombre}`);

    for (const cuenta of bank.cuentas) {
        console.log(`\nCuenta: ${cuenta.numeroCuenta} (${cuenta.nombreOficialCuenta})`);
        console.log(`Saldo Actual (CuentaContable): ${cuenta.cuentaContable.saldoActual}`);
        console.log(`Saldo Inicial (CuentaContable): ${cuenta.cuentaContable.saldoInicial}`);

        const movimientos = await prisma.movimientoContable.findMany({
            where: { cuentaBancariaId: cuenta.id },
            orderBy: { fecha: 'desc' },
            take: 20
        });

        console.log('\nÚltimos 20 movimientos:');
        let sumMovs = 0;
        movimientos.forEach(m => {
            const monto = parseFloat(m.monto);
            console.log(`- ${m.fecha.toISOString()} | ${m.tipo} | ${m.monto} | ${m.descripcion}`);
            if (m.tipo === 'ingreso') sumMovs += monto;
            else sumMovs -= monto;
        });

        const pagos = await prisma.pagoCliente.findMany({
            where: { cuentaBancariaId: cuenta.id, estado: 'confirmado' }
        });

        console.log(`\nPagos Confirmados: ${pagos.length}`);
        let sumPagos = 0;
        pagos.forEach(p => {
            sumPagos += parseFloat(p.monto);
            // console.log(`- ${p.fechaPago.toISOString()} | ${p.monto} | ${p.numeroPago}`);
        });
        console.log(`Suma Pagos: ${sumPagos}`);

        const totalIngresosMovs = movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + parseFloat(m.monto), 0);
        const totalGastosMovs = movimientos.filter(m => m.tipo === 'gasto').reduce((s, m) => s + parseFloat(m.monto), 0);

        // Check for double counting
        const pagosConMovimiento = await prisma.movimientoContable.count({
            where: {
                cuentaBancariaId: cuenta.id,
                descripcion: { contains: 'Pago Factura' }
            }
        });
        console.log(`Movimientos de "Pago Factura": ${pagosConMovimiento}`);

        const balanceCalculado = parseFloat(cuenta.cuentaContable.saldoInicial) + sumMovs + sumPagos;
        const balanceSoloMovs = parseFloat(cuenta.cuentaContable.saldoInicial) + sumMovs;

        console.log(`\nBalance Calculado (Movs + Pagos): ${balanceCalculado}`);
        console.log(`Balance Calculado (Solo Movs + Saldo Inicial): ${balanceSoloMovs}`);
        console.log(`Diferencia vs SaldoActual: ${parseFloat(cuenta.cuentaContable.saldoActual) - balanceSoloMovs}`);
    }

    await prisma.$disconnect();
}

diagnose();
