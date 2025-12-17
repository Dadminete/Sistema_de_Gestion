const prisma = require('./prismaClient');

async function checkTraspasoMovimientos() {
    try {
        // Obtener el último traspaso
        const ultimoTraspaso = await prisma.traspaso.findFirst({
            orderBy: { createdAt: 'desc' },
            include: {
                cajaOrigen: true,
                cajaDestino: true,
            }
        });

        if (!ultimoTraspaso) {
            console.log('No hay traspasos en la base de datos');
            return;
        }

        console.log('===== ÚLTIMO TRASPASO =====');
        console.log(`Número: ${ultimoTraspaso.numeroTraspaso}`);
        console.log(`Monto: RD$${ultimoTraspaso.monto}`);
        console.log(`Origen: ${ultimoTraspaso.cajaOrigen?.nombre || 'N/A'}`);
        console.log(`Destino: ${ultimoTraspaso.cajaDestino?.nombre || 'N/A'}`);
        console.log(`Concepto: ${ultimoTraspaso.conceptoTraspaso}`);

        // Buscar los movimientos contables asociados a este traspaso
        const movimientos = await prisma.movimientoContable.findMany({
            where: {
                descripcion: {
                    contains: ultimoTraspaso.numeroTraspaso
                }
            },
            include: {
                caja: true,
            },
            orderBy: { createdAt: 'asc' }
        });

        console.log('\n===== MOVIMIENTOS CONTABLES GENERADOS =====');
        movimientos.forEach(mov => {
            console.log(`- ${mov.tipo.toUpperCase()}: RD$${mov.monto} | Caja: ${mov.caja?.nombre || 'N/A'} (ID: ${mov.cajaId || 'NULL'})`);
            console.log(`  Método: ${mov.metodo}`);
            console.log(`  Descripción: ${mov.descripcion}`);
        });

        // Verificar saldos actuales
        console.log('\n===== SALDOS ACTUALES DE CAJAS =====');
        const cajas = await prisma.caja.findMany({
            orderBy: { nombre: 'asc' }
        });
        cajas.forEach(caja => {
            console.log(`- ${caja.nombre}: RD$${caja.saldoActual}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTraspasoMovimientos();
