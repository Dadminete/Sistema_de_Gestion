require('dotenv').config({ path: './server/.env' });
const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function verificarFacturas() {
    try {
        console.log('=== Verificando Facturas con Descuento ===\n');

        const facturas = await prisma.facturaCliente.findMany({
            where: {
                numeroFactura: {
                    in: ['FAC-2025-00103', 'FAC-2025-00105']
                }
            },
            include: {
                cliente: true,
                pagos: {
                    orderBy: { fechaPago: 'desc' }
                },
                cuentasPorCobrar: true
            }
        });

        for (const factura of facturas) {
            console.log(`\n📄 Factura: ${factura.numeroFactura}`);
            console.log(`   Cliente: ${factura.cliente.nombre} ${factura.cliente.apellidos}`);
            console.log(`   Total Factura: $${factura.total.toFixed(2)}`);
            console.log(`   Estado: ${factura.estado}`);
            
            console.log(`\n   💰 Pagos registrados:`);
            if (factura.pagos.length === 0) {
                console.log(`   - No hay pagos registrados`);
            } else {
                for (const pago of factura.pagos) {
                    console.log(`   - Pago ID: ${pago.id}`);
                    console.log(`     Fecha: ${pago.fechaPago.toISOString().split('T')[0]}`);
                    console.log(`     Monto: $${pago.monto.toFixed(2)}`);
                    console.log(`     Descuento: $${(pago.descuento || 0).toFixed(2)}`);
                    console.log(`     Método: ${pago.metodoPago}`);
                    console.log(`     Estado: ${pago.estado}`);
                    console.log(`     Observaciones: ${pago.observaciones || 'N/A'}`);
                }
            }

            // Calcular totales
            const totalPagado = factura.pagos.reduce((sum, p) => sum + (p.estado === 'confirmado' ? parseFloat(p.monto) : 0), 0);
            const totalDescuento = factura.pagos.reduce((sum, p) => sum + (p.estado === 'confirmado' ? parseFloat(p.descuento || 0) : 0), 0);
            const totalAplicado = totalPagado + totalDescuento;

            console.log(`\n   📊 Resumen:`);
            console.log(`   - Total pagado (efectivo): $${totalPagado.toFixed(2)}`);
            console.log(`   - Total descuentos: $${totalDescuento.toFixed(2)}`);
            console.log(`   - Total aplicado: $${totalAplicado.toFixed(2)}`);
            console.log(`   - Pendiente: $${(factura.total - totalAplicado).toFixed(2)}`);

            if (factura.cuentasPorCobrar.length > 0) {
                console.log(`\n   💼 Cuenta por Cobrar:`);
                console.log(`   - Monto Pendiente: $${parseFloat(factura.cuentasPorCobrar[0].montoPendiente).toFixed(2)}`);
                console.log(`   - Estado: ${factura.cuentasPorCobrar[0].estado}`);
            }

            console.log('\n' + '='.repeat(80));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verificarFacturas();
