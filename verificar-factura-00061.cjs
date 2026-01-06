const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarFactura() {
    try {
        const factura = await prisma.facturaCliente.findFirst({
            where: { numeroFactura: 'FAC-2025-00061' },
            include: {
                cliente: true,
                items: true,
                pagos: true
            }
        });

        if (!factura) {
            console.log('❌ Factura no encontrada');
            return;
        }

        console.log('\n=== FACTURA FAC-2025-00061 ===');
        console.log('Estado:', factura.estado);
        console.log('Fecha Factura:', factura.fechaFactura);
        console.log('Fecha Vencimiento:', factura.fechaVencimiento);
        console.log('Total:', factura.total);
        console.log('Monto Pagado:', factura.montoPagado);
        console.log('Saldo:', factura.saldo);
        console.log('Cliente:', factura.cliente?.nombre);
        console.log('Items:', factura.items?.length || 0);
        console.log('Pagos:', factura.pagos?.length || 0);
        console.log('Anulada:', factura.anulada ? 'SÍ' : 'NO');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verificarFactura();
