const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const CajaService = require('../services/cajaService');

async function fixOrphanedCajaMovimientos() {
    try {
        console.log('=== BUSCANDO MOVIMIENTOS DE CAJA SIN cajaId ===\n');

        // Buscar movimientos con método 'caja' pero sin cajaId
        const orphanedMovimientos = await prisma.movimientoContable.findMany({
            where: {
                metodo: 'caja',
                cajaId: null
            }
        });

        console.log(`Movimientos huérfanos encontrados: ${orphanedMovimientos.length}\n`);

        if (orphanedMovimientos.length === 0) {
            console.log('No hay movimientos huérfanos para corregir.');
            return;
        }

        // Obtener Caja Principal
        const cajaPrincipal = await prisma.caja.findFirst({
            where: {
                OR: [
                    { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
                    { tipo: 'general' }
                ],
                activa: true
            }
        });

        if (!cajaPrincipal) {
            console.log('ERROR: No se encontró Caja Principal');
            return;
        }

        console.log(`Caja Principal encontrada: ${cajaPrincipal.nombre} (${cajaPrincipal.id})\n`);

        // Corregir cada movimiento
        for (const mov of orphanedMovimientos) {
            console.log(`Corrigiendo movimiento:`);
            console.log(`  ID: ${mov.id}`);
            console.log(`  Descripción: ${mov.descripcion}`);
            console.log(`  Monto: RD$${Number(mov.monto)}`);
            console.log(`  Tipo: ${mov.tipo}`);

            await prisma.movimientoContable.update({
                where: { id: mov.id },
                data: { cajaId: cajaPrincipal.id }
            });

            console.log(`  ✓ cajaId asignado\n`);
        }

        // Recalcular saldo de la caja
        console.log('Recalculando saldo de Caja Principal...');
        const nuevoSaldo = await CajaService.recalculateAndUpdateSaldo(cajaPrincipal.id);
        console.log(`✓ Nuevo saldo: RD$${nuevoSaldo}`);

        console.log(`\n=== RESUMEN ===`);
        console.log(`Movimientos corregidos: ${orphanedMovimientos.length}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixOrphanedCajaMovimientos();
