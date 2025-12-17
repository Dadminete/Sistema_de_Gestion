const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function pregunta(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function repararSuscripciones() {
    console.log('🔧 Iniciando reparación de suscripciones...\n');

    try {
        // 1. Cargar el reporte de diagnóstico
        const fs = require('fs');
        let reporte;
        try {
            const data = fs.readFileSync('diagnostico_suscripciones.json', 'utf8');
            reporte = JSON.parse(data);
        } catch (error) {
            console.log('⚠️  No se encontró el archivo de diagnóstico.');
            console.log('   Ejecuta primero: node diagnosticar_suscripciones.cjs\n');
            return;
        }

        console.log(`📋 Reporte cargado: ${reporte.totalProblemas} problemas encontrados\n`);

        if (reporte.totalProblemas === 0) {
            console.log('✅ No hay problemas que reparar!\n');
            return;
        }

        // 2. Obtener un plan/servicio genérico para asignar
        console.log('🔍 Buscando planes y servicios disponibles...\n');

        const planesDisponibles = await prisma.plan.findMany({
            where: { estado: 'activo' },
            take: 10
        });

        const serviciosDisponibles = await prisma.servicio.findMany({
            where: { estado: 'activo' },
            take: 10
        });

        if (planesDisponibles.length === 0 && serviciosDisponibles.length === 0) {
            console.log('❌ No hay planes ni servicios activos disponibles para asignar.');
            console.log('   Crea al menos un plan o servicio activo primero.\n');
            return;
        }

        console.log(`📦 Planes disponibles: ${planesDisponibles.length}`);
        planesDisponibles.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.nombre} - RD$${p.precio}/mes`);
        });

        console.log(`\n📦 Servicios disponibles: ${serviciosDisponibles.length}`);
        serviciosDisponibles.forEach((s, i) => {
            console.log(`   ${i + 1}. ${s.nombre} - RD$${s.precio}/mes`);
        });

        console.log('\n');

        // 3. Opciones de reparación
        console.log('OPCIONES DE REPARACIÓN:\n');
        console.log('1. Asignar un plan/servicio específico a todas las suscripciones con problemas');
        console.log('2. Limpiar los IDs inválidos (dejar planId y servicioId en NULL)');
        console.log('3. Desactivar las suscripciones con problemas');
        console.log('4. Cancelar\n');

        const opcion = await pregunta('Selecciona una opción (1-4): ');

        if (opcion === '4') {
            console.log('❌ Operación cancelada.\n');
            return;
        }

        let planIdAsignar = null;
        let servicioIdAsignar = null;

        if (opcion === '1') {
            const tipo = await pregunta('\n¿Asignar Plan (P) o Servicio (S)? ');

            if (tipo.toUpperCase() === 'P' && planesDisponibles.length > 0) {
                const indice = await pregunta(`Selecciona el número del plan (1-${planesDisponibles.length}): `);
                const idx = parseInt(indice) - 1;
                if (idx >= 0 && idx < planesDisponibles.length) {
                    planIdAsignar = planesDisponibles[idx].id;
                    console.log(`\n✅ Se asignará el plan: ${planesDisponibles[idx].nombre}\n`);
                }
            } else if (tipo.toUpperCase() === 'S' && serviciosDisponibles.length > 0) {
                const indice = await pregunta(`Selecciona el número del servicio (1-${serviciosDisponibles.length}): `);
                const idx = parseInt(indice) - 1;
                if (idx >= 0 && idx < serviciosDisponibles.length) {
                    servicioIdAsignar = serviciosDisponibles[idx].id;
                    console.log(`\n✅ Se asignará el servicio: ${serviciosDisponibles[idx].nombre}\n`);
                }
            }
        }

        // 4. Confirmar antes de proceder
        const confirmar = await pregunta('⚠️  ¿Estás seguro de continuar? (S/N): ');
        if (confirmar.toUpperCase() !== 'S') {
            console.log('❌ Operación cancelada.\n');
            return;
        }

        // 5. Aplicar reparaciones
        console.log('\n🔧 Aplicando reparaciones...\n');

        let reparadas = 0;
        const todasLasSuscripcionesConProblemas = [
            ...reporte.problemasEncontrados.planInvalido,
            ...reporte.problemasEncontrados.servicioInvalido,
            ...reporte.problemasEncontrados.sinPlan
        ];

        for (const problema of todasLasSuscripcionesConProblemas) {
            try {
                if (opcion === '1') {
                    // Asignar plan/servicio
                    await prisma.suscripcion.update({
                        where: { id: problema.id },
                        data: {
                            planId: planIdAsignar,
                            servicioId: servicioIdAsignar
                        }
                    });
                    console.log(`✅ Suscripción ${problema.id} actualizada`);
                } else if (opcion === '2') {
                    // Limpiar IDs inválidos
                    await prisma.suscripcion.update({
                        where: { id: problema.id },
                        data: {
                            planId: null,
                            servicioId: null
                        }
                    });
                    console.log(`✅ Suscripción ${problema.id} limpiada`);
                } else if (opcion === '3') {
                    // Desactivar
                    await prisma.suscripcion.update({
                        where: { id: problema.id },
                        data: {
                            estado: 'inactivo'
                        }
                    });
                    console.log(`✅ Suscripción ${problema.id} desactivada`);
                }
                reparadas++;
            } catch (error) {
                console.error(`❌ Error al reparar suscripción ${problema.id}:`, error.message);
            }
        }

        console.log(`\n✅ Reparación completada: ${reparadas}/${todasLasSuscripcionesConProblemas.length} suscripciones procesadas\n`);
        console.log('💡 Ejecuta nuevamente el diagnóstico para verificar: node diagnosticar_suscripciones.cjs\n');

    } catch (error) {
        console.error('❌ Error durante la reparación:', error);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

// Ejecutar reparación
repararSuscripciones();
