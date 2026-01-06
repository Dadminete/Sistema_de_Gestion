require('dotenv').config({ path: './server/.env' });
const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function verificarMovimientos() {
    try {
        console.log('=== Verificando Movimientos Contables de Facturas con Descuento ===\n');

        const numeroFacturas = ['FAC-2025-00103', 'FAC-2025-00105'];

        for (const numeroFactura of numeroFacturas) {
            const factura = await prisma.facturaCliente.findFirst({
                where: { numeroFactura },
                include: {
                    pagos: {
                        where: { estado: 'confirmado' },
                        orderBy: { fechaPago: 'desc' }
                    }
                }
            });

            if (!factura) {
                console.log(`❌ Factura ${numeroFactura} no encontrada\n`);
                continue;
            }

            console.log(`\n📄 Factura: ${numeroFactura}`);
            console.log(`   Total Factura: $${factura.total.toFixed(2)}`);

            for (const pago of factura.pagos) {
                console.log(`\n   💰 Pago ID: ${pago.id}`);
                console.log(`      Fecha: ${pago.fechaPago.toISOString().split('T')[0]}`);
                console.log(`      Monto: $${pago.monto.toFixed(2)}`);
                console.log(`      Descuento: $${(pago.descuento || 0).toFixed(2)}`);
                console.log(`      Efectivo Real: $${(pago.monto - (pago.descuento || 0)).toFixed(2)}`);
                console.log(`      Método: ${pago.metodoPago}`);

                // Buscar movimiento contable asociado
                const fechaPagoStr = pago.fechaPago.toISOString().split('T')[0];
                const movimientos = await prisma.movimientoContable.findMany({
                    where: {
                        tipo: 'ingreso',
                        descripcion: {
                            contains: numeroFactura
                        },
                        fecha: {
                            gte: new Date(fechaPagoStr + 'T00:00:00.000Z'),
                            lt: new Date(new Date(fechaPagoStr).getTime() + 24 * 60 * 60 * 1000)
                        }
                    },
                    include: {
                        caja: true,
                        categoria: true
                    }
                });

                if (movimientos.length > 0) {
                    console.log(`\n      📊 Movimientos Contables Encontrados:`);
                    for (const mov of movimientos) {
                        console.log(`         - ID: ${mov.id}`);
                        console.log(`           Monto Registrado: $${mov.monto.toFixed(2)}`);
                        console.log(`           Método: ${mov.metodo}`);
                        console.log(`           Caja: ${mov.caja ? mov.caja.nombre : 'N/A'}`);
                        console.log(`           Descripción: ${mov.descripcion}`);
                        
                        const montoEsperado = pago.monto - (pago.descuento || 0);
                        if (Math.abs(mov.monto - montoEsperado) > 0.01) {
                            console.log(`           ⚠️  INCORRECTO - Debería ser: $${montoEsperado.toFixed(2)}`);
                            console.log(`           ❌  Diferencia: $${(mov.monto - montoEsperado).toFixed(2)}`);
                        } else {
                            console.log(`           ✅ Correcto`);
                        }
                    }
                } else {
                    console.log(`      ⚠️  No se encontró movimiento contable asociado`);
                }
            }

            console.log('\n' + '='.repeat(80));
        }

        console.log('\n✅ Verificación completada\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verificarMovimientos();
