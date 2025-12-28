const prisma = require('./server/prismaClient');

async function debugComisionID7() {
    try {
        console.log('=== DEBUG: Comisión ID 7 ===\n');

        const comision = await prisma.Comision.findUnique({
            where: { id: 7 },
            include: {
                empleado: true,
                tipoComision: true
            }
        });

        if (comision) {
            console.log('Datos de la comisión:');
            console.log(`ID: ${comision.id}`);
            console.log(`Empleado: ${comision.empleado.nombres} ${comision.empleado.apellidos}`);
            console.log(`Tipo: ${comision.tipoComision.nombreTipo}`);
            console.log(`Monto Base: ${comision.montoBase}`);
            console.log(`Monto Comisión: ${comision.montoComision}`);
            console.log(`Porcentaje Aplicado: ${comision.porcentajeAplicado}`);
            console.log(`Estado: ${comision.estado}`);
            console.log(`Fecha Pago: ${comision.fechaPago}`);

            console.log('\nObservación:');
            if (comision.montoBase === 1000 && comision.montoComision === 200) {
                console.log('⚠️ El monto base es 1000 pero la comisión es 200');
                console.log('Si en el código anterior se usaba montoBase en lugar de montoComision,');
                console.log('eso explicaría por qué el movimiento se creó con 1000');
            }
        } else {
            console.log('Comisión no encontrada');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugComisionID7();
