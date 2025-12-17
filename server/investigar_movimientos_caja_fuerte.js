const prisma = require('./prismaClient');

async function investigarMovimientosCajaFuerte() {
    try {
        console.log('🕵️ INVESTIGACIÓN PROFUNDA - MOVIMIENTOS CAJA FUERTE\n');

        const cajaFuerteId = '35165dfc-a499-430f-bcae-7722af0c92bb';
        
        // 1. Todos los movimientos de la caja fuerte
        const todosMovimientos = await prisma.movimientoContable.findMany({
            where: { cajaId: cajaFuerteId },
            orderBy: { fecha: 'desc' }
        });

        console.log(`📋 TODOS LOS MOVIMIENTOS EN CAJA FUERTE: ${todosMovimientos.length}`);
        
        let totalIngresos = 0;
        let totalGastos = 0;

        console.log('\nDetalle completo:');
        todosMovimientos.forEach((mov, index) => {
            const monto = parseFloat(mov.monto);
            const fecha = mov.fecha ? mov.fecha.toISOString() : 'SIN FECHA';
            
            console.log(`${index + 1}. ${mov.tipo.toUpperCase()} - RD$${monto}`);
            console.log(`   Fecha: ${fecha}`);
            console.log(`   Descripción: ${mov.descripcion || 'Sin descripción'}`);
            console.log(`   Método: ${mov.metodo}`);
            console.log(`   Creado: ${mov.createdAt ? mov.createdAt.toISOString() : 'SIN FECHA'}`);
            console.log('');

            if (mov.tipo === 'ingreso') {
                totalIngresos += monto;
            } else if (mov.tipo === 'gasto') {
                totalGastos += monto;
            }
        });

        console.log(`💰 TOTALES GENERALES:`);
        console.log(`   Ingresos: RD$${totalIngresos}`);
        console.log(`   Gastos: RD$${totalGastos}`);

        // 2. Analizar el rango de fechas del día de hoy
        const hoy = new Date();
        const inicioDelDia = new Date(hoy);
        inicioDelDia.setHours(0, 0, 0, 0);
        
        const finDelDia = new Date(hoy);
        finDelDia.setHours(23, 59, 59, 999);

        console.log(`\n📅 RANGO DE FECHAS ANALIZADO PARA HOY:`);
        console.log(`   Inicio del día: ${inicioDelDia.toISOString()}`);
        console.log(`   Fin del día: ${finDelDia.toISOString()}`);

        // 3. Buscar movimientos problemáticos con fechas nulas o incorrectas
        const movimientosConFechaNula = await prisma.movimientoContable.findMany({
            where: {
                cajaId: cajaFuerteId,
                fecha: null
            }
        });

        console.log(`\n🚨 MOVIMIENTOS CON FECHA NULL: ${movimientosConFechaNula.length}`);
        movimientosConFechaNula.forEach((mov, index) => {
            console.log(`   ${index + 1}. ${mov.tipo} - RD$${mov.monto} - ${mov.descripcion || 'Sin descripción'}`);
        });

        // 4. Buscar movimientos con fecha de hoy específicamente
        const movimientosHoyExacto = await prisma.movimientoContable.findMany({
            where: {
                cajaId: cajaFuerteId,
                fecha: {
                    gte: inicioDelDia,
                    lte: finDelDia
                }
            }
        });

        console.log(`\n📋 MOVIMIENTOS EXACTOS DE HOY: ${movimientosHoyExacto.length}`);

        // 5. Reproducir exactamente la consulta de getResumenDiario
        console.log(`\n🧮 REPRODUCIENDO CONSULTA getResumenDiario:`);
        
        const ingresos = await prisma.movimientoContable.aggregate({
            _sum: { monto: true },
            where: {
                cajaId: cajaFuerteId,
                tipo: 'ingreso',
                fecha: {
                    gte: inicioDelDia,
                    lte: finDelDia,
                },
            },
        });

        console.log(`   Resultado aggregate ingresos: ${JSON.stringify(ingresos)}`);

        // 6. Buscar todos los movimientos que coincidan con la consulta de ingresos
        const movimientosIngresosHoy = await prisma.movimientoContable.findMany({
            where: {
                cajaId: cajaFuerteId,
                tipo: 'ingreso',
                fecha: {
                    gte: inicioDelDia,
                    lte: finDelDia,
                },
            },
        });

        console.log(`\n📋 MOVIMIENTOS DE INGRESO QUE COINCIDEN:`);
        movimientosIngresosHoy.forEach((mov, index) => {
            console.log(`   ${index + 1}. RD$${mov.monto} - ${mov.descripcion || 'Sin descripción'}`);
            console.log(`      Fecha: ${mov.fecha ? mov.fecha.toISOString() : 'SIN FECHA'}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

investigarMovimientosCajaFuerte();