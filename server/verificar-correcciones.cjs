const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarCorreccionesDashboard() {
    try {
        console.log('=== VERIFICACIÓN DE CORRECCIONES AL DASHBOARD ===\n');
        
        // Obtener estadísticas como las obtiene el dashboard
        const [facturasPendientes, facturasPagadas, facturasAnuladas, facturasParciales] = await Promise.all([
            prisma.facturaCliente.count({ where: { estado: 'pendiente' } }),
            prisma.facturaCliente.count({ where: { estado: 'pagada' } }),
            prisma.facturaCliente.count({ where: { estado: 'anulada' } }),
            prisma.facturaCliente.count({ where: { estado: 'parcial' } })
        ]);

        // Total facturado (facturas pagadas + parciales)
        const totalFacturadoCompleto = await prisma.facturaCliente.aggregate({
            where: { estado: { in: ['pagada', 'parcial'] } },
            _sum: { total: true }
        });

        // Total pendiente (facturas pendientes)
        const totalPendiente = await prisma.facturaCliente.aggregate({
            where: { estado: 'pendiente' },
            _sum: { total: true }
        });

        // Total pagado (suma de todos los pagos confirmados)
        const totalPagado = await prisma.pagoCliente.aggregate({
            where: { estado: 'confirmado' },
            _sum: { monto: true }
        });

        console.log('📊 ESTADÍSTICAS DEL DASHBOARD:');
        console.log(`├─ Facturas Pendientes: ${facturasPendientes}`);
        console.log(`├─ Facturas Pagadas: ${facturasPagadas}`);
        console.log(`├─ Facturas Parciales: ${facturasParciales}`);
        console.log(`├─ Facturas Anuladas: ${facturasAnuladas}`);
        console.log(`├─ Total Facturado (pagadas + parciales): $${(totalFacturadoCompleto._sum.total || 0).toFixed(2)}`);
        console.log(`├─ Total Pendiente: $${(totalPendiente._sum.total || 0).toFixed(2)}`);
        console.log(`└─ Total Pagado: $${(totalPagado._sum.monto || 0).toFixed(2)}`);

        console.log('\n🔧 CORRECCIÓN APLICADA:');
        console.log('✅ El "Total Facturado" ahora incluye facturas "pagada" Y "parcial"');
        console.log('✅ Las facturas con estado "parcial" SÍ se incluyen en "Total Facturado"');
        console.log('✅ Se mantiene tarjeta separada para "Pagos Parciales" para tracking');

        // Verificar facturas parciales
        if (facturasParciales > 0) {
            console.log('\n💰 FACTURAS CON PAGOS PARCIALES:');
            const facturasParcialDetalle = await prisma.facturaCliente.findMany({
                where: { estado: 'parcial' },
                include: {
                    cliente: { select: { nombre: true, apellidos: true } },
                    pagos: { select: { monto: true } }
                }
            });

            facturasParcialDetalle.forEach(f => {
                const montoPagado = f.pagos.reduce((total, p) => total + Number(p.monto), 0);
                const montoPendiente = f.total - montoPagado;
                const porcentaje = Math.round((montoPagado / f.total) * 100);
                
                console.log(`├─ ${f.numeroFactura} | ${f.cliente.nombre} ${f.cliente.apellidos}`);
                console.log(`│  Total: $${f.total.toFixed(2)} | Pagado: $${montoPagado.toFixed(2)} (${porcentaje}%) | Pendiente: $${montoPendiente.toFixed(2)}`);
            });
        }

        console.log('\n🎯 NUEVA FUNCIONALIDAD EN FACTURAS PARCIALES:');
        console.log('💲 Botón "Agregar Pago Parcial" (icono $) - Permite pagar una cantidad específica');
        console.log('✅ Botón "Completar Pago Total" (icono ✓) - Paga el monto restante completo');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verificarCorreccionesDashboard();