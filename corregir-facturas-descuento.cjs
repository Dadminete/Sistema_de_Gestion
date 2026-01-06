require('dotenv').config({ path: './server/.env' });
const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function corregirFacturas() {
    try {
        console.log('=== Corrigiendo Estado de Facturas con Descuento ===\n');

        const numeroFacturas = ['FAC-2025-00103', 'FAC-2025-00105'];

        for (const numeroFactura of numeroFacturas) {
            const factura = await prisma.facturaCliente.findFirst({
                where: { numeroFactura },
                include: {
                    pagos: {
                        where: { estado: 'confirmado' }
                    },
                    cuentasPorCobrar: true
                }
            });

            if (!factura) {
                console.log(`❌ Factura ${numeroFactura} no encontrada\n`);
                continue;
            }

            // Calcular total pagado (efectivo + descuentos)
            const totalPagado = factura.pagos.reduce((sum, p) => sum + parseFloat(p.monto), 0);
            const totalDescuento = factura.pagos.reduce((sum, p) => sum + parseFloat(p.descuento || 0), 0);
            const totalAplicado = totalPagado + totalDescuento;

            console.log(`\n📄 Factura: ${numeroFactura}`);
            console.log(`   Total Factura: $${factura.total.toFixed(2)}`);
            console.log(`   Total Aplicado: $${totalAplicado.toFixed(2)} ($${totalPagado.toFixed(2)} efectivo + $${totalDescuento.toFixed(2)} desc.)`);
            console.log(`   Estado Actual: ${factura.estado}`);

            // Determinar nuevo estado
            let nuevoEstado = factura.estado;
            if (totalAplicado >= factura.total) {
                nuevoEstado = 'pagada';
            } else if (totalAplicado > 0) {
                nuevoEstado = 'parcial';
            } else {
                nuevoEstado = 'pendiente';
            }

            if (factura.estado !== nuevoEstado) {
                // Actualizar estado de factura
                await prisma.facturaCliente.update({
                    where: { id: factura.id },
                    data: { estado: nuevoEstado }
                });

                console.log(`   ✅ Estado actualizado a: ${nuevoEstado}`);
            } else {
                console.log(`   ℹ️  El estado ya es correcto: ${nuevoEstado}`);
            }

            // Verificar cuenta por cobrar
            if (factura.cuentasPorCobrar.length > 0) {
                const cuentaPorCobrar = factura.cuentasPorCobrar[0];
                const montoPendiente = Math.max(0, factura.total - totalAplicado);
                const estadoCuenta = montoPendiente === 0 ? 'pagada' : 'pendiente';

                console.log(`   💼 Cuenta por Cobrar:`);
                console.log(`      Monto Pendiente Actual: $${parseFloat(cuentaPorCobrar.montoPendiente).toFixed(2)}`);
                console.log(`      Estado Actual: ${cuentaPorCobrar.estado}`);

                if (parseFloat(cuentaPorCobrar.montoPendiente) !== montoPendiente || cuentaPorCobrar.estado !== estadoCuenta) {
                    await prisma.cuentaPorCobrar.update({
                        where: { id: cuentaPorCobrar.id },
                        data: {
                            montoPendiente,
                            estado: estadoCuenta
                        }
                    });
                    console.log(`      ✅ Actualizada - Pendiente: $${montoPendiente.toFixed(2)}, Estado: ${estadoCuenta}`);
                } else {
                    console.log(`      ℹ️  La cuenta por cobrar ya está correcta`);
                }
            }

            console.log('\n' + '='.repeat(80));
        }

        console.log('\n✅ Proceso completado exitosamente\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

corregirFacturas();
