const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const now = new Date();
    const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    console.log('--- Configuración ---');
    console.log('Mes actual:', (now.getMonth() + 1) + '/' + now.getFullYear());
    console.log('Rango:', primerDiaMes.toISOString(), 'al', ultimoDiaMes.toISOString());

    const countBancos = await prisma.bank.count();
    const countCuentas = await prisma.cuentaBancaria.count({ where: { activo: true } });

    const pagosMes = await prisma.pagoCliente.findMany({
        where: {
            estado: 'confirmado',
            fechaPago: { gte: primerDiaMes, lte: ultimoDiaMes }
        },
        select: { monto: true, fechaPago: true }
    });

    const movimientosMes = await prisma.movimientoContable.findMany({
        where: {
            fecha: { gte: primerDiaMes, lte: ultimoDiaMes }
        },
        select: { tipo: true, monto: true, metodo: true, descripcion: true }
    });

    console.log('--- Resultados ---');
    console.log('Bancos:', countBancos);
    console.log('Cuentas Bancarias Activas:', countCuentas);
    console.log('Pagos Confirmados este mes:', pagosMes.length);
    console.log('Suma Pagos:', pagosMes.reduce((acc, p) => acc + Number(p.monto), 0));
    console.log('Movimientos este mes:', movimientosMes.length);
    console.log('Ingresos este mes:', movimientosMes.filter(m => m.tipo === 'ingreso').reduce((acc, m) => acc + Number(m.monto), 0));
    console.log('Gastos este mes:', movimientosMes.filter(m => m.tipo === 'gasto').reduce((acc, m) => acc + Number(m.monto), 0));

    if (movimientosMes.length > 0) {
        console.log('Muestra descripciones movimientos:', movimientosMes.slice(0, 5).map(m => m.descripcion));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
