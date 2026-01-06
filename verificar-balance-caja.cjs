require('dotenv').config({ path: './server/.env' });
const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function verificarBalance() {
    try {
        console.log('=== Verificación de Balance de Caja ===\n');

        // Obtener la caja principal
        const cajaPrincipal = await prisma.caja.findFirst({
            where: { nombre: 'Caja Principal' }
        });

        if (!cajaPrincipal) {
            console.log('❌ Caja Principal no encontrada');
            return;
        }

        console.log(`💰 Caja Principal`);
        console.log(`   ID: ${cajaPrincipal.id}`);
        console.log(`   Saldo Inicial: $${parseFloat(cajaPrincipal.saldoInicial).toFixed(2)}`);
        console.log(`   Saldo Actual: $${parseFloat(cajaPrincipal.saldoActual).toFixed(2)}`);

        // Calcular balance desde movimientos
        const movimientos = await prisma.movimientoContable.findMany({
            where: {
                cajaId: cajaPrincipal.id
            },
            orderBy: {
                fecha: 'asc'
            }
        });

        let balanceCalculado = parseFloat(cajaPrincipal.saldoInicial);
        console.log(`\n📊 Calculando balance desde movimientos...`);
        console.log(`   Saldo Inicial: $${balanceCalculado.toFixed(2)}`);

        for (const mov of movimientos) {
            if (mov.tipo === 'ingreso') {
                balanceCalculado += parseFloat(mov.monto);
            } else if (mov.tipo === 'egreso') {
                balanceCalculado -= parseFloat(mov.monto);
            }
        }

        console.log(`   Total Movimientos: ${movimientos.length}`);
        console.log(`   Balance Calculado: $${balanceCalculado.toFixed(2)}`);
        console.log(`   Saldo Actual en DB: $${parseFloat(cajaPrincipal.saldoActual).toFixed(2)}`);
        
        const diferencia = parseFloat(cajaPrincipal.saldoActual) - balanceCalculado;
        console.log(`   Diferencia: $${diferencia.toFixed(2)}`);

        if (Math.abs(diferencia) > 0.01) {
            console.log(`   ⚠️  HAY UNA DIFERENCIA - El saldo en la DB no coincide con los movimientos`);
        } else {
            console.log(`   ✅ El saldo está correcto según los movimientos`);
        }

        // Verificar los movimientos de las facturas específicas
        console.log(`\n\n📋 Movimientos de las facturas con descuento:`);
        const movimientosFacturas = await prisma.movimientoContable.findMany({
            where: {
                cajaId: cajaPrincipal.id,
                descripcion: {
                    contains: 'FAC-2025-001'
                }
            },
            orderBy: {
                fecha: 'asc'
            }
        });

        for (const mov of movimientosFacturas) {
            if (mov.descripcion.includes('FAC-2025-00103') || mov.descripcion.includes('FAC-2025-00105')) {
                console.log(`\n   ${mov.tipo === 'ingreso' ? '➕' : '➖'} ${mov.descripcion}`);
                console.log(`      Monto: $${parseFloat(mov.monto).toFixed(2)}`);
                console.log(`      Fecha: ${mov.fecha.toISOString().split('T')[0]}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verificarBalance();
