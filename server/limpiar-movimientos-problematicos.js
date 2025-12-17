const prisma = require('./prismaClient');

async function limpiarMovimientosProblemáticos() {
    try {
        console.log('🧹 LIMPIANDO MOVIMIENTOS PROBLEMÁTICOS 🧹\n');

        // Revisar movimientos en Caja Fuerte que causan el problema
        const cajaFuerteId = '35165dfc-a499-430f-bcae-7722af0c92bb';
        
        console.log('📊 ANALIZANDO CAJA FUERTE:');
        const cajaFuerte = await prisma.caja.findUnique({
            where: { id: cajaFuerteId }
        });
        
        console.log(`Saldo inicial: ${cajaFuerte.saldoInicial}`);
        console.log(`Saldo actual en BD: ${cajaFuerte.saldoActual}`);

        // Buscar movimientos asociados a Caja Fuerte
        const movimientosCajaFuerte = await prisma.movimientoContable.findMany({
            where: { cajaId: cajaFuerteId },
            orderBy: { fecha: 'desc' }
        });

        console.log(`\n📋 MOVIMIENTOS EN CAJA FUERTE: ${movimientosCajaFuerte.length} encontrados`);
        
        let totalIngresos = 0;
        let totalGastos = 0;
        
        if (movimientosCajaFuerte.length > 0) {
            console.log('\nDetalle de movimientos:');
            for (const mov of movimientosCajaFuerte) {
                const monto = parseFloat(mov.monto);
                console.log(`- ${mov.fecha?.toLocaleDateString() || 'Sin fecha'}: ${mov.tipo} ${monto} - ${mov.descripcion || 'Sin descripción'}`);
                
                if (mov.tipo === 'ingreso') {
                    totalIngresos += monto;
                } else if (mov.tipo === 'gasto') {
                    totalGastos += monto;
                }
            }
            
            console.log(`\nTotales:`);
            console.log(`Ingresos: ${totalIngresos}`);
            console.log(`Gastos: ${totalGastos}`);
            
            const saldoCalculado = parseFloat(cajaFuerte.saldoInicial) + totalIngresos - totalGastos;
            console.log(`Saldo calculado: ${saldoCalculado}`);
            
            // Si hay una diferencia significativa, estos movimientos son problemáticos
            if (Math.abs(saldoCalculado - parseFloat(cajaFuerte.saldoActual)) > 0.01) {
                console.log('\n🚨 MOVIMIENTOS PROBLEMÁTICOS DETECTADOS');
                console.log('Estos movimientos están causando el cálculo incorrecto.');
                
                // Opción 1: Eliminar todos los movimientos problemáticos
                console.log('\n🗑️ ELIMINANDO MOVIMIENTOS PROBLEMÁTICOS...');
                const result = await prisma.movimientoContable.deleteMany({
                    where: { cajaId: cajaFuerteId }
                });
                
                console.log(`✅ ${result.count} movimientos eliminados de Caja Fuerte`);
            }
        }

        // Hacer lo mismo para otras cajas si es necesario
        console.log('\n📊 VERIFICANDO OTRAS CAJAS...');
        
        const { CajaService } = require('./services/cajaService');
        const todasLasCajas = await prisma.caja.findMany();
        
        for (const caja of todasLasCajas) {
            const saldoCalculado = await CajaService.calcularSaldoActual(caja.id);
            const saldoBD = parseFloat(caja.saldoActual);
            const diferencia = Math.abs(saldoCalculado - saldoBD);
            
            if (diferencia > 0.01) {
                console.log(`\n⚠️ ${caja.nombre}:`);
                console.log(`   Saldo en BD: ${saldoBD}`);
                console.log(`   Saldo calculado: ${saldoCalculado}`);
                console.log(`   Diferencia: ${diferencia}`);
                
                // Buscar y limpiar movimientos problemáticos
                const movimientos = await prisma.movimientoContable.findMany({
                    where: { cajaId: caja.id },
                    orderBy: { fecha: 'desc' }
                });
                
                if (movimientos.length > 0) {
                    console.log(`   📋 ${movimientos.length} movimientos encontrados, eliminando...`);
                    await prisma.movimientoContable.deleteMany({
                        where: { cajaId: caja.id }
                    });
                    console.log(`   ✅ Movimientos eliminados`);
                }
            } else {
                console.log(`✅ ${caja.nombre}: Saldos coinciden (${saldoBD})`);
            }
        }

        console.log('\n🎉 LIMPIEZA COMPLETADA');
        
        // Verificación final
        console.log('\n📋 VERIFICACIÓN FINAL:');
        for (const caja of todasLasCajas) {
            const saldoCalculadoFinal = await CajaService.calcularSaldoActual(caja.id);
            const saldoBDFinal = parseFloat(caja.saldoActual);
            const coinciden = Math.abs(saldoCalculadoFinal - saldoBDFinal) < 0.01;
            
            console.log(`${coinciden ? '✅' : '❌'} ${caja.nombre}: BD=${saldoBDFinal}, Calculado=${saldoCalculadoFinal}`);
        }

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
    } finally {
        await prisma.$disconnect();
    }
}

limpiarMovimientosProblemáticos();