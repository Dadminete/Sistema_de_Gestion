require('dotenv').config({ path: './server/.env' });
const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function ajustarSaldoCaja() {
    try {
        console.log('=== Ajustando Saldo de Caja Principal ===\n');

        const cajaPrincipal = await prisma.caja.findFirst({
            where: { nombre: 'Caja Principal' }
        });

        if (!cajaPrincipal) {
            console.log('❌ Caja Principal no encontrada');
            return;
        }

        const saldoActual = parseFloat(cajaPrincipal.saldoActual);
        const saldoCorrecto = 17890.00;
        const diferencia = saldoActual - saldoCorrecto;

        console.log(`💰 Caja Principal`);
        console.log(`   Saldo Actual: $${saldoActual.toFixed(2)}`);
        console.log(`   Saldo Correcto: $${saldoCorrecto.toFixed(2)}`);
        console.log(`   Diferencia: $${diferencia.toFixed(2)}`);

        if (Math.abs(diferencia) < 0.01) {
            console.log(`\n✅ El saldo ya es correcto`);
            return;
        }

        // Actualizar saldo
        await prisma.caja.update({
            where: { id: cajaPrincipal.id },
            data: {
                saldoActual: saldoCorrecto
            }
        });

        console.log(`\n✅ Saldo actualizado a $${saldoCorrecto.toFixed(2)}`);
        console.log(`   Ajuste aplicado: -$${diferencia.toFixed(2)}\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

ajustarSaldoCaja();
