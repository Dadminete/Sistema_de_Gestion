const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarFacturasPagadas() {
    try {
        const facturas = await prisma.facturaCliente.findMany({
            where: { estado: 'pagada' },
            include: {
                cliente: { select: { nombre: true, apellidos: true } },
                pagos: { select: { fechaPago: true, metodoPago: true, monto: true } }
            },
            take: 3
        });
        
        console.log('Facturas pagadas encontradas:');
        facturas.forEach(f => {
            console.log(`\nFactura: ${f.numeroFactura}`);
            console.log(`Cliente: ${f.cliente.nombre} ${f.cliente.apellidos}`);
            console.log(`Estado: ${f.estado}`);
            console.log('Pagos:');
            f.pagos.forEach(p => {
                console.log(`  - Fecha: ${p.fechaPago.toISOString().split('T')[0]} | Método: ${p.metodoPago} | Monto: ${p.monto}`);
            });
        });
        
        if (facturas.length === 0) {
            console.log('No se encontraron facturas pagadas');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verificarFacturasPagadas();