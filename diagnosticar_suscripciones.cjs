const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnosticarSuscripciones() {
    console.log('🔍 Iniciando diagnóstico de suscripciones...\n');

    try {
        // 1. Obtener todas las suscripciones activas
        const suscripciones = await prisma.suscripcion.findMany({
            where: {
                estado: 'activo'
            },
            include: {
                cliente: {
                    select: {
                        nombre: true,
                        apellidos: true,
                        codigoCliente: true
                    }
                },
                servicio: true,
                plan: true
            }
        });

        console.log(`📊 Total de suscripciones activas: ${suscripciones.length}\n`);

        // 2. Identificar suscripciones con problemas
        const problemasEncontrados = {
            sinPlan: [],
            sinServicio: [],
            planInvalido: [],
            servicioInvalido: []
        };

        for (const sub of suscripciones) {
            const clienteInfo = `${sub.cliente.nombre} ${sub.cliente.apellidos} (${sub.cliente.codigoCliente})`;

            // Verificar si tiene planId pero el plan no existe
            if (sub.planId && !sub.plan) {
                problemasEncontrados.planInvalido.push({
                    id: sub.id,
                    cliente: clienteInfo,
                    planId: sub.planId,
                    precioMensual: sub.precioMensual
                });
            }

            // Verificar si tiene servicioId pero el servicio no existe
            if (sub.servicioId && !sub.servicio) {
                problemasEncontrados.servicioInvalido.push({
                    id: sub.id,
                    cliente: clienteInfo,
                    servicioId: sub.servicioId,
                    precioMensual: sub.precioMensual
                });
            }

            // Verificar si no tiene ni plan ni servicio
            if (!sub.planId && !sub.servicioId) {
                problemasEncontrados.sinPlan.push({
                    id: sub.id,
                    cliente: clienteInfo,
                    precioMensual: sub.precioMensual
                });
            }
        }

        // 3. Mostrar resultados
        console.log('📋 RESULTADOS DEL DIAGNÓSTICO:\n');

        if (problemasEncontrados.planInvalido.length > 0) {
            console.log(`❌ Suscripciones con planId inválido: ${problemasEncontrados.planInvalido.length}`);
            problemasEncontrados.planInvalido.forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.cliente}`);
                console.log(`      - ID Suscripción: ${p.id}`);
                console.log(`      - Plan ID (inválido): ${p.planId}`);
                console.log(`      - Precio Mensual: RD$${p.precioMensual}`);
                console.log('');
            });
        }

        if (problemasEncontrados.servicioInvalido.length > 0) {
            console.log(`❌ Suscripciones con servicioId inválido: ${problemasEncontrados.servicioInvalido.length}`);
            problemasEncontrados.servicioInvalido.forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.cliente}`);
                console.log(`      - ID Suscripción: ${p.id}`);
                console.log(`      - Servicio ID (inválido): ${p.servicioId}`);
                console.log(`      - Precio Mensual: RD$${p.precioMensual}`);
                console.log('');
            });
        }

        if (problemasEncontrados.sinPlan.length > 0) {
            console.log(`⚠️  Suscripciones sin plan ni servicio: ${problemasEncontrados.sinPlan.length}`);
            problemasEncontrados.sinPlan.forEach((p, i) => {
                console.log(`   ${i + 1}. ${p.cliente}`);
                console.log(`      - ID Suscripción: ${p.id}`);
                console.log(`      - Precio Mensual: RD$${p.precioMensual}`);
                console.log('');
            });
        }

        const totalProblemas =
            problemasEncontrados.planInvalido.length +
            problemasEncontrados.servicioInvalido.length +
            problemasEncontrados.sinPlan.length;

        if (totalProblemas === 0) {
            console.log('✅ No se encontraron problemas en las suscripciones!\n');
        } else {
            console.log(`\n📌 Total de suscripciones con problemas: ${totalProblemas}`);
            console.log('\n💡 Para arreglar estos problemas, ejecuta: node reparar_suscripciones.cjs\n');
        }

        // Guardar reporte en archivo
        const reporte = {
            fecha: new Date().toISOString(),
            totalSuscripciones: suscripciones.length,
            problemasEncontrados,
            totalProblemas
        };

        const fs = require('fs');
        fs.writeFileSync(
            'diagnostico_suscripciones.json',
            JSON.stringify(reporte, null, 2)
        );
        console.log('📄 Reporte guardado en: diagnostico_suscripciones.json\n');

    } catch (error) {
        console.error('❌ Error durante el diagnóstico:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar diagnóstico
diagnosticarSuscripciones();
