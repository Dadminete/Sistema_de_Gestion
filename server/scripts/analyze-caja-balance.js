const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeCajaBalance() {
    try {
        console.log('=== ANÁLISIS DETALLADO DEL BALANCE DE CAJA ===\n');

        // 1. Obtener Caja Principal
        const cajaPrincipal = await prisma.caja.findFirst({
            where: {
                OR: [
                    { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
                    { tipo: 'general' }
                ]
            }
        });

        if (!cajaPrincipal) {
            console.log('ERROR: No se encontró Caja Principal');
            return;
        }

        console.log(`Caja Principal ID: ${cajaPrincipal.id}`);
        console.log(`Nombre: ${cajaPrincipal.nombre}`);
        console.log(`Saldo Inicial: RD$${Number(cajaPrincipal.saldoInicial)}`);
        console.log(`Saldo Actual (en DB): RD$${Number(cajaPrincipal.saldoActual)}\n`);

        // 2. Obtener todos los movimientos de esta caja
        const movimientos = await prisma.movimientoContable.findMany({
            where: {
                cajaId: cajaPrincipal.id
            },
            orderBy: {
                fecha: 'asc'
            }
        });

        console.log(`Total de movimientos asociados a esta caja: ${movimientos.length}\n`);

        let totalIngresos = 0;
        let totalGastos = 0;

        console.log('MOVIMIENTOS:');
        movimientos.forEach((mov, index) => {
            const monto = Number(mov.monto);
            console.log(`${index + 1}. ${mov.tipo.toUpperCase()}: RD$${monto} - ${mov.descripcion}`);

            if (mov.tipo === 'ingreso') {
                totalIngresos += monto;
            } else if (mov.tipo === 'gasto') {
                totalGastos += monto;
            }
        });

        console.log(`\n=== CÁLCULO ===`);
        console.log(`Saldo Inicial: RD$${Number(cajaPrincipal.saldoInicial)}`);
        console.log(`Total Ingresos: RD$${totalIngresos}`);
        console.log(`Total Gastos: RD$${totalGastos}`);
        console.log(`Balance Calculado: RD$${Number(cajaPrincipal.saldoInicial) + totalIngresos - totalGastos}`);
        console.log(`Balance en DB: RD$${Number(cajaPrincipal.saldoActual)}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeCajaBalance();
