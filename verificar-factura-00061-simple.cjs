const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.facturaCliente.findFirst({
    where: { numeroFactura: 'FAC-2025-00061' }
}).then(f => {
    if (!f) {
        console.log('Factura no encontrada');
    } else {
        console.log('Estado:', f.estado);
        console.log('Anulada:', f.anulada);
        console.log('Saldo:', f.saldo);
        console.log('Total:', f.total);
        console.log('MontoPagado:', f.montoPagado);
        console.log('Fecha:', f.fechaFactura);
    }
}).finally(() => prisma.$disconnect());
