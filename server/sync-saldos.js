const prisma = require('./prismaClient');
const { CajaService } = require('./services/cajaService');

async function syncSaldos() {
    try {
        console.log('===== SINCRONIZANDO SALDOS DE CAJAS CON CUENTAS CONTABLES =====\n');

        const cajas = await prisma.caja.findMany({
            where: { activa: true }
        });

        for (const caja of cajas) {
            console.log(`Procesando: ${caja.nombre}`);

            // Recalcular saldo de la caja
            const saldoCaja = await CajaService.recalculateAndUpdateSaldo(caja.id);
            console.log(`  Saldo caja recalculado: RD$${saldoCaja}`);

            // Actualizar cuenta contable asociada
            if (caja.cuentaContableId) {
                await prisma.cuentaContable.update({
                    where: { id: caja.cuentaContableId },
                    data: { saldoActual: saldoCaja }
                });
                console.log(`  ✅ Cuenta contable actualizada: RD$${saldoCaja}\n`);
            } else {
                console.log(`  ⚠️ No tiene cuenta contable asociada\n`);
            }
        }

        console.log('===== VERIFICACIÓN FINAL =====');
        const cajasActualizadas = await prisma.caja.findMany({
            where: { activa: true },
            include: {
                cuentaContable: true
            }
        });

        for (const caja of cajasActualizadas) {
            console.log(`${caja.nombre}:`);
            console.log(`  Saldo Caja: RD$${caja.saldoActual}`);
            console.log(`  Saldo Cuenta Contable: RD$${caja.cuentaContable?.saldoActual || 'N/A'}`);
            const match = parseFloat(caja.saldoActual) === parseFloat(caja.cuentaContable?.saldoActual || 0);
            console.log(`  ${match ? '✅ SINCRONIZADO' : '❌ DESINCRONIZADO'}\n`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

syncSaldos();
