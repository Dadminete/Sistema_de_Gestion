const prisma = require('./prismaClient');

async function createCajaFuerte() {
    try {
        // Primero, obtener una cuenta contable para la caja fuerte
        // Buscar o crear una cuenta contable de tipo Activo
        let cuentaContable = await prisma.cuentaContable.findFirst({
            where: {
                nombre: { contains: 'Caja Fuerte' }
            }
        });

        if (!cuentaContable) {
            // Si no existe, crear una nueva cuenta contable
            cuentaContable = await prisma.cuentaContable.create({
                data: {
                    nombre: 'Caja Fuerte',
                    codigo: 'CAJA-003',
                    tipo: 'activo',
                    saldoInicial: 0,
                    saldoActual: 0,
                    activa: true,
                }
            });
            console.log('✅ Cuenta contable creada:', cuentaContable.nombre);
        }

        // Crear la Caja Fuerte
        const cajaFuerte = await prisma.caja.create({
            data: {
                nombre: 'Caja Fuerte',
                descripcion: 'Caja fuerte para valores y reservas',
                tipo: 'fuerte',
                cuentaContableId: cuentaContable.id,
                saldoInicial: 0,
                saldoActual: 0,
                activa: true,
            }
        });

        console.log('✅ Caja Fuerte creada exitosamente:');
        console.log(JSON.stringify(cajaFuerte, null, 2));

        // Verificar todas las cajas
        const todasCajas = await prisma.caja.findMany({
            orderBy: { nombre: 'asc' }
        });

        console.log('\n===== TODAS LAS CAJAS =====');
        todasCajas.forEach(caja => {
            console.log(`- ${caja.nombre} (${caja.tipo}) - Activa: ${caja.activa}`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createCajaFuerte();
