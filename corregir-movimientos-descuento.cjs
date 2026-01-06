require('dotenv').config({ path: './server/.env' });
const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function corregirMovimientos() {
    try {
        console.log('=== Corrigiendo Movimientos Contables con Descuento ===\n');

        const movimientosIDs = [
            '682f0bd4-a9f1-43d5-93a1-1b1de96ea292', // FAC-2025-00103
            '8f6519c8-49bf-454e-b54e-59fe525f4c57'  // FAC-2025-00105
        ];

        for (const movId of movimientosIDs) {
            const movimiento = await prisma.movimientoContable.findUnique({
                where: { id: movId },
                include: {
                    caja: true
                }
            });

            if (!movimiento) {
                console.log(`❌ Movimiento ${movId} no encontrado\n`);
                continue;
            }

            console.log(`\n📊 Movimiento ID: ${movId}`);
            console.log(`   Descripción: ${movimiento.descripcion}`);
            console.log(`   Monto Actual: $${movimiento.monto.toFixed(2)}`);
            console.log(`   Caja: ${movimiento.caja ? movimiento.caja.nombre : 'N/A'}`);

            // El monto correcto es $1450 (debería haber sido $1500 - $50 descuento)
            const montoAnterior = parseFloat(movimiento.monto);
            const montoCorrecto = 1450.00;
            const diferencia = montoAnterior - montoCorrecto;

            console.log(`   Monto Correcto: $${montoCorrecto.toFixed(2)}`);
            console.log(`   Diferencia a ajustar: -$${diferencia.toFixed(2)}`);

            // Actualizar el movimiento
            await prisma.movimientoContable.update({
                where: { id: movId },
                data: {
                    monto: montoCorrecto
                }
            });

            console.log(`   ✅ Movimiento actualizado`);

            // Actualizar el saldo de la caja
            if (movimiento.cajaId) {
                const caja = await prisma.caja.findUnique({
                    where: { id: movimiento.cajaId }
                });

                if (caja) {
                    const saldoAnterior = parseFloat(caja.saldoActual);
                    const nuevoSaldo = saldoAnterior - diferencia;
                    
                    await prisma.caja.update({
                        where: { id: movimiento.cajaId },
                        data: {
                            saldoActual: nuevoSaldo
                        }
                    });

                    console.log(`   💰 Caja "${caja.nombre}"`);
                    console.log(`      Saldo Anterior: $${saldoAnterior.toFixed(2)}`);
                    console.log(`      Saldo Nuevo: $${nuevoSaldo.toFixed(2)}`);
                    console.log(`      Ajuste: -$${diferencia.toFixed(2)}`);
                }
            }

            console.log('\n' + '='.repeat(80));
        }

        // Mostrar saldo final de la caja
        const cajaPrincipal = await prisma.caja.findFirst({
            where: { nombre: 'Caja Principal' }
        });

        if (cajaPrincipal) {
            console.log(`\n💰 SALDO FINAL CAJA PRINCIPAL: $${parseFloat(cajaPrincipal.saldoActual).toFixed(2)}\n`);
        }

        console.log('✅ Corrección completada exitosamente\n');

    } catch (error) {
        console.error('❌ Error:', error);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

corregirMovimientos();
