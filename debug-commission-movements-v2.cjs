const prisma = require('./server/prismaClient');

async function debugCommissionMovements() {
    try {
        console.log('=== DEBUG: Commission Movements ===\n');

        // Obtener todas las comisiones pagadas recientemente
        const comisiones = await prisma.Comision.findMany({
            where: { estado: 'PAGADO' },
            orderBy: { fechaPago: 'desc' },
            take: 5,
            include: {
                empleado: { select: { nombres: true, apellidos: true } },
                tipoComision: { select: { nombreTipo: true } }
            }
        });

        console.log(`Total comisiones pagadas (últimas 5): ${comisiones.length}`);
        comisiones.forEach(c => {
            console.log(`- ${c.empleado.nombres} ${c.empleado.apellidos} | ${c.tipoComision.nombreTipo} | Monto: ${c.montoComision} | Fecha: ${c.fechaPago}`);
        });

        console.log('\n=== DEBUG: MovimientoContable para esas comisiones ===\n');

        // Buscar movimientos contables relacionados a comisiones
        const movimientos = await prisma.MovimientoContable.findMany({
            where: {
                descripcion: { contains: 'comisión', mode: 'insensitive' },
                tipo: 'gasto'
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                caja: { select: { id: true, nombre: true, saldoActual: true } },
                categoria: { select: { nombre: true } },
                usuario: { select: { username: true } }
            }
        });

        console.log(`Total movimientos de comisión encontrados: ${movimientos.length}`);
        if (movimientos.length === 0) {
            console.log('⚠️ NO SE ENCONTRARON MOVIMIENTOS DE COMISIÓN');
        } else {
            movimientos.forEach(m => {
                console.log(`- Monto: ${m.monto} | Caja: ${m.caja?.nombre || 'SIN CAJA'} | Categoría: ${m.categoria.nombre}`);
                console.log(`  Descripción: ${m.descripcion}`);
                console.log(`  Fecha: ${m.fecha}`);
            });
        }

        console.log('\n=== DEBUG: Caja Principal ===\n');

        // Obtener info de caja principal
        const cajaPrincipal = await prisma.Caja.findFirst({
            where: {
                OR: [
                    { nombre: { equals: 'Caja', mode: 'insensitive' } },
                    { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
                    { tipo: 'general' }
                ],
                activa: true
            }
        });

        if (cajaPrincipal) {
            console.log(`Caja Principal: ${cajaPrincipal.nombre}`);
            console.log(`ID: ${cajaPrincipal.id}`);
            console.log(`Saldo Inicial: ${cajaPrincipal.saldoInicial}`);
            console.log(`Saldo Actual: ${cajaPrincipal.saldoActual}`);

            // Calcular saldo manualmente
            const agregados = await prisma.movimientoContable.groupBy({
                by: ['tipo'],
                where: { cajaId: cajaPrincipal.id },
                _sum: { monto: true }
            });

            let totalIngresos = 0;
            let totalGastos = 0;

            agregados.forEach(agg => {
                if (agg.tipo === 'ingreso') {
                    totalIngresos = Number(agg._sum.monto || 0);
                } else if (agg.tipo === 'gasto') {
                    totalGastos = Number(agg._sum.monto || 0);
                }
            });

            const saldoCalculado = Number(cajaPrincipal.saldoInicial) + totalIngresos - totalGastos;

            console.log(`\nCálculo Manual:`);
            console.log(`Saldo Inicial: ${cajaPrincipal.saldoInicial}`);
            console.log(`Total Ingresos: ${totalIngresos}`);
            console.log(`Total Gastos: ${totalGastos}`);
            console.log(`Saldo Calculado: ${saldoCalculado}`);
            console.log(`Saldo en DB: ${cajaPrincipal.saldoActual}`);
            console.log(`¿Coinciden?: ${saldoCalculado === Number(cajaPrincipal.saldoActual) ? '✅ SÍ' : '❌ NO'}`);

            // Contar movimientos por caja
            const countMovimientos = await prisma.movimientoContable.count({
                where: { cajaId: cajaPrincipal.id }
            });

            console.log(`\nTotal movimientos en caja principal: ${countMovimientos}`);
        } else {
            console.log('❌ No se encontró la caja principal');
        }

        console.log('\n=== DEBUG: Últimos movimientos de cualquier tipo en Caja Principal ===\n');

        if (cajaPrincipal) {
            const ultimosMovimientos = await prisma.movimientoContable.findMany({
                where: { cajaId: cajaPrincipal.id },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: { tipo: true, monto: true, descripcion: true, createdAt: true }
            });

            ultimosMovimientos.forEach(m => {
                console.log(`[${m.tipo.toUpperCase()}] ${m.monto} | ${m.descripcion} | ${m.createdAt}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugCommissionMovements();
