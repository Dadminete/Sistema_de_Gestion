import { PrismaClient } from '@prisma/client';
import { CajaService } from './server/services/cajaService.js'; // Adjust path if needed
const prisma = new PrismaClient();

// Mock CajaService dependecy if it relies on local prisma instance not exported
// Actually, CajaService imports its own prisma. We can try to use it or replicate logic.
// Replicating logic is safer to avoid module issues with the service file itself if not designed for CLI.

async function fixData() {
    const movementId = 'be39daf5-52ea-4d46-9389-b69704a57d61'; // ID from user's log
    const cajaId = 'e6a3f6db-6df2-4d05-8413-b164d4f95560'; // ID from user's log

    try {
        console.log('--- Fixing Movement Date ---');
        // 1. Fix Date
        const updatedMov = await prisma.movimientoContable.update({
            where: { id: movementId },
            data: { fecha: new Date() } // Set to NOW
        });
        console.log('Updated Movement Date:', updatedMov.fecha);

        console.log('--- Recalculating Balance ---');
        // 2. Recalculate Balance manually
        const caja = await prisma.caja.findUnique({ where: { id: cajaId } });
        const saldoInicial = Number(caja.saldoInicial || 0);

        const agregados = await prisma.movimientoContable.groupBy({
            by: ['tipo'],
            where: { cajaId: cajaId },
            _sum: { monto: true }
        });

        console.log('Aggregates:', agregados);

        let totalIngresos = 0;
        let totalGastos = 0;

        agregados.forEach(agg => {
            if (agg.tipo === 'ingreso') totalIngresos += Number(agg._sum.monto || 0);
            if (agg.tipo === 'gasto') totalGastos += Number(agg._sum.monto || 0);
        });

        const saldoFinal = saldoInicial + totalIngresos - totalGastos;
        console.log(`Calculation: ${saldoInicial} + ${totalIngresos} - ${totalGastos} = ${saldoFinal}`);

        const updatedCaja = await prisma.caja.update({
            where: { id: cajaId },
            data: { saldoActual: saldoFinal }
        });
        console.log('Updated Caja Balance:', updatedCaja.saldoActual);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixData();
