const prisma = require('./server/prismaClient');

async function debugLatestCommission() {
    try {
        console.log('=== DEBUG: Comisión más reciente ===\n');

        // Obtener la comisión MÁS reciente pagada
        const ultimaComision = await prisma.Comision.findFirst({
            where: { estado: 'PAGADO' },
            orderBy: { fechaPago: 'desc' },
            include: {
                empleado: true,
                tipoComision: true
            }
        });

        if (ultimaComision) {
            console.log('Última comisión pagada:');
            console.log(`ID: ${ultimaComision.id}`);
            console.log(`Empleado: ${ultimaComision.empleado.nombres} ${ultimaComision.empleado.apellidos}`);
            console.log(`Tipo: ${ultimaComision.tipoComision.nombreTipo}`);
            console.log(`Monto: ${ultimaComision.montoComision}`);
            console.log(`Fecha Pago: ${ultimaComision.fechaPago}`);
            console.log(`Estado: ${ultimaComision.estado}`);

            console.log('\n=== Buscando MovimientoContable para esta comisión ===\n');

            // Buscar el movimiento exacto por descripción
            const movimiento = await prisma.MovimientoContable.findFirst({
                where: {
                    AND: [
                        { descripcion: { contains: 'Pago comisión', mode: 'insensitive' } },
                        { descripcion: { contains: ultimaComision.empleado.nombres, mode: 'insensitive' } },
                        { descripcion: { contains: ultimaComision.tipoComision.nombreTipo, mode: 'insensitive' } }
                    ]
                },
                include: { caja: true, categoria: true }
            });

            if (movimiento) {
                console.log('✅ Movimiento contable ENCONTRADO:');
                console.log(`ID: ${movimiento.id}`);
                console.log(`Monto: ${movimiento.monto}`);
                console.log(`Tipo: ${movimiento.tipo}`);
                console.log(`Caja: ${movimiento.caja?.nombre || 'SIN CAJA'}`);
                console.log(`Descripción: ${movimiento.descripcion}`);
            } else {
                console.log('❌ Movimiento contable NO ENCONTRADO para esta comisión');
                console.log('\nVerificando por monto y fecha cercana...');

                const movimientosPorMonto = await prisma.MovimientoContable.findMany({
                    where: {
                        monto: parseFloat(ultimaComision.montoComision),
                        tipo: 'gasto',
                        descripcion: { contains: 'comisión', mode: 'insensitive' }
                    },
                    include: { caja: true, categoria: true }
                });

                console.log(`Movimientos encontrados con monto ${ultimaComision.montoComision}:`, movimientosPorMonto.length);
                movimientosPorMonto.forEach(m => {
                    console.log(`- ${m.descripcion} | ${m.fecha}`);
                });
            }
        } else {
            console.log('No hay comisiones pagadas');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugLatestCommission();
