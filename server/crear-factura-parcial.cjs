const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function crearFacturaConPagoParcial() {
    try {
        // Buscar una factura pendiente para convertirla
        const facturaPendiente = await prisma.facturaCliente.findFirst({
            where: { estado: 'pendiente' },
            include: { cliente: true }
        });
        
        if (!facturaPendiente) {
            console.log('No hay facturas pendientes disponibles para convertir');
            return;
        }
        
        console.log(`Convirtiendo factura ${facturaPendiente.numeroFactura} por ${facturaPendiente.total} de ${facturaPendiente.cliente.nombre}`);
        
        // Crear un pago parcial (50% del total)
        const montoParcial = Math.round(facturaPendiente.total * 0.5);
        
        const pago = await prisma.pagoCliente.create({
            data: {
                facturaId: facturaPendiente.id,
                clienteId: facturaPendiente.clienteId,
                numeroPago: `PAG-PARCIAL-${Date.now()}`,
                fechaPago: new Date(),
                monto: montoParcial,
                metodoPago: 'transferencia',
                estado: 'confirmado'
            }
        });
        
        console.log(`Pago parcial creado: ${pago.numeroPago} por ${pago.monto} (${Math.round((montoParcial/facturaPendiente.total)*100)}%)`);
        
        // Actualizar el estado de la factura a parcial
        await prisma.facturaCliente.update({
            where: { id: facturaPendiente.id },
            data: { estado: 'parcial' }
        });
        
        console.log('Factura marcada como parcial');
        
        // Verificar el resultado
        const facturaActualizada = await prisma.facturaCliente.findUnique({
            where: { id: facturaPendiente.id },
            include: {
                cliente: { select: { nombre: true, apellidos: true } },
                pagos: { select: { fechaPago: true, metodoPago: true, monto: true } }
            }
        });
        
        const montoPagado = facturaActualizada.pagos.reduce((total, p) => total + Number(p.monto), 0);
        const montoPendiente = facturaActualizada.total - montoPagado;
        const porcentaje = Math.round((montoPagado / facturaActualizada.total) * 100);
        
        console.log('\nResultado final:');
        console.log(`Factura: ${facturaActualizada.numeroFactura}`);
        console.log(`Cliente: ${facturaActualizada.cliente.nombre} ${facturaActualizada.cliente.apellidos}`);
        console.log(`Estado: ${facturaActualizada.estado}`);
        console.log(`Total factura: ${facturaActualizada.total}`);
        console.log(`Monto pagado: ${montoPagado} (${porcentaje}%)`);
        console.log(`Monto pendiente: ${montoPendiente}`);
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

crearFacturaConPagoParcial();