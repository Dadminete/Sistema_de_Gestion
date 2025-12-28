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
        const categoryTraspasos = await prisma.categoriaCuenta.findFirst({ where: { nombre: 'Traspasos' } });

        console.log('--- AUDIT REPORT (CURRENT MONTH) ---');
        console.log('Excluded Banks:', excludedBanks.map(b => b.nombre).join(', '));
        console.log('Traspasos Category ID:', categoryTraspasos?.id || 'Not Found');

        // 1. Pagos Clientes (Banco)
        const pagos = await prisma.pagoCliente.findMany({
            where: {
                cuentaBancariaId: { not: null },
                estado: 'confirmado',
                fechaPago: { gte: monthStart, lte: monthEnd },
                cuentaBancaria: { bankId: { notIn: excludedBankIds } }
            },
            include: { cuentaBancaria: { include: { bank: true } } }
        });

        let pagosTotal = 0;
        pagos.forEach(p => pagosTotal += Number(p.monto));

        // 2. Movimientos Contables (Banco - Ingresos)
        const movsIngreso = await prisma.movimientoContable.findMany({
            where: {
                metodo: 'banco',
                tipo: 'ingreso',
                fecha: { gte: monthStart, lte: monthEnd },
                NOT: {
                    OR: [
                        { descripcion: { contains: 'Pago Cliente' } },
                        ...(categoryTraspasos ? [{ categoriaId: categoryTraspasos.id }] : [])
                    ]
                },
                NOT: {
                    OR: [
                        { cuentaBancaria: { bankId: { in: excludedBankIds } } },
                        { bankId: { in: excludedBankIds } }
                    ]
                }
            },
            include: { bank: true, cuentaBancaria: { include: { bank: true } } }
        });

        let movsIngresoTotal = 0;
        movsIngreso.forEach(m => movsIngresoTotal += Number(m.monto));

        // 3. Gastos Banco
        const movsGasto = await prisma.movimientoContable.findMany({
            where: {
                metodo: 'banco',
                tipo: 'gasto',
                fecha: { gte: monthStart, lte: monthEnd },
                ...(categoryTraspasos ? { NOT: { categoriaId: categoryTraspasos.id } } : {}),
                NOT: {
                    OR: [
                        { cuentaBancaria: { bankId: { in: excludedBankIds } } },
                        { bankId: { in: excludedBankIds } }
                    ]
                }
            }
        });
        let gastosBancoTotal = 0;
        movsGasto.forEach(m => gastosBancoTotal += Number(m.monto));

        // 4. Caja Principal
        const cajaIngreso = await prisma.movimientoContable.aggregate({
            _sum: { monto: true },
            where: { metodo: 'caja', tipo: 'ingreso', fecha: { gte: monthStart, lte: monthEnd }, ...(categoryTraspasos ? { NOT: { categoriaId: categoryTraspasos.id } } : {}) }
        });
        const cajaGasto = await prisma.movimientoContable.aggregate({
            _sum: { monto: true },
            where: { metodo: 'caja', tipo: 'gasto', fecha: { gte: monthStart, lte: monthEnd }, ...(categoryTraspasos ? { NOT: { categoriaId: categoryTraspasos.id } } : {}) }
        });

        const ingCaja = Number(cajaIngreso._sum.monto || 0);
        const gasCaja = Number(cajaGasto._sum.monto || 0);

        console.log('\n--- BREAKDOWN ---');
        console.log(`Ingresos en Caja: RD$${ingCaja}`);
        console.log(`Pagos Clientes (Banco): RD$${pagosTotal}`);
        console.log(`Otros Ingresos Banco: RD$${movsIngresoTotal}`);
        console.log(`Gastos en Caja: RD$${gasCaja}`);
        console.log(`Gastos en Banco: RD$${gastosBancoTotal}`);

        console.log('\n--- FINAL CALCULATION ---');
        console.log(`Ingreso Real Mes: RD$${ingCaja + pagosTotal + movsIngresoTotal}`);
        console.log(`Gastos Totales: RD$${gasCaja + gastosBancoTotal}`);

        // Detailed Bank List for user
        const allBanks = await prisma.bank.findMany();
        console.log('\n--- BANCOS EN EL SISTEMA ---');
        allBanks.forEach(b => {
            const isExcluded = excludedBankIds.includes(b.id);
            console.log(`- ${b.nombre}: ${isExcluded ? 'EXCLUIDO' : 'INCLUIDO'}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

audit();
