import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function diagnose() {
    const MOVEMENT_ID = 'be39daf5-52ea-4d46-9389-b69704a57d61';
    const CAJA_ID = 'e6a3f6db-6df2-4d05-8413-b164d4f95560';

    try {
        // 1. Get Movement
        const mov = await prisma.movimientoContable.findUnique({
            where: { id: MOVEMENT_ID },
            include: { categoria: true }
        });
        console.log('--- MOVEMENT ---');
        console.log(JSON.stringify(mov, null, 2));

        // 2. Get Caja
        const caja = await prisma.caja.findUnique({
            where: { id: CAJA_ID }
        });
        console.log('--- CAJA ---');
        console.log(JSON.stringify(caja, null, 2));

        // 3. Aggregate
        const aggregates = await prisma.movimientoContable.groupBy({
            by: ['tipo'],
            where: { cajaId: CAJA_ID },
            _sum: { monto: true }
        });
        console.log('--- AGGREGATES ---');
        console.log(JSON.stringify(aggregates, null, 2));

        let totalIngresos = 0;
        let totalGastos = 0;
        aggregates.forEach(agg => {
            if (agg.tipo === 'ingreso' || agg.tipo === 'INGRESO') totalIngresos += Number(agg._sum.monto);
            if (agg.tipo === 'gasto' || agg.tipo === 'GASTO') totalGastos += Number(agg._sum.monto);
        });

        // Note: If typical logic is saldoInicial + ingresos - gastos
        const saldoCalculado = Number(caja.saldoInicial || 0) + totalIngresos - totalGastos;
        console.log(`Saldo Calculado: ${saldoCalculado}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
