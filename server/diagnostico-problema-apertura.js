const prisma = require('./prismaClient');

async function diagnosticarProblemaApertura() {
    try {
        console.log('=== DIAGNÓSTICO DEL PROBLEMA DE APERTURA/CIERRE ===\n');

        // 1. Revisar las últimas aperturas
        console.log('1. ÚLTIMAS APERTURAS DE CAJA:');
        const aperturas = await prisma.aperturaCaja.findMany({
            include: {
                caja: true,
                usuario: true
            },
            orderBy: {
                fechaApertura: 'desc'
            },
            take: 10
        });

        for (const apertura of aperturas) {
            console.log(`\n--- APERTURA ---`);
            console.log(`Caja: ${apertura.caja?.nombre || 'N/A'}`);
            console.log(`Usuario: ${apertura.usuario?.nombre || 'N/A'}`);
            console.log(`Fecha apertura: ${apertura.fechaApertura}`);
            console.log(`Monto inicial: ${apertura.montoInicial}`);
            if (apertura.observaciones) {
                console.log(`Observaciones: ${apertura.observaciones}`);
            }
        }

        // 1.2. Revisar los últimos cierres
        console.log('\n\nÚLTIMOS CIERRES DE CAJA:');
        const cierres = await prisma.cierreCaja.findMany({
            include: {
                caja: true,
                usuario: true
            },
            orderBy: {
                fechaCierre: 'desc'
            },
            take: 10
        });

        for (const cierre of cierres) {
            console.log(`\n--- CIERRE ---`);
            console.log(`Caja: ${cierre.caja?.nombre || 'N/A'}`);
            console.log(`Usuario: ${cierre.usuario?.nombre || 'N/A'}`);
            console.log(`Fecha cierre: ${cierre.fechaCierre}`);
            console.log(`Monto final: ${cierre.montoFinal}`);
            console.log(`Ingresos del día: ${cierre.ingresosDelDia}`);
            console.log(`Gastos del día: ${cierre.gastosDelDia}`);
            if (cierre.observaciones) {
                console.log(`Observaciones: ${cierre.observaciones}`);
            }
        }

        // 2. Verificar las cuentas contables asociadas
        console.log('\n\n2. CUENTAS CONTABLES ASOCIADAS:');
        const cuentasContables = await prisma.cuentaContable.findMany({
            where: {
                OR: [
                    { nombre: { contains: 'Caja', mode: 'insensitive' } },
                    { nombre: { contains: 'Papelería', mode: 'insensitive' } }
                ]
            },
            include: {
                cajas: true
            }
        });

        for (const cuenta of cuentasContables) {
            console.log(`\n--- ${cuenta.nombre} ---`);
            console.log(`ID: ${cuenta.id}`);
            console.log(`Saldo inicial: ${cuenta.saldoInicial}`);
            console.log(`Saldo actual: ${cuenta.saldoActual}`);
            console.log(`Cajas asociadas: ${cuenta.cajas.map(c => c.nombre).join(', ')}`);
        }

        // 3. Revisar movimientos contables recientes del método 'caja'
        console.log('\n\n3. MOVIMIENTOS CONTABLES RECIENTES (método caja):');
        const movimientosContables = await prisma.movimientoContable.findMany({
            where: {
                metodo: 'caja'
            },
            orderBy: {
                fechaMovimiento: 'desc'
            },
            take: 20
        });

        for (const movimiento of movimientosContables) {
            console.log(`\n${movimiento.fechaMovimiento}: ${movimiento.tipo.toUpperCase()}`);
            console.log(`Monto: ${movimiento.monto}`);
            console.log(`Descripción: ${movimiento.descripcion || 'Sin descripción'}`);
        }

        // 4. Verificar asientos contables recientes que afecten cajas
        console.log('\n\n4. ASIENTOS CONTABLES QUE AFECTAN CAJAS:');
        const asientosRecientes = await prisma.asiento.findMany({
            where: {
                fechaCreacion: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
                }
            },
            include: {
                detalles: {
                    where: {
                        cajaId: {
                            not: null
                        }
                    },
                    include: {
                        caja: true
                    }
                }
            },
            orderBy: {
                fechaCreacion: 'desc'
            }
        });

        for (const asiento of asientosRecientes) {
            if (asiento.detalles.length > 0) {
                console.log(`\n--- Asiento ID: ${asiento.id} ---`);
                console.log(`Fecha: ${asiento.fechaCreacion}`);
                console.log(`Estado: ${asiento.estado}`);
                console.log(`Descripción: ${asiento.descripcion || 'Sin descripción'}`);
                
                for (const detalle of asiento.detalles) {
                    console.log(`  - ${detalle.caja?.nombre}: Debe ${detalle.debe} | Haber ${detalle.haber}`);
                }
            }
        }

        // 5. Revisar pagos y ventas recientes para identificar el problema
        console.log('\n\n5. ACTIVIDAD RECIENTE EN CAJAS:');
        
        const pagosRecientes = await prisma.pagoCliente.findMany({
            where: {
                fechaPago: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            },
            include: {
                caja: true
            },
            orderBy: {
                fechaPago: 'desc'
            },
            take: 10
        });

        console.log('Pagos recientes:');
        for (const pago of pagosRecientes) {
            console.log(`${pago.fechaPago}: ${pago.monto} en ${pago.caja?.nombre || 'Sin caja'} - Estado: ${pago.estado}`);
        }

        const ventasRecientes = await prisma.ventaPapeleria.findMany({
            where: {
                fechaVenta: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
            },
            include: {
                caja: true
            },
            orderBy: {
                fechaVenta: 'desc'
            },
            take: 10
        });

        console.log('\nVentas recientes:');
        for (const venta of ventasRecientes) {
            console.log(`${venta.fechaVenta}: ${venta.total} en ${venta.caja?.nombre || 'Sin caja'} - Estado: ${venta.estado}`);
        }

        // 6. Análisis del problema específico
        console.log('\n\n=== ANÁLISIS DEL PROBLEMA ===');
        
        const cajas = await prisma.caja.findMany();
        
        for (const caja of cajas) {
            const saldoInicial = parseFloat(caja.saldoInicial || 0);
            const saldoActual = parseFloat(caja.saldoActual || 0);
            const diferencia = saldoActual - saldoInicial;
            
            console.log(`\n${caja.nombre}:`);
            console.log(`  Saldo inicial: ${saldoInicial}`);
            console.log(`  Saldo actual: ${saldoActual}`);
            console.log(`  Diferencia: ${diferencia}`);
            
            if (diferencia < 0) {
                console.log(`  ⚠️ PROBLEMA: Saldo negativo de ${Math.abs(diferencia)}`);
            }
        }

    } catch (error) {
        console.error('Error en diagnóstico:', error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnosticarProblemaApertura();