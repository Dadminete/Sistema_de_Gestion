import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const logPath = path.resolve('fix_log.txt');

function log(msg) {
    const time = new Date().toISOString();
    const line = `[${time}] ${msg}\n`;
    console.log(msg);
    fs.appendFileSync(logPath, line);
}

async function main() {
    log('--- STARTING FIX ---');
    try {
        const CAJA_ID = 'e6a3f6db-6df2-4d05-8413-b164d4f95560';
        const MOV_ID = 'be39daf5-52ea-4d46-9389-b69704a57d61';

        // 1. Fix Category Casing
        log('Fixing Categoria Nomina...');
        const updatedCat = await prisma.categoriaCuenta.updateMany({
            where: { nombre: 'Nómina' },
            data: { tipo: 'gasto' }
        });
        log(`Categories updated: ${updatedCat.count}`);

        // 2. Fix Movement Date
        log('Fixing Movement Date...');
        const updatedMov = await prisma.movimientoContable.update({
            where: { id: MOV_ID },
            data: { fecha: new Date() }
        });
        log(`Movement updated: ${updatedMov ? 'YES' : 'NO'} (${updatedMov.fecha})`);

        // 3. Recalculate Balance
        log('Recalculating Balance...');
        const caja = await prisma.caja.findUnique({ where: { id: CAJA_ID } });
        const saldoInicial = Number(caja.saldoInicial);
        log(`Saldo Inicial: ${saldoInicial}`);

        const agregados = await prisma.movimientoContable.groupBy({
            by: ['tipo'],
            where: { cajaId: CAJA_ID },
            _sum: { monto: true }
        });

        let totalIngresos = 0;
        let totalGastos = 0;
        agregados.forEach(agg => {
            const val = Number(agg._sum.monto || 0);
            if (agg.tipo.toLowerCase() === 'ingreso') totalIngresos += val;
            if (agg.tipo.toLowerCase() === 'gasto') totalGastos += val;
        });

        const nuevoSaldo = saldoInicial + totalIngresos - totalGastos;
        log(`Total Ingresos: ${totalIngresos}`);
        log(`Total Gastos: ${totalGastos}`);
        log(`Nuevo Saldo Calculado: ${nuevoSaldo}`);

        const updatedCaja = await prisma.caja.update({
            where: { id: CAJA_ID },
            data: { saldoActual: nuevoSaldo }
        });
        log(`Caja Updated. Saldo Actual stored: ${updatedCaja.saldoActual}`);

    } catch (e) {
        log(`ERROR: ${e.message}`);
        log(e.stack);
    } finally {
        await prisma.$disconnect();
        log('--- FINISHED ---');
    }
}

main();
