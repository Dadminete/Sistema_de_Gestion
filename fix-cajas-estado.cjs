const prisma = require('./server/prismaClient');

async function diagnosticarYCorregirEstadoCajas() {
    try {
        console.log('🔍 Diagnosticando estado de cajas...\n');
        
        const cajas = await prisma.caja.findMany({
            where: { activa: true },
            orderBy: { nombre: 'asc' }
        });

        for (const caja of cajas) {
            console.log(`\n--- CAJA: ${caja.nombre} (ID: ${caja.id}) ---`);
            
            // Obtener última apertura
            const ultimaApertura = await prisma.aperturaCaja.findFirst({
                where: { cajaId: caja.id },
                orderBy: { fechaApertura: 'desc' }
            });
            
            if (!ultimaApertura) {
                console.log('  ✅ Sin aperturas previas - Estado: CERRADA');
                continue;
            }
            
            console.log(`  📅 Última apertura: ${ultimaApertura.fechaApertura.toLocaleString('es-ES')}`);
            
            // Buscar cierre posterior a la última apertura
            const cierrePosterior = await prisma.cierreCaja.findFirst({
                where: { 
                    cajaId: caja.id, 
                    fechaCierre: { gt: ultimaApertura.fechaApertura }
                },
                orderBy: { fechaCierre: 'desc' }
            });
            
            const estaAbierta = !cierrePosterior;
            
            if (estaAbierta) {
                console.log('  🟢 Estado: ABIERTA');
                console.log(`  💰 Monto inicial: $${ultimaApertura.montoInicial}`);
            } else {
                console.log('  🔴 Estado: CERRADA');
                console.log(`  📅 Último cierre: ${cierrePosterior.fechaCierre.toLocaleString('es-ES')}`);
                console.log(`  💰 Monto final: $${cierrePosterior.montoFinal}`);
            }
            
            // Verificar inconsistencias
            const aperturasSinCierre = await prisma.aperturaCaja.count({
                where: {
                    cajaId: caja.id,
                    AND: [
                        {
                            fechaApertura: {
                                not: {
                                    in: await prisma.cierreCaja.findMany({
                                        where: { cajaId: caja.id },
                                        select: { fechaCierre: true }
                                    }).then(cierres => cierres.map(c => c.fechaCierre))
                                }
                            }
                        }
                    ]
                }
            });
            
            if (aperturasSinCierre > 1) {
                console.log(`  ⚠️  ADVERTENCIA: ${aperturasSinCierre} aperturas sin cierre detectadas`);
            }
        }
        
        console.log('\n=== RESUMEN ===');
        const cajasAbiertas = [];
        const cajasCerradas = [];
        
        for (const caja of cajas) {
            const ultimaApertura = await prisma.aperturaCaja.findFirst({
                where: { cajaId: caja.id },
                orderBy: { fechaApertura: 'desc' }
            });
            
            if (!ultimaApertura) {
                cajasCerradas.push(caja.nombre);
                continue;
            }
            
            const cierrePosterior = await prisma.cierreCaja.findFirst({
                where: { 
                    cajaId: caja.id, 
                    fechaCierre: { gt: ultimaApertura.fechaApertura }
                }
            });
            
            if (!cierrePosterior) {
                cajasAbiertas.push(caja.nombre);
            } else {
                cajasCerradas.push(caja.nombre);
            }
        }
        
        console.log(`\n🟢 Cajas ABIERTAS (${cajasAbiertas.length}):`);
        cajasAbiertas.forEach(nombre => console.log(`   - ${nombre}`));
        
        console.log(`\n🔴 Cajas CERRADAS (${cajasCerradas.length}):`);
        cajasCerradas.forEach(nombre => console.log(`   - ${nombre}`));
        
        // Pregunta si el usuario quiere cerrar cajas problemáticas
        if (cajasAbiertas.length > 0) {
            console.log('\n⚠️  Si alguna de estas cajas abiertas debería estar cerrada, puede cerrarlas manualmente desde la interfaz.');
        }
        
    } catch (error) {
        console.error('❌ Error en diagnóstico:', error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnosticarYCorregirEstadoCajas();