const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando backfill de movimientos contables para pagos de clientes...');

    // 1. Obtener todos los pagos confirmados
    const pagos = await prisma.pagoCliente.findMany({
        where: {
            estado: 'confirmado'
        },
        include: {
            factura: true
        }
    });

    console.log(`Encontrados ${pagos.length} pagos confirmados.`);

    let creados = 0;
    let omitidos = 0;

    // 2. Obtener categoría por defecto
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
        console.error('No se encontró categoría de ingreso. Abortando.');
        return;
    }

    for (const pago of pagos) {
        // 3. Buscar si ya existe un movimiento contable para este pago
        const fechaPago = new Date(pago.fechaPago);
        const fechaInicio = new Date(fechaPago.getTime() - 60000);
        const fechaFin = new Date(fechaPago.getTime() + 60000);

        const movimientoExistente = await prisma.movimientoContable.findFirst({
            where: {
                monto: pago.monto,
                tipo: 'ingreso',
                fecha: {
                    gte: fechaInicio,
                    lte: fechaFin
                },
                OR: [
                    { descripcion: { contains: pago.numeroPago } },
                    { descripcion: { contains: `Factura #${pago.factura?.numeroFactura}` } }
                ]
            }
        });

        if (movimientoExistente) {
            omitidos++;
            continue;
        }

        // 4. Determinar método de movimiento
        const metodoNormalizado = pago.metodoPago.toLowerCase().trim();
        let metodoMovimiento = 'caja';
        if (['transferencia', 'cheque', 'tarjeta', 'banco'].includes(metodoNormalizado)) {
            metodoMovimiento = 'banco';
        }

        // 5. Resolver cajaId SOLO para pagos en efectivo
        let cajaId = undefined;
        if (metodoMovimiento === 'caja') {
            cajaId = pago.cajaId;
            if (!cajaId) {
                const cajaPrincipal = await prisma.caja.findFirst({
                    where: {
                        OR: [
                            { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
                            { tipo: 'general' }
                        ],
                        activa: true
                    }
                });
                if (cajaPrincipal) cajaId = cajaPrincipal.id;
            }
        }

        // 6. Resolver usuario
        let usuarioId = pago.recibidoPorId;
        if (!usuarioId) {
            const adminUser = await prisma.usuario.findFirst();
            if (adminUser) usuarioId = adminUser.id;
        }

        if (!usuarioId) {
            console.warn(`\nSkipping payment ${pago.numeroPago} - no user could be assigned.`);
            omitidos++;
            continue;
        }

        // 7. Crear movimiento contable
        await prisma.movimientoContable.create({
            data: {
                tipo: 'ingreso',
                monto: pago.monto,
                categoriaId: categoria.id,
                metodo: metodoMovimiento,
                cajaId: cajaId || undefined,
                cuentaBancariaId: pago.cuentaBancariaId || undefined,
                descripcion: `Pago Factura #${pago.factura?.numeroFactura || 'N/A'} - ${pago.metodoPago} (Backfill)`,
                fecha: pago.fechaPago,
                usuarioId: usuarioId
            }
        });

        creados++;
        process.stdout.write('.');
    }

    console.log('\nBackfill completado.');
    console.log(`Movimientos creados: ${creados}`);
    console.log(`Movimientos omitidos (ya existían): ${omitidos}`);
}

main()
    .catch(e => {
        console.error(e);
        const fs = require('fs');
        fs.writeFileSync('error.log', JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
