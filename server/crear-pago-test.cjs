const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function crearFacturaYPago() {
    try {
        // Buscar una factura pendiente
        const facturaPendiente = await prisma.facturaCliente.findFirst({
            where: { estado: 'pendiente' },
            include: { cliente: true }
        });
        
        if (!facturaPendiente) {
            console.log('No hay facturas pendientes disponibles');
            return;
        }
        
        console.log(`Encontré la factura ${facturaPendiente.numeroFactura} por ${facturaPendiente.total} de ${facturaPendiente.cliente.nombre}`);
        
        // Crear un pago para esta factura
        const pago = await prisma.pagoCliente.create({
            data: {
                facturaId: facturaPendiente.id,
                clienteId: facturaPendiente.clienteId,
                numeroPago: `PAG-TEST-${Date.now()}`,
                fechaPago: new Date(),
                monto: facturaPendiente.total,
                metodoPago: 'efectivo',
                estado: 'confirmado'
            }
        });
        
        console.log(`Pago creado: ${pago.numeroPago} por ${pago.monto} el ${pago.fechaPago.toISOString().split('T')[0]}`);
        
        // Actualizar el estado de la factura a pagada
        await prisma.facturaCliente.update({
            where: { id: facturaPendiente.id },
            data: { estado: 'pagada' }
        });
        
        console.log('Factura marcada como pagada');
        
        // Verificar el resultado
        const facturaActualizada = await prisma.facturaCliente.findUnique({
            where: { id: facturaPendiente.id },
            include: {
                cliente: { select: { nombre: true, apellidos: true } },
                pagos: { select: { fechaPago: true, metodoPago: true, monto: true } }
            }
        });
        
        console.log('\nResultado final:');
        console.log(`Factura: ${facturaActualizada.numeroFactura}`);
        console.log(`Cliente: ${facturaActualizada.cliente.nombre} ${facturaActualizada.cliente.apellidos}`);
        console.log(`Estado: ${facturaActualizada.estado}`);
        console.log('Pagos:');
        facturaActualizada.pagos.forEach(p => {
            console.log(`  - Fecha: ${p.fechaPago.toISOString().split('T')[0]} | Método: ${p.metodoPago} | Monto: ${p.monto}`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

crearFacturaYPago();