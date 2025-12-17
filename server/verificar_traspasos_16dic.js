const prisma = require('./prismaClient');

async function verificarTraspasos16Dic() {
    try {
        console.log('🔍 VERIFICANDO TRASPASOS DEL 16/12/2024\n');

        const cajaFuerteId = '35165dfc-a499-430f-bcae-7722af0c92bb';
        
        // Crear fechas para el 16/12/2024 en GMT-4
        const fecha16Dic = new Date('2024-12-16');
        const inicioDelDia16 = new Date(fecha16Dic);
        inicioDelDia16.setHours(0, 0, 0, 0);
        
        const finDelDia16 = new Date(fecha16Dic);
        finDelDia16.setHours(23, 59, 59, 999);

        console.log(`📅 Buscando traspasos para el 16/12/2024:`);
        console.log(`   Inicio del día: ${inicioDelDia16.toISOString()}`);
        console.log(`   Fin del día: ${finDelDia16.toISOString()}\n`);

        // 1. Buscar todos los traspasos del 16 de diciembre
        const traspasosDel16 = await prisma.traspaso.findMany({
            where: {
                fechaTraspaso: {
                    gte: inicioDelDia16,
                    lte: finDelDia16
                }
            },
            include: {
                autorizadoPor: { select: { nombre: true, apellido: true } },
                cajaOrigen: { select: { nombre: true } },
                cajaDestino: { select: { nombre: true } },
                cuentaBancariaOrigen: { 
                    select: { 
                        numeroCuenta: true,
                        nombreOficialCuenta: true,
                        bank: { select: { nombre: true } }
                    } 
                },
                cuentaBancariaDestino: { 
                    select: { 
                        numeroCuenta: true,
                        nombreOficialCuenta: true,
                        bank: { select: { nombre: true } }
                    } 
                }
            },
            orderBy: { fechaTraspaso: 'desc' }
        });

        console.log(`📊 TRASPASOS ENCONTRADOS DEL 16/12/2024: ${traspasosDel16.length}\n`);

        traspasosDel16.forEach((traspaso, index) => {
            console.log(`${index + 1}. 💰 Traspaso #${traspaso.numeroTraspaso}`);
            console.log(`   Monto: RD$${traspaso.monto}`);
            console.log(`   Fecha: ${traspaso.fechaTraspaso.toISOString()}`);
            console.log(`   Concepto: ${traspaso.conceptoTraspaso || 'Sin concepto'}`);
            
            if (traspaso.cajaOrigen && traspaso.cajaDestino) {
                console.log(`   Tipo: Caja a Caja`);
                console.log(`   Origen: ${traspaso.cajaOrigen.nombre}`);
                console.log(`   Destino: ${traspaso.cajaDestino.nombre}`);
            } else if (traspaso.cajaOrigen && traspaso.cuentaBancariaDestino) {
                console.log(`   Tipo: Caja a Banco`);
                console.log(`   Origen: ${traspaso.cajaOrigen.nombre}`);
                console.log(`   Destino: ${traspaso.cuentaBancariaDestino.bank.nombre} - ${traspaso.cuentaBancariaDestino.numeroCuenta}`);
            } else if (traspaso.cuentaBancariaOrigen && traspaso.cajaDestino) {
                console.log(`   Tipo: Banco a Caja`);
                console.log(`   Origen: ${traspaso.cuentaBancariaOrigen.bank.nombre} - ${traspaso.cuentaBancariaOrigen.numeroCuenta}`);
                console.log(`   Destino: ${traspaso.cajaDestino.nombre}`);
            }
            
            console.log(`   Autorizado por: ${traspaso.autorizadoPor.nombre} ${traspaso.autorizadoPor.apellido}`);
            console.log('');
        });

        // 2. Buscar traspasos específicamente relacionados con caja fuerte
        const traspasosCajaFuerte = await prisma.traspaso.findMany({
            where: {
                OR: [
                    { cajaOrigenId: cajaFuerteId },
                    { cajaDestinoId: cajaFuerteId }
                ],
                fechaTraspaso: {
                    gte: inicioDelDia16,
                    lte: finDelDia16
                }
            },
            include: {
                autorizadoPor: { select: { nombre: true, apellido: true } },
                cajaOrigen: { select: { nombre: true } },
                cajaDestino: { select: { nombre: true } },
                cuentaBancariaOrigen: { 
                    select: { 
                        numeroCuenta: true,
                        nombreOficialCuenta: true,
                        bank: { select: { nombre: true } }
                    } 
                },
                cuentaBancariaDestino: { 
                    select: { 
                        numeroCuenta: true,
                        nombreOficialCuenta: true,
                        bank: { select: { nombre: true } }
                    } 
                }
            }
        });

        console.log(`🏛️ TRASPASOS DE CAJA FUERTE DEL 16/12/2024: ${traspasosCajaFuerte.length}\n`);

        traspasosCajaFuerte.forEach((traspaso, index) => {
            const esCajaFuerteOrigen = traspaso.cajaOrigenId === cajaFuerteId;
            const esCajaFuerteDestino = traspaso.cajaDestinoId === cajaFuerteId;
            
            console.log(`${index + 1}. 🔒 Traspaso Caja Fuerte #${traspaso.numeroTraspaso}`);
            console.log(`   Monto: RD$${traspaso.monto}`);
            console.log(`   Dirección: ${esCajaFuerteOrigen ? '🔴 SALIDA de Caja Fuerte' : '🔵 ENTRADA a Caja Fuerte'}`);
            console.log(`   Fecha: ${traspaso.fechaTraspaso.toISOString()}`);
            console.log('');
        });

        // 3. Buscar traspasos en cualquier fecha (últimos 10)
        console.log(`🔍 BUSCANDO ÚLTIMOS TRASPASOS EN CUALQUIER FECHA:\n`);
        
        const ultimosTraspasos = await prisma.traspaso.findMany({
            take: 10,
            orderBy: { fechaTraspaso: 'desc' },
            include: {
                autorizadoPor: { select: { nombre: true, apellido: true } },
                cajaOrigen: { select: { nombre: true } },
                cajaDestino: { select: { nombre: true } },
            }
        });

        console.log(`📋 Últimos 10 traspasos encontrados: ${ultimosTraspasos.length}\n`);
        
        ultimosTraspasos.forEach((traspaso, index) => {
            console.log(`${index + 1}. Traspaso #${traspaso.numeroTraspaso}`);
            console.log(`   Monto: RD$${traspaso.monto}`);
            console.log(`   Fecha: ${traspaso.fechaTraspaso.toISOString()}`);
            console.log(`   Origen: ${traspaso.cajaOrigen?.nombre || 'Banco'}`);
            console.log(`   Destino: ${traspaso.cajaDestino?.nombre || 'Banco'}`);
            console.log('');
        });

        // 4. Probar la función getHistorial para la caja fuerte
        console.log(`🔍 PROBANDO FUNCIÓN getHistorial PARA CAJA FUERTE:\n`);
        
        const cajaService = require('./services/cajaService');
        const historial = await cajaService.getHistorial(cajaFuerteId);
        
        // Filtrar solo los traspasos del historial
        const traspasosHistorial = historial.filter(h => h.tipo === 'traspaso');
        
        console.log(`📋 Traspasos en el historial: ${traspasosHistorial.length}\n`);
        
        traspasosHistorial.forEach((h, index) => {
            console.log(`${index + 1}. Traspaso en Historial:`);
            console.log(`   ID: ${h.id}`);
            console.log(`   Monto: ${h.monto ? `RD$${h.monto}` : 'MONTO FALTANTE ❌'}`);
            console.log(`   Fecha: ${h.fecha ? h.fecha.toISOString() : 'SIN FECHA ❌'}`);
            console.log(`   Tipo: ${h.tipoTraspaso || 'SIN TIPO ❌'}`);
            console.log(`   Número: ${h.numeroTraspaso || 'SIN NÚMERO ❌'}`);
            console.log(`   Origen: ${h.origen || 'SIN ORIGEN ❌'}`);
            console.log(`   Destino: ${h.destino || 'SIN DESTINO ❌'}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verificarTraspasos16Dic();