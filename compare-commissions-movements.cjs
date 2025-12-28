const prisma = require('./server/prismaClient');

async function compareCommissionsAndMovements() {
    try {
        console.log('=== COMPARACIÓN: Comisiones vs Movimientos ===\n');

        // Obtener todas las comisiones pagadas
        const comisiones = await prisma.Comision.findMany({
            where: { estado: 'PAGADO' },
            orderBy: { fechaPago: 'desc' },
            include: {
                empleado: { select: { nombres: true, apellidos: true } },
                tipoComision: { select: { nombreTipo: true } }
            }
        });

        console.log(`Total comisiones pagadas: ${comisiones.length}\n`);

        for (const comision of comisiones) {
            const movimiento = await prisma.MovimientoContable.findFirst({
                where: {
                    AND: [
                        { descripcion: { contains: 'Pago comisión', mode: 'insensitive' } },
                        { descripcion: { contains: comision.empleado.nombres, mode: 'insensitive' } },
                        { descripcion: { contains: comision.tipoComision.nombreTipo, mode: 'insensitive' } }
                    ]
                }
            });

            const estado = movimiento ? '✅' : '❌';
            const montoMovimiento = movimiento ? movimiento.monto : 'N/A';
            const coincide = movimiento && Number(movimiento.monto) === Number(comision.montoComision) ? '✅' : '❌';

            console.log(`${estado} Comisión ID ${comision.id}`);
            console.log(`   Empleado: ${comision.empleado.nombres} ${comision.empleado.apellidos}`);
            console.log(`   Comisión Monto: ${comision.montoComision}`);
            console.log(`   Movimiento Monto: ${montoMovimiento}`);
            console.log(`   ¿Montos coinciden?: ${coincide}`);
            console.log('');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

compareCommissionsAndMovements();
