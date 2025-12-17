// Script para limpiar UUIDs corruptos en la tabla suscripcion
// Ejecutar con: node server/scripts/cleanCorruptedUUIDs.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function cleanCorruptedUUIDs() {
    console.log('🔍 Buscando suscripciones con UUIDs corruptos...\n');

    try {
        // Obtener todas las suscripciones
        const allSuscripciones = await prisma.$queryRaw`
            SELECT id, "cliente_id" as "clienteId", "servicio_id" as "servicioId", "plan_id" as "planId", estado 
            FROM suscripciones
        `;

        console.log(`📊 Total de suscripciones encontradas: ${allSuscripciones.length}\n`);

        let corruptedCount = 0;
        const corruptedIds = [];

        for (const sub of allSuscripciones) {
            let isCorrupted = false;
            const issues = [];

            // Verificar clienteId
            if (sub.clienteId && !uuidRegex.test(sub.clienteId)) {
                issues.push(`clienteId inválido: ${sub.clienteId}`);
                isCorrupted = true;
            }

            // Verificar servicioId
            if (sub.servicioId && !uuidRegex.test(sub.servicioId)) {
                issues.push(`servicioId inválido: ${sub.servicioId}`);
                isCorrupted = true;
            }

            // Verificar planId
            if (sub.planId && !uuidRegex.test(sub.planId)) {
                issues.push(`planId inválido: ${sub.planId}`);
                isCorrupted = true;
            }

            if (isCorrupted) {
                corruptedCount++;
                corruptedIds.push(sub.id);
                console.log(`❌ Suscripción corrupta encontrada:`);
                console.log(`   ID: ${sub.id}`);
                console.log(`   Estado: ${sub.estado}`);
                issues.forEach(issue => console.log(`   - ${issue}`));
                console.log('');
            }
        }

        if (corruptedCount === 0) {
            console.log('✅ No se encontraron suscripciones con UUIDs corruptos.\n');
            return;
        }

        console.log(`\n⚠️  Se encontraron ${corruptedCount} suscripciones corruptas.\n`);
        console.log('🗑️  Eliminando suscripciones corruptas...\n');

        // Eliminar suscripciones corruptas
        for (const id of corruptedIds) {
            try {
                await prisma.$executeRaw`DELETE FROM suscripciones WHERE id = ${id}`;
                console.log(`   ✓ Eliminada suscripción: ${id}`);
            } catch (error) {
                console.error(`   ✗ Error al eliminar suscripción ${id}:`, error.message);
            }
        }

        console.log(`\n✅ Limpieza completada. ${corruptedCount} suscripciones eliminadas.\n`);

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ejecutar el script
cleanCorruptedUUIDs()
    .then(() => {
        console.log('🎉 Script finalizado exitosamente.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
