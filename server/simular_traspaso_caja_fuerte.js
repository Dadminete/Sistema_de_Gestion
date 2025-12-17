const prisma = require('./prismaClient');

async function simularTraspasoACajaFuerte() {
    try {
        console.log('🔄 SIMULANDO TRASPASO A CAJA FUERTE\n');

        const cajaFuerteId = '35165dfc-a499-430f-bcae-7722af0c92bb';
        
        // 1. Buscar otra caja para usar como origen
        const cajasDisponibles = await prisma.caja.findMany({
            where: {
                activa: true,
                id: { not: cajaFuerteId }
            }
        });

        if (cajasDisponibles.length === 0) {
            console.log('❌ No se encontraron cajas disponibles como origen');
            return;
        }

        const cajaOrigen = cajasDisponibles[0];
        console.log(`📦 Caja origen: ${cajaOrigen.nombre} (${cajaOrigen.id})`);

        // 2. Crear un movimiento contable simulando un traspaso
        const montoTraspaso = 500;
        const numeroTraspaso = `TR-TEST-${Date.now()}`;
        const conceptoTraspaso = 'Prueba de traspaso para verificar historial';

        console.log(`💰 Creando movimiento de ingreso en caja fuerte por RD$${montoTraspaso}...`);

        const movimientoIngreso = await prisma.movimientoContable.create({
            data: {
                tipo: 'ingreso',
                monto: montoTraspaso,
                descripcion: `Traspaso ${numeroTraspaso}: ${conceptoTraspaso}`,
                metodo: 'caja',
                cajaId: cajaFuerteId,
                usuarioId: 'd1f833ca-2b0b-4b1a-8032-8932e8a1b875', // ID del admin
                // Asegurar que tenga la fecha de hoy
                fecha: new Date()
            }
        });

        console.log('✅ Movimiento creado:');
        console.log(`   ID: ${movimientoIngreso.id}`);
        console.log(`   Tipo: ${movimientoIngreso.tipo}`);
        console.log(`   Monto: RD$${movimientoIngreso.monto}`);
        console.log(`   Fecha: ${movimientoIngreso.fecha.toISOString()}`);

        // 3. Verificar que aparezca en el resumen diario
        console.log('\n🧮 Verificando resumen diario después del traspaso...');
        
        const { CajaService } = require('./services/cajaService');
        const hoy = new Date().toISOString().split('T')[0];
        const resumen = await CajaService.getResumenDiario(cajaFuerteId, hoy);

        console.log('📊 Resultado del resumen diario:');
        console.log(`   Total Ingresos: RD$${resumen.totalIngresos}`);
        console.log(`   Total Gastos: RD$${resumen.totalGastos}`);

        // 4. Verificar en el historial de caja
        console.log('\n📋 Verificando historial de caja...');
        const historial = await CajaService.getHistorial(cajaFuerteId);
        
        console.log(`Historial de operaciones (últimas 3):`);
        historial.slice(0, 3).forEach((registro, index) => {
            console.log(`   ${index + 1}. ${registro.tipo.toUpperCase()} - ${registro.fecha}`);
            if (registro.ingresosDelDia) {
                console.log(`      Ingresos del día: RD$${registro.ingresosDelDia}`);
            }
            if (registro.gastosDelDia) {
                console.log(`      Gastos del día: RD$${registro.gastosDelDia}`);
            }
        });

        // 5. Verificar el saldo de la caja fuerte
        const cajaFuerteActualizada = await prisma.caja.findUnique({
            where: { id: cajaFuerteId }
        });

        console.log('\n💳 Estado actual de la caja fuerte:');
        console.log(`   Saldo anterior: RD$19100`);
        console.log(`   Saldo actual: RD$${cajaFuerteActualizada.saldoActual}`);
        console.log(`   Diferencia: RD$${cajaFuerteActualizada.saldoActual - 19100}`);

        console.log('\n✅ PRUEBA COMPLETADA - Verifica en la aplicación:');
        console.log('   1. Ve a http://172.16.0.23:5173/cajas/listado');
        console.log('   2. Selecciona la Caja Fuerte');
        console.log('   3. Ve a la pestaña "Historial de Operaciones"');
        console.log('   4. Verifica que los traspasos aparezcan como ingresos');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

simularTraspasoACajaFuerte();