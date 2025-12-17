const prisma = require('./prismaClient');

async function diagnosticoCajaFuerte() {
    try {
        console.log('🔍 DIAGNÓSTICO CAJA FUERTE - PROBLEMA HISTORIAL DE OPERACIONES\n');

        // 1. Buscar la caja fuerte
        const cajaFuerte = await prisma.caja.findFirst({
            where: {
                OR: [
                    { nombre: { contains: 'Fuerte', mode: 'insensitive' } },
                    { nombre: { contains: 'fuerte', mode: 'insensitive' } },
                    { tipo: 'fuerte' }
                ]
            }
        });

        if (!cajaFuerte) {
            console.log('❌ No se encontró caja fuerte');
            return;
        }

        console.log(`📦 CAJA FUERTE ENCONTRADA:`);
        console.log(`   Nombre: ${cajaFuerte.nombre}`);
        console.log(`   ID: ${cajaFuerte.id}`);
        console.log(`   Tipo: ${cajaFuerte.tipo}`);
        console.log(`   Saldo Inicial: RD$${cajaFuerte.saldoInicial}`);
        console.log(`   Saldo Actual: RD$${cajaFuerte.saldoActual}`);

        // 2. Buscar movimientos contables de hoy
        const hoy = new Date();
        const inicioDelDia = new Date(hoy);
        inicioDelDia.setHours(0, 0, 0, 0);
        
        const finDelDia = new Date(hoy);
        finDelDia.setHours(23, 59, 59, 999);

        const movimientosHoy = await prisma.movimientoContable.findMany({
            where: {
                cajaId: cajaFuerte.id,
                fecha: {
                    gte: inicioDelDia,
                    lte: finDelDia
                }
            },
            orderBy: { fecha: 'desc' }
        });

        console.log(`\n📋 MOVIMIENTOS DE HOY (${hoy.toISOString().split('T')[0]}):`);
        console.log(`   Total encontrados: ${movimientosHoy.length}`);

        let ingresosHoy = 0;
        let gastosHoy = 0;

        movimientosHoy.forEach((mov, index) => {
            const monto = parseFloat(mov.monto);
            console.log(`   ${index + 1}. ${mov.tipo.toUpperCase()} - RD$${monto} - ${mov.descripcion || 'Sin descripción'}`);
            console.log(`      Método: ${mov.metodo} | Fecha: ${mov.fecha?.toISOString() || 'Sin fecha'}`);
            
            if (mov.tipo === 'ingreso') {
                ingresosHoy += monto;
            } else if (mov.tipo === 'gasto') {
                gastosHoy += monto;
            }
        });

        console.log(`\n💰 RESUMEN DEL DÍA:`);
        console.log(`   Ingresos: RD$${ingresosHoy}`);
        console.log(`   Gastos: RD$${gastosHoy}`);
        console.log(`   Balance: RD$${ingresosHoy - gastosHoy}`);

        // 3. Verificar traspasos que involucran la caja fuerte
        const traspasosHoy = await prisma.traspaso.findMany({
            where: {
                OR: [
                    { cajaOrigenId: cajaFuerte.id },
                    { cajaDestinoId: cajaFuerte.id }
                ],
                fechaTraspaso: {
                    gte: inicioDelDia,
                    lte: finDelDia
                }
            },
            include: {
                cajaOrigen: { select: { nombre: true } },
                cajaDestino: { select: { nombre: true } }
            }
        });

        console.log(`\n🔄 TRASPASOS DE HOY QUE INVOLUCRAN CAJA FUERTE:`);
        console.log(`   Total encontrados: ${traspasosHoy.length}`);

        traspasosHoy.forEach((traspaso, index) => {
            const esOrigen = traspaso.cajaOrigenId === cajaFuerte.id;
            const esDestino = traspaso.cajaDestinoId === cajaFuerte.id;
            const direccion = esOrigen ? 'SALIDA' : esDestino ? 'ENTRADA' : 'UNKNOWN';
            
            console.log(`   ${index + 1}. ${direccion} - RD$${traspaso.monto}`);
            console.log(`      De: ${traspaso.cajaOrigen?.nombre || 'N/A'} → Para: ${traspaso.cajaDestino?.nombre || 'N/A'}`);
            console.log(`      Número: ${traspaso.numeroTraspaso} | Concepto: ${traspaso.conceptoTraspaso}`);
            console.log(`      Fecha: ${traspaso.fechaTraspaso?.toISOString() || 'Sin fecha'}`);
        });

        // 4. Verificar los últimos cierres de caja
        const ultimosCierres = await prisma.cierreCaja.findMany({
            where: { cajaId: cajaFuerte.id },
            orderBy: { fechaCierre: 'desc' },
            take: 5,
            include: {
                usuario: { select: { nombre: true, apellido: true } }
            }
        });

        console.log(`\n🔐 ÚLTIMOS 5 CIERRES DE CAJA FUERTE:`);
        ultimosCierres.forEach((cierre, index) => {
            console.log(`   ${index + 1}. Fecha: ${cierre.fechaCierre?.toISOString().split('T')[0] || 'Sin fecha'}`);
            console.log(`      Monto Final: RD$${cierre.montoFinal}`);
            console.log(`      Ingresos del Día: RD$${cierre.ingresosDelDia || 0}`);
            console.log(`      Gastos del Día: RD$${cierre.gastosDelDia || 0}`);
            console.log(`      Usuario: ${cierre.usuario?.nombre} ${cierre.usuario?.apellido}`);
        });

        // 5. Probar la función getResumenDiario
        console.log(`\n🧮 PROBANDO FUNCIÓN getResumenDiario:`);
        const { CajaService } = require('./services/cajaService');
        
        try {
            const resumen = await CajaService.getResumenDiario(cajaFuerte.id, hoy.toISOString().split('T')[0]);
            console.log(`   Resultado:`);
            console.log(`     Total Ingresos: RD$${resumen.totalIngresos}`);
            console.log(`     Total Gastos: RD$${resumen.totalGastos}`);
            
            // Comparar con el cálculo manual
            const diferencia = Math.abs(resumen.totalIngresos - ingresosHoy);
            if (diferencia > 0.01) {
                console.log(`   ⚠️ DIFERENCIA DETECTADA:`);
                console.log(`     Cálculo manual: RD$${ingresosHoy}`);
                console.log(`     getResumenDiario: RD$${resumen.totalIngresos}`);
                console.log(`     Diferencia: RD$${diferencia}`);
            } else {
                console.log(`   ✅ Los cálculos coinciden`);
            }
        } catch (error) {
            console.log(`   ❌ Error al ejecutar getResumenDiario: ${error.message}`);
        }

    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnosticoCajaFuerte();