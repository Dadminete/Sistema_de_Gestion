const prisma = require('./prismaClient');

async function restaurarSaldosCorrectos() {
    try {
        console.log('🚨 RESTAURANDO SALDOS CORRECTOS DESPUÉS DEL BUG DE APERTURA 🚨\n');
        
        // Información del problema detectado hoy 15/12/2025 10:35:51
        const problemData = {
            fechaProblema: new Date('2025-12-15 10:35:51'),
            saldosAntesDelProblema: {
                'e6a3f6db-6df2-4d05-8413-b164d4f95560': { // Caja Principal
                    nombre: 'Caja Principal',
                    saldoInicialOriginal: 500,
                    saldoActualAntes: 500
                },
                '76f92b6c-ab51-4784-a57c-16db4227fd9e': { // Papelería
                    nombre: 'Papelería', 
                    saldoInicialOriginal: 2127,
                    saldoActualAntes: 2127
                },
                '35165dfc-a499-430f-bcae-7722af0c92bb': { // Caja Fuerte
                    nombre: 'Caja Fuerte',
                    saldoInicialOriginal: 450,
                    saldoActualAntes: 450
                }
            }
        };

        console.log('📋 DATOS DEL PROBLEMA:');
        console.log('Fecha del problema:', problemData.fechaProblema.toLocaleString());
        console.log('\nSaldos que debemos restaurar:');
        
        for (const [cajaId, info] of Object.entries(problemData.saldosAntesDelProblema)) {
            console.log(`- ${info.nombre}: ${info.saldoActualAntes}`);
        }

        console.log('\n🔍 ESTADO ACTUAL DE LAS CAJAS:');
        const cajasActuales = await prisma.caja.findMany({
            where: {
                id: {
                    in: Object.keys(problemData.saldosAntesDelProblema)
                }
            }
        });

        for (const caja of cajasActuales) {
            const info = problemData.saldosAntesDelProblema[caja.id];
            console.log(`\n${caja.nombre}:`);
            console.log(`  Saldo inicial: ${caja.saldoInicial} (original: ${info.saldoInicialOriginal})`);
            console.log(`  Saldo actual: ${caja.saldoActual} (debería ser: ${info.saldoActualAntes})`);
            console.log(`  Estado: ${caja.saldoActual == info.saldoActualAntes ? '✅ Correcto' : '❌ Incorrecto'}`);
        }

        console.log('\n🔧 RESTAURANDO SALDOS CORRECTOS...');

        for (const [cajaId, info] of Object.entries(problemData.saldosAntesDelProblema)) {
            console.log(`\nRestaurando ${info.nombre}...`);
            
            // Restaurar saldoInicial si fue cambiado
            await prisma.caja.update({
                where: { id: cajaId },
                data: {
                    saldoInicial: info.saldoInicialOriginal,
                    saldoActual: info.saldoActualAntes
                }
            });
            
            console.log(`✅ ${info.nombre} restaurada:`);
            console.log(`   Saldo inicial: ${info.saldoInicialOriginal}`);
            console.log(`   Saldo actual: ${info.saldoActualAntes}`);
        }

        console.log('\n🔧 RESTAURANDO CUENTAS CONTABLES ASOCIADAS...');
        
        // Restaurar las cuentas contables asociadas
        const cuentasContables = await prisma.cuentaContable.findMany({
            where: {
                id: {
                    in: [
                        '690c7df3-9de4-49b7-8069-bcd3e83dd8be', // Caja Principal
                        'b5757b6c-d95e-42f1-a739-7836c599daac', // Papelería  
                        '3df860f8-362f-42f9-a47f-6a94fd995d7f'  // Caja Fuerte
                    ]
                }
            },
            include: {
                cajas: true
            }
        });

        for (const cuenta of cuentasContables) {
            if (cuenta.cajas.length > 0) {
                const caja = cuenta.cajas[0];
                const info = problemData.saldosAntesDelProblema[caja.id];
                
                if (info) {
                    await prisma.cuentaContable.update({
                        where: { id: cuenta.id },
                        data: {
                            saldoInicial: info.saldoInicialOriginal,
                            saldoActual: info.saldoActualAntes
                        }
                    });
                    
                    console.log(`✅ Cuenta contable "${cuenta.nombre}" restaurada: ${info.saldoActualAntes}`);
                }
            }
        }

        console.log('\n🧹 LIMPIANDO APERTURAS PROBLEMÁTICAS...');
        
        // Eliminar las aperturas que causaron el problema (opcional)
        const aperturasProblematicas = await prisma.aperturaCaja.findMany({
            where: {
                fechaApertura: {
                    gte: new Date('2025-12-15 10:35:00'),
                    lte: new Date('2025-12-15 10:36:00')
                }
            }
        });

        console.log(`Encontradas ${aperturasProblematicas.length} aperturas del momento del problema`);
        
        // Comentar la siguiente línea si NO quieres eliminar las aperturas
        // await prisma.aperturaCaja.deleteMany({
        //     where: {
        //         fechaApertura: {
        //             gte: new Date('2025-12-15 10:35:00'),
        //             lte: new Date('2025-12-15 10:36:00')
        //         }
        //     }
        // });
        // console.log('✅ Aperturas problemáticas eliminadas');

        console.log('\n🎉 RESTAURACIÓN COMPLETADA!');
        console.log('\n📋 VERIFICACIÓN FINAL:');
        
        const cajasFinales = await prisma.caja.findMany({
            where: {
                id: {
                    in: Object.keys(problemData.saldosAntesDelProblema)
                }
            }
        });

        for (const caja of cajasFinales) {
            const info = problemData.saldosAntesDelProblema[caja.id];
            const estado = caja.saldoActual == info.saldoActualAntes ? '✅' : '❌';
            console.log(`${estado} ${caja.nombre}: ${caja.saldoActual} (esperado: ${info.saldoActualAntes})`);
        }

        console.log('\n🚀 El sistema de cajas está restaurado a su estado correcto anterior al problema.');

    } catch (error) {
        console.error('❌ Error durante la restauración:', error);
    } finally {
        await prisma.$disconnect();
    }
}

restaurarSaldosCorrectos();