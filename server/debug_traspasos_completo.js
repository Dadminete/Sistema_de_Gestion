const prisma = require('./prismaClient');

async function debugTraspasosCajaFuerte() {
    try {
        console.log('🔧 DEBUG TRASPASOS CAJA FUERTE - SIMULACIÓN COMPLETA\n');

        const cajaFuerteId = '35165dfc-a499-430f-bcae-7722af0c92bb';
        
        console.log(`📋 Simulando llamada a getHistorial para Caja Fuerte (${cajaFuerteId}):\n`);

        // Reproducir exactamente la función getHistorial
        const aperturas = await prisma.aperturaCaja.findMany({
            where: { cajaId: cajaFuerteId },
            include: { usuario: { select: { nombre: true, apellido: true } } },
            orderBy: { fechaApertura: 'desc' },
        });

        const cierres = await prisma.cierreCaja.findMany({
            where: { cajaId: cajaFuerteId },
            include: { usuario: { select: { nombre: true, apellido: true } } },
            orderBy: { fechaCierre: 'desc' },
        });

        // Obtener traspasos donde esta caja es origen o destino
        const traspasos = await prisma.traspaso.findMany({
            where: {
                OR: [
                    { cajaOrigenId: cajaFuerteId },
                    { cajaDestinoId: cajaFuerteId }
                ]
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
            orderBy: { fechaTraspaso: 'desc' },
        });

        console.log(`🔍 RESULTADOS DE CONSULTAS:`);
        console.log(`   Aperturas: ${aperturas.length}`);
        console.log(`   Cierres: ${cierres.length}`);
        console.log(`   Traspasos: ${traspasos.length}\n`);

        console.log(`📊 DETALLE DE TRASPASOS ENCONTRADOS:\n`);

        traspasos.forEach((t, index) => {
            const esOrigen = t.cajaOrigenId === cajaFuerteId;
            const esDestino = t.cajaDestinoId === cajaFuerteId;
            
            let origen, destino, tipoTraspaso;
            
            if (t.cajaOrigen && t.cajaDestino) {
                // Traspaso entre cajas
                origen = t.cajaOrigen.nombre;
                destino = t.cajaDestino.nombre;
                tipoTraspaso = esOrigen ? 'Salida a Caja' : 'Entrada de Caja';
            } else if (t.cajaOrigen && t.cuentaBancariaDestino) {
                // De caja a banco
                origen = t.cajaOrigen.nombre;
                destino = `${t.cuentaBancariaDestino.bank.nombre} - ${t.cuentaBancariaDestino.numeroCuenta}`;
                tipoTraspaso = 'Salida a Banco';
            } else if (t.cuentaBancariaOrigen && t.cajaDestino) {
                // De banco a caja
                origen = `${t.cuentaBancariaOrigen.bank.nombre} - ${t.cuentaBancariaOrigen.numeroCuenta}`;
                destino = t.cajaDestino.nombre;
                tipoTraspaso = 'Entrada de Banco';
            }

            console.log(`${index + 1}. 🔄 Traspaso #${t.numeroTraspaso}`);
            console.log(`   📅 Fecha: ${t.fechaTraspaso.toISOString()}`);
            console.log(`   💰 Monto: RD$${t.monto} ${typeof t.monto === 'number' ? '✅' : '❌ NO ES NÚMERO'}`);
            console.log(`   🏷️  Tipo: ${tipoTraspaso}`);
            console.log(`   📍 Origen: ${origen || '❌ SIN ORIGEN'}`);
            console.log(`   🎯 Destino: ${destino || '❌ SIN DESTINO'}`);
            console.log(`   🔄 Es Origen: ${esOrigen ? '✅ SÍ' : '❌ NO'}`);
            console.log(`   ⬇️  Es Destino: ${esDestino ? '✅ SÍ' : '❌ NO'}`);
            console.log(`   👤 Usuario: ${t.autorizadoPor.nombre} ${t.autorizadoPor.apellido}`);
            console.log('');
        });

        // Simular el mapeo final como en el código
        console.log(`🎯 SIMULANDO MAPEO FINAL (como en getHistorial):\n`);

        const traspasosMapeados = traspasos.map(t => {
            const esOrigen = t.cajaOrigenId === cajaFuerteId;
            const esDestino = t.cajaDestinoId === cajaFuerteId;
            
            let origen, destino, tipoTraspaso;
            
            if (t.cajaOrigen && t.cajaDestino) {
                origen = t.cajaOrigen.nombre;
                destino = t.cajaDestino.nombre;
                tipoTraspaso = esOrigen ? 'Salida a Caja' : 'Entrada de Caja';
            } else if (t.cajaOrigen && t.cuentaBancariaDestino) {
                origen = t.cajaOrigen.nombre;
                destino = `${t.cuentaBancariaDestino.bank.nombre} - ${t.cuentaBancariaDestino.numeroCuenta}`;
                tipoTraspaso = 'Salida a Banco';
            } else if (t.cuentaBancariaOrigen && t.cajaDestino) {
                origen = `${t.cuentaBancariaOrigen.bank.nombre} - ${t.cuentaBancariaOrigen.numeroCuenta}`;
                destino = t.cajaDestino.nombre;
                tipoTraspaso = 'Entrada de Banco';
            }

            return {
                id: t.id,
                tipo: 'traspaso',
                fecha: t.fechaTraspaso,
                monto: t.monto,
                numeroTraspaso: t.numeroTraspaso,
                conceptoTraspaso: t.conceptoTraspaso,
                tipoTraspaso,
                origen,
                destino,
                esOrigen,
                esDestino,
                usuario: `${t.autorizadoPor.nombre} ${t.autorizadoPor.apellido}`,
                observaciones: t.conceptoTraspaso,
            };
        });

        traspasosMapeados.forEach((mapped, index) => {
            console.log(`${index + 1}. 🗂️  Objeto Mapeado:`);
            console.log(`   ▸ id: ${mapped.id}`);
            console.log(`   ▸ tipo: '${mapped.tipo}'`);
            console.log(`   ▸ fecha: ${mapped.fecha.toISOString()}`);
            console.log(`   ▸ monto: ${mapped.monto} (${typeof mapped.monto}) ${mapped.monto ? '✅' : '❌'}`);
            console.log(`   ▸ numeroTraspaso: '${mapped.numeroTraspaso}'`);
            console.log(`   ▸ tipoTraspaso: '${mapped.tipoTraspaso}'`);
            console.log(`   ▸ origen: '${mapped.origen}'`);
            console.log(`   ▸ destino: '${mapped.destino}'`);
            console.log(`   ▸ esOrigen: ${mapped.esOrigen}`);
            console.log(`   ▸ esDestino: ${mapped.esDestino}`);
            console.log(`   ▸ usuario: '${mapped.usuario}'`);
            console.log('');
        });

        // Verificar el historial final combinado
        const historial = [
            ...aperturas.map(a => ({
                id: a.id,
                tipo: 'apertura',
                fecha: a.fechaApertura,
                montoInicial: a.montoInicial,
                usuario: `${a.usuario.nombre} ${a.usuario.apellido}`,
                observaciones: a.observaciones,
            })),
            ...cierres.map(c => ({
                id: c.id,
                tipo: 'cierre',
                fecha: c.fechaCierre,
                montoFinal: c.montoFinal,
                ingresosDelDia: c.ingresosDelDia,
                gastosDelDia: c.gastosDelDia,
                usuario: `${c.usuario.nombre} ${c.usuario.apellido}`,
                observaciones: c.observaciones,
            })),
            ...traspasosMapeados,
        ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        console.log(`📊 HISTORIAL FINAL COMBINADO (${historial.length} registros):\n`);
        
        historial.slice(0, 5).forEach((h, index) => {
            console.log(`${index + 1}. ${h.tipo.toUpperCase()}`);
            if (h.tipo === 'traspaso') {
                console.log(`   💰 MONTO: ${h.monto ? `RD$${h.monto}` : '❌ SIN MONTO'}`);
                console.log(`   🔄 Tipo Traspaso: ${h.tipoTraspaso || '❌ SIN TIPO'}`);
                console.log(`   📍 ${h.origen} → ${h.destino}`);
            }
            console.log(`   📅 ${h.fecha.toISOString()}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error en debug:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugTraspasosCajaFuerte();