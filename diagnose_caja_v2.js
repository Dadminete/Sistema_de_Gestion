import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function diagnose() {
    const CAJA_ID = 'e6a3f6db-6df2-4d05-8413-b164d4f95560';

    try {
        const caja = await prisma.caja.findUnique({ where: { id: CAJA_ID } });
        console.log('Caja:', JSON.stringify(caja, null, 2));

        const movements = await prisma.movimientoContable.findMany({
            where: { cajaId: CAJA_ID },
            select: { id: true, tipo: true, monto: true, fecha: true }
        });

        let calcBalance = Number(caja.saldoInicial);

        // Manual Sum
        movements.forEach(m => {
            const val = Number(m.monto);
            if (m.tipo.toLowerCase() === 'ingreso') calcBalance += val;
            if (m.tipo.toLowerCase() === 'gasto') calcBalance -= val;
        });

        console.log(`Stored Balance: ${caja.saldoActual}`);
        console.log(`Calculated Balance: ${calcBalance}`);
        console.log(`Difference: ${Number(caja.saldoActual) - calcBalance}`);

        // Check specific 9000 movement
        const target = movements.find(m => Number(m.monto) === 9000);
        console.log('9000 Movement:', target);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
diagnose();
