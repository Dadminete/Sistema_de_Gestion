const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
    try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const excludedBanks = await prisma.bank.findMany({
            where: { nombre: { contains: 'fondesa', mode: 'insensitive' } },
            select: { id: true, nombre: true }
        });
        const excludedBankIds = excludedBanks.map(b => b.id);
        console.log('--- AUDIT REPORT (CURRENT MONTH) ---');
        console.log('Excluded Banks IDs:', excludedBankIds.join(', '));
        console.log('Excluded Banks Names:', excludedBanks.map(b => b.nombre).join(', '));

        // 1. Pagos Clientes (Banco)
        const pagos = await prisma.pagoCliente.findMany({
            where: {
                cuentaBancariaId: { not: null },
                estado: 'confirmado',
                fechaPago: { gte: monthStart, lte: monthEnd },
            },
            include: { cuentaBancaria: { include: { bank: true } } }
        });

        console.log('\n--- PAYMENTS (PAGOS CLIENTES - BANCO) ---');
        let pagosTotal = 0;
        const pagosByBank = {};
        pagos.forEach(p => {
            const bankName = p.cuentaBancaria?.bank?.nombre || 'No Bank Name';
            const bankId = p.cuentaBancaria?.bankId;
            const isExcluded = bankId && excludedBankIds.includes(bankId);

            if (!pagosByBank[bankName]) pagosByBank[bankName] = { included: 0, excluded: 0 };
            if (isExcluded) {
                pagosByBank[bankName].excluded += Number(p.monto);
            } else {
                pagosByBank[bankName].included += Number(p.monto);
                pagosTotal += Number(p.monto);
            }
        });
        for (const [bank, data] of Object.entries(pagosByBank)) {
            console.log(`${bank}: Included: ${data.included} | Excluded: ${data.excluded}`);
        }

        // 2. Movimientos Contables (Banco - Ingresos)
        const movsIngreso = await prisma.movimientoContable.findMany({
            where: {
                metodo: 'banco',
                tipo: 'ingreso',
                fecha: { gte: monthStart, lte: monthEnd }
            },
            include: { cuentaBancaria: { include: { bank: true } }, bank: true }
        });

        console.log('\n--- MOVIMIENTOS CONTABLES (INGRESOS BANCO) ---');
        let movsIngresoTotal = 0;
        const movsByBank = {};
        movsIngreso.forEach(m => {
            const bankObj = m.cuentaBancaria?.bank || m.bank;
            const bankName = bankObj?.nombre || 'Unknown';
            const bankId = bankObj?.id;
            const isExcluded = bankId && excludedBankIds.includes(bankId);
            const isPagoCliente = m.descripcion && m.descripcion.includes('Pago Cliente');

            if (!movsByBank[bankName]) movsByBank[bankName] = { included: 0, excluded: 0, deduplicated: 0 };

            if (isExcluded) {
                movsByBank[bankName].excluded += Number(m.monto);
            } else {
                if (isPagoCliente) {
                    movsByBank[bankName].deduplicated += Number(m.monto);
                } else {
                    movsByBank[bankName].included += Number(m.monto);
                    movsIngresoTotal += Number(m.monto);
                }
            }
        });
        for (const [bank, data] of Object.entries(movsByBank)) {
            console.log(`${bank}: Included: ${data.included} | Deduplicated: ${data.deduplicated} | Excluded: ${data.excluded}`);
        }

        // 3. Gastos Banco
        const movsGasto = await prisma.movimientoContable.findMany({
            where: {
                metodo: 'banco',
                tipo: 'gasto',
                fecha: { gte: monthStart, lte: monthEnd }
            },
            include: { cuentaBancaria: { include: { bank: true } }, bank: true }
        });

        console.log('\n--- MOVIMIENTOS CONTABLES (GASTOS BANCO) ---');
        let gastosBancoTotal = 0;
        const gastosByBank = {};
        movsGasto.forEach(m => {
            const bankObj = m.cuentaBancaria?.bank || m.bank;
            const bankName = bankObj?.nombre || 'Unknown';
            const bankId = bankObj?.id;
            const isExcluded = bankId && excludedBankIds.includes(bankId);

            if (!gastosByBank[bankName]) gastosByBank[bankName] = { included: 0, excluded: 0 };
            if (isExcluded) {
                gastosByBank[bankName].excluded += Number(m.monto);
            } else {
                gastosByBank[bankName].included += Number(m.monto);
                gastosBancoTotal += Number(m.monto);
            }
        });
        for (const [bank, data] of Object.entries(gastosByBank)) {
            console.log(`${bank}: Included: ${data.included} | Excluded: ${data.excluded}`);
        }

        // 4. Caja Principal
        const cajaIngreso = await prisma.movimientoContable.aggregate({
            _sum: { monto: true },
            where: { metodo: 'caja', tipo: 'ingreso', fecha: { gte: monthStart, lte: monthEnd } }
        });
        const cajaGasto = await prisma.movimientoContable.aggregate({
            _sum: { monto: true },
            where: { metodo: 'caja', tipo: 'gasto', fecha: { gte: monthStart, lte: monthEnd } }
        });
        const ingCaja = Number(cajaIngreso._sum.monto || 0);
        const gasCaja = Number(cajaGasto._sum.monto || 0);

        console.log('\n--- CAJA PRINCIPAL ---');
        console.log(`Ingresos Caja: RD$${ingCaja}`);
        console.log(`Gastos Caja: RD$${gasCaja}`);

        console.log('\n--- FINAL CALCULATION ---');
        const totalIngreso = ingCaja + pagosTotal + movsIngresoTotal;
        const totalGasto = gasCaja + gastosBancoTotal;

        console.log(`Total Ingreso Real Mes: RD$${totalIngreso}`);
        console.log(`Total Gastos Mes: RD$${totalGasto}`);

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

audit();
