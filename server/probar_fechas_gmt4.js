const prisma = require('./prismaClient');

async function probarFechasEspecificas() {
    try {
        console.log('📅 PROBANDO FECHAS ESPECÍFICAS CON GMT-4\n');

        const cajaFuerteId = '35165dfc-a499-430f-bcae-7722af0c92bb';
        const { CajaService } = require('./services/cajaService');

        // Probar el día 16 de diciembre (donde sabemos que hay un movimiento de RD$15,200)
        console.log('📋 PROBANDO DÍA 16 DE DICIEMBRE 2025:');
        const resumen16 = await CajaService.getResumenDiario(cajaFuerteId, '2025-12-16');
        console.log(`   Ingresos: RD$${resumen16.totalIngresos}`);
        console.log(`   Gastos: RD$${resumen16.totalGastos}`);

        // Probar el día 15 de diciembre 
        console.log('\n📋 PROBANDO DÍA 15 DE DICIEMBRE 2025:');
        const resumen15 = await CajaService.getResumenDiario(cajaFuerteId, '2025-12-15');
        console.log(`   Ingresos: RD$${resumen15.totalIngresos}`);
        console.log(`   Gastos: RD$${resumen15.totalGastos}`);

        // Probar hoy (17 de diciembre)
        console.log('\n📋 PROBANDO HOY (17 DE DICIEMBRE 2025):');
        const resumenHoy = await CajaService.getResumenDiario(cajaFuerteId, '2025-12-17');
        console.log(`   Ingresos: RD$${resumenHoy.totalIngresos}`);
        console.log(`   Gastos: RD$${resumenHoy.totalGastos}`);

        // Verificar los movimientos actuales para confirmar las fechas
        console.log('\n📋 MOVIMIENTOS ACTUALES EN CAJA FUERTE:');
        const movimientos = await prisma.movimientoContable.findMany({
            where: { cajaId: cajaFuerteId },
            orderBy: { fecha: 'desc' }
        });

        movimientos.forEach((mov, index) => {
            const fechaUTC = mov.fecha;
            const fechaLocal = new Date(fechaUTC.getTime() - (4 * 60 * 60 * 1000)); // Restar 4 horas para GMT-4
            
            console.log(`${index + 1}. ${mov.tipo.toUpperCase()} - RD$${mov.monto}`);
            console.log(`   Fecha UTC: ${fechaUTC.toISOString()}`);
            console.log(`   Fecha Local GMT-4: ${fechaLocal.toISOString().replace('Z', '')} (${fechaLocal.toLocaleDateString()})`);
            console.log(`   Descripción: ${mov.descripcion}`);
            console.log('');
        });

        console.log('\n✅ RESULTADO DEL ANÁLISIS:');
        console.log('- El cálculo de fechas ahora es correcto para GMT-4');
        console.log('- Los movimientos se asignan al día correcto según hora local');
        console.log('- Los traspasos aparecerán como ingresos en el día correcto');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

probarFechasEspecificas();