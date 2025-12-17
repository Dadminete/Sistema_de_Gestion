const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const movimientoContableService = require('../services/movimientoContableService');

async function fixMissingMovimientos() {
    try {
        console.log('=== REPARANDO MOVIMIENTOS CONTABLES FALTANTES ===\n');

        // 1. Obtener todos los pagos
        const pagos = await prisma.pagoCliente.findMany({
            include: {
                factura: {
                    select: {
                        numeroFactura: true
                    }
                }
            },
            orderBy: {
                fechaPago: 'asc'
            }
        });

        console.log(`Total de pagos a verificar: ${pagos.length}\n`);

        // 2. Para cada pago, verificar si existe un movimiento contable
        let fixed = 0;
        let skipped = 0;

        for (const pago of pagos) {
            // Skip if factura is null
            if (!pago.factura) {
                console.log(`⚠ Pago ${pago.numeroPago} no tiene factura asociada. Saltando...`);
                skipped++;
                continue;
            }

            // Buscar movimiento contable relacionado
            const movimientoExistente = await prisma.movimientoContable.findFirst({
                where: {
                    descripcion: {
                        contains: pago.factura.numeroFactura
                    },
                    monto: Number(pago.monto),
                    tipo: 'ingreso'
                }
            });

            if (movimientoExistente) {
                console.log(`✓ Pago ${pago.numeroPago} ya tiene movimiento contable`);
                skipped++;
                continue;
            }

            // No existe movimiento, crearlo
            console.log(`✗ Pago ${pago.numeroPago} NO tiene movimiento contable. Creando...`);

            // Obtener categoría de ingreso
            let categoria = await prisma.categoriaCuenta.findFirst({
                where: {
                    OR: [
                        { nombre: { contains: 'Servicios', mode: 'insensitive' } },
                        { nombre: { contains: 'Ventas', mode: 'insensitive' } },
                        { nombre: { contains: 'Ingresos', mode: 'insensitive' } }
                    ],
                    tipo: 'ingreso'
                }
            });

            if (!categoria) {
                categoria = await prisma.categoriaCuenta.findFirst({
                    where: { tipo: 'ingreso' }
                });
            }

            if (!categoria) {
                console.log(`  ERROR: No se encontró categoría de ingreso. Saltando...`);
                continue;
            }

            // Determinar método y cajaId
            const metodoNormalizado = pago.metodoPago.toLowerCase().trim();
            let metodoMovimiento = 'caja';
            let cajaIdFinal = pago.cajaId;

            if (metodoNormalizado === 'transferencia' || metodoNormalizado === 'cheque' || metodoNormalizado === 'tarjeta' || metodoNormalizado === 'banco') {
                metodoMovimiento = 'banco';
            }

            // Si es caja y no tiene cajaId, buscar Caja Principal
            if (metodoMovimiento === 'caja' && !cajaIdFinal) {
                const cajaPrincipal = await prisma.caja.findFirst({
                    where: {
                        OR: [
                            { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
                            { tipo: 'general' }
                        ],
                        activa: true
                    }
                });
                if (cajaPrincipal) {
                    cajaIdFinal = cajaPrincipal.id;
                }
            }

            // Crear movimiento contable
            try {
                await movimientoContableService.createMovimiento({
                    tipo: 'ingreso',
                    monto: Number(pago.monto),
                    categoriaId: categoria.id,
                    metodo: metodoMovimiento,
                    cajaId: cajaIdFinal || undefined,
                    cuentaBancariaId: pago.cuentaBancariaId || undefined,
                    descripcion: `Pago Factura #${pago.factura.numeroFactura} - ${pago.metodoPago} (REPARADO)`,
                    usuarioId: pago.recibidoPorId
                });

                console.log(`  ✓ Movimiento contable creado exitosamente`);
                console.log(`    Monto: RD$${Number(pago.monto)}`);
                console.log(`    Método: ${metodoMovimiento}`);
                console.log(`    CajaID: ${cajaIdFinal || 'NULL'}`);
                fixed++;
            } catch (error) {
                console.log(`  ERROR al crear movimiento: ${error.message}`);
            }

            console.log('');
        }

        console.log('\n=== RESUMEN ===');
        console.log(`Pagos verificados: ${pagos.length}`);
        console.log(`Movimientos ya existentes: ${skipped}`);
        console.log(`Movimientos creados: ${fixed}`);

    } catch (error) {
        console.error('Error general:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixMissingMovimientos();
