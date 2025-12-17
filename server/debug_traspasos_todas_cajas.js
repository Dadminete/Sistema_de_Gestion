const prisma = require('./prismaClient');

async function debugTraspasosPorCaja() {
    try {
        console.log('🔍 DEBUG TRASPASOS POR CADA CAJA\n');

        const CAJA_PRINCIPAL_ID = 'e6a3f6db-6df2-4d05-8413-b164d4f95560';
        const CAJA_FUERTE_ID = '35165dfc-a499-430f-bcae-7722af0c92bb';
        const PAPELERIA_ID = '76f92b6c-ab51-4784-a57c-16db4227fd9e';

        const cajas = [
            { nombre: 'Caja Principal', id: CAJA_PRINCIPAL_ID },
            { nombre: 'Caja Fuerte', id: CAJA_FUERTE_ID },
            { nombre: 'Papelería', id: PAPELERIA_ID }
        ];

        for (const caja of cajas) {
            console.log(`\n🏦 ===== ${caja.nombre.toUpperCase()} (${caja.id}) =====\n`);

            // Buscar traspasos donde esta caja es origen o destino
            const traspasos = await prisma.traspaso.findMany({
                where: {
                    OR: [
                        { cajaOrigenId: caja.id },
                        { cajaDestinoId: caja.id }
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
                take: 10
            });

            console.log(`📊 Traspasos encontrados: ${traspasos.length}\n`);

            if (traspasos.length === 0) {
                console.log('❌ NO SE ENCONTRARON TRASPASOS PARA ESTA CAJA\n');
                continue;
            }

            traspasos.forEach((t, index) => {
                const esOrigen = t.cajaOrigenId === caja.id;
                const esDestino = t.cajaDestinoId === caja.id;
                
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

                console.log(`${index + 1}. 🔄 Traspaso #${t.numeroTraspaso}`);
                console.log(`   📅 Fecha: ${t.fechaTraspaso.toISOString()}`);
                console.log(`   💰 Monto: RD$${t.monto}`);
                console.log(`   🏷️  Tipo: ${tipoTraspaso}`);
                console.log(`   📍 Origen: ${origen}`);
                console.log(`   🎯 Destino: ${destino}`);
                console.log(`   🔄 Es Origen: ${esOrigen ? '✅ SÍ' : '❌ NO'}`);
                console.log(`   ⬇️  Es Destino: ${esDestino ? '✅ SÍ' : '❌ NO'}`);
                console.log('');
            });

            // Simular el mapeo que hace getHistorial
            console.log(`🎯 SIMULANDO MAPEO PARA ${caja.nombre}:\n`);
            
            const traspasosMapeados = traspasos.map(t => {
                const esOrigen = t.cajaOrigenId === caja.id;
                const esDestino = t.cajaDestinoId === caja.id;
                
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
                    monto: parseFloat(t.monto),
                    numeroTraspaso: t.numeroTraspaso,
                    tipoTraspaso,
                    origen,
                    destino,
                    esOrigen,
                    esDestino,
                    usuario: `${t.autorizadoPor.nombre} ${t.autorizadoPor.apellido}`,
                };
            });

            traspasosMapeados.forEach((mapped, index) => {
                console.log(`${index + 1}. 📋 Objeto Mapeado:`);
                console.log(`   ▸ tipo: '${mapped.tipo}'`);
                console.log(`   ▸ monto: ${mapped.monto} (${typeof mapped.monto})`);
                console.log(`   ▸ tipoTraspaso: '${mapped.tipoTraspaso}'`);
                console.log(`   ▸ origen: '${mapped.origen}'`);
                console.log(`   ▸ destino: '${mapped.destino}'`);
                console.log(`   ▸ esOrigen: ${mapped.esOrigen}`);
                console.log(`   ▸ esDestino: ${mapped.esDestino}`);
                console.log('');
            });

            // Probar la función completa getHistorial
            console.log(`🔧 PROBANDO FUNCIÓN getHistorial COMPLETA:\n`);

            // Simular aperturas y cierres (pocos para simplificar)
            const aperturas = await prisma.aperturaCaja.findMany({
                where: { cajaId: caja.id },
                include: { usuario: { select: { nombre: true, apellido: true } } },
                orderBy: { fechaApertura: 'desc' },
                take: 2
            });

            const cierres = await prisma.cierreCaja.findMany({
                where: { cajaId: caja.id },
                include: { usuario: { select: { nombre: true, apellido: true } } },
                orderBy: { fechaCierre: 'desc' },
                take: 2
            });

            const historialCompleto = [
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
                    usuario: `${c.usuario.nombre} ${c.usuario.apellido}`,
                    observaciones: c.observaciones,
                })),
                ...traspasosMapeados,
            ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            console.log(`📈 HISTORIAL FINAL COMBINADO (${historialCompleto.length} registros):`);
            console.log(`   - Aperturas: ${aperturas.length}`);
            console.log(`   - Cierres: ${cierres.length}`);
            console.log(`   - Traspasos: ${traspasosMapeados.length}\n`);

            // Mostrar solo los primeros 5 registros
            historialCompleto.slice(0, 5).forEach((h, index) => {
                console.log(`${index + 1}. ${h.tipo.toUpperCase()}`);
                console.log(`   📅 ${h.fecha.toISOString()}`);
                if (h.tipo === 'traspaso') {
                    console.log(`   💰 ${h.monto ? `RD$${h.monto}` : 'SIN MONTO'}`);
                    console.log(`   🔄 ${h.tipoTraspaso}`);
                    console.log(`   📍 ${h.origen} → ${h.destino}`);
                }
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error en debug:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugTraspasosPorCaja();