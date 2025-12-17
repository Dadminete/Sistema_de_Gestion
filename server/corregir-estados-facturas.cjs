const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function corregirEstadosFacturas() {
    try {
        console.log('=== CORRIGIENDO ESTADOS DE FACTURAS ===\n');
        
        // Obtener todas las facturas con pagos
        const facturas = await prisma.facturaCliente.findMany({
            include: { 
                pagos: { 
                    where: { estado: 'confirmado' },
                    select: { monto: true } 
                }
            }
        });

        console.log('🔧 Corrigiendo estados inconsistentes...\n');

        for (const factura of facturas) {
            const montoPagado = factura.pagos.reduce((total, p) => total + Number(p.monto), 0);
            
            let estadoCorrect = factura.estado;
            
            // No cambiar facturas anuladas
            if (factura.estado === 'anulada') {
                continue;
            }
            
            // Calcular estado correcto
            if (montoPagado >= factura.total) {
                estadoCorrect = 'pagada';
            } else if (montoPagado > 0) {
                estadoCorrect = 'parcial';
            } else {
                estadoCorrect = 'pendiente';
            }

            // Actualizar si hay diferencia
            if (estadoCorrect !== factura.estado) {
                console.log(`📝 Actualizando ${factura.numeroFactura}:`);
                console.log(`   De: ${factura.estado} → A: ${estadoCorrect}`);
                console.log(`   Total: $${factura.total} | Pagado: $${montoPagado}\n`);
                
                await prisma.facturaCliente.update({
                    where: { id: factura.id },
                    data: { estado: estadoCorrect }
                });
            }
        }

        // Verificar resultado final
        console.log('✅ Verificando resultado final...\n');
        
        const estadisticas = await Promise.all([
            prisma.facturaCliente.count({ where: { estado: 'pendiente' } }),
            prisma.facturaCliente.count({ where: { estado: 'pagada' } }),
            prisma.facturaCliente.count({ where: { estado: 'parcial' } }),
            prisma.facturaCliente.count({ where: { estado: 'anulada' } }),
            prisma.facturaCliente.aggregate({
                where: { estado: { in: ['pagada', 'parcial'] } },
                _sum: { total: true }
            })
        ]);

        console.log('📊 ESTADÍSTICAS FINALES:');
        console.log(`├─ Pendientes: ${estadisticas[0]}`);
        console.log(`├─ Pagadas: ${estadisticas[1]}`);
        console.log(`├─ Parciales: ${estadisticas[2]}`);
        console.log(`├─ Anuladas: ${estadisticas[3]}`);
        console.log(`└─ Total Facturado: $${(estadisticas[4]._sum.total || 0).toFixed(2)}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

corregirEstadosFacturas();