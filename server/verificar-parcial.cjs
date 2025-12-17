const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarFacturaParcial() {
    try {
        // Buscar la factura parcial existente
        const facturaParcial = await prisma.facturaCliente.findFirst({
            where: { estado: 'parcial' },
            include: {
                cliente: { select: { nombre: true, apellidos: true } },
                pagos: { select: { fechaPago: true, metodoPago: true, monto: true } }
            }
        });
        
        if (!facturaParcial) {
            console.log('No hay facturas con estado parcial');
            return;
        }
        
        const montoPagado = facturaParcial.pagos.reduce((total, p) => total + Number(p.monto), 0);
        const montoPendiente = facturaParcial.total - montoPagado;
        const porcentaje = Math.round((montoPagado / facturaParcial.total) * 100);
        
        console.log('=== FACTURA CON PAGO PARCIAL ===');
        console.log(`Factura: ${facturaParcial.numeroFactura}`);
        console.log(`Cliente: ${facturaParcial.cliente.nombre} ${facturaParcial.cliente.apellidos}`);
        console.log(`Estado: ${facturaParcial.estado}`);
        console.log(`Total factura: $${facturaParcial.total.toFixed(2)}`);
        console.log(`Monto pagado: $${montoPagado.toFixed(2)} (${porcentaje}%)`);
        console.log(`Monto pendiente: $${montoPendiente.toFixed(2)}`);
        console.log('\nHistorial de pagos:');
        facturaParcial.pagos.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.fechaPago.toISOString().split('T')[0]} - ${p.metodoPago} - $${Number(p.monto).toFixed(2)}`);
        });
        
        console.log('\n✅ Esta factura aparecerá en la página de Facturas Parciales');
        console.log(`📊 Barra de progreso mostrará: ${porcentaje}%`);
        console.log(`💰 Al hacer clic en "Marcar como Pagada" se completará con $${montoPendiente.toFixed(2)}`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verificarFacturaParcial();