const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function revisarTodasLasFacturas() {
    try {
        console.log('=== REVISIÓN COMPLETA DE TODAS LAS FACTURAS ===\n');
        
        // Obtener TODAS las facturas sin filtro
        const todasFacturas = await prisma.facturaCliente.findMany({
            include: { 
                cliente: { select: { nombre: true, apellidos: true } },
                pagos: { select: { monto: true, estado: true } }
            },
            orderBy: { fechaFactura: 'desc' }
        });

        console.log(`📋 TOTAL DE FACTURAS EN DB: ${todasFacturas.length}`);
        
        // Agrupar por estado
        const porEstado = {};
        todasFacturas.forEach(f => {
            if (!porEstado[f.estado]) {
                porEstado[f.estado] = [];
            }
            porEstado[f.estado].push(f);
        });

        console.log('\n📊 FACTURAS POR ESTADO:');
        Object.keys(porEstado).forEach(estado => {
            console.log(`\n🏷️  Estado: ${estado.toUpperCase()} (${porEstado[estado].length} facturas)`);
            
            porEstado[estado].forEach(f => {
                const montoPagado = f.pagos
                    .filter(p => p.estado === 'confirmado')
                    .reduce((total, p) => total + Number(p.monto), 0);
                const montoPendiente = f.total - montoPagado;
                const porcentaje = f.total > 0 ? Math.round((montoPagado / f.total) * 100) : 0;
                
                console.log(`├─ ${f.numeroFactura} | ${f.cliente.nombre} ${f.cliente.apellidos}`);
                console.log(`│  Total: $${f.total.toFixed(2)} | Pagado: $${montoPagado.toFixed(2)} (${porcentaje}%) | Pendiente: $${montoPendiente.toFixed(2)}`);
                console.log(`│  Estado DB: ${f.estado} | Pagos: ${f.pagos.length}`);
            });
        });

        // Calcular totales como lo hace el sistema
        console.log('\n💰 CÁLCULOS DEL SISTEMA:');
        
        const facturasPagadas = porEstado['pagada'] || [];
        const facturasParciales = porEstado['parcial'] || [];
        
        const totalPagadas = facturasPagadas.reduce((sum, f) => sum + Number(f.total), 0);
        const totalParciales = facturasParciales.reduce((sum, f) => sum + Number(f.total), 0);
        const totalFacturado = totalPagadas + totalParciales;
        
        console.log(`├─ Facturas estado 'pagada': ${facturasPagadas.length} = $${totalPagadas.toFixed(2)}`);
        console.log(`├─ Facturas estado 'parcial': ${facturasParciales.length} = $${totalParciales.toFixed(2)}`);
        console.log(`└─ TOTAL FACTURADO: $${totalFacturado.toFixed(2)}`);

        // Detectar facturas que deberían ser parciales pero no están marcadas
        console.log('\n🔍 ANÁLISIS DE ESTADOS:');
        todasFacturas.forEach(f => {
            const montoPagado = f.pagos
                .filter(p => p.estado === 'confirmado')
                .reduce((total, p) => total + Number(p.monto), 0);
            
            let estadoCalculado = 'pendiente';
            if (montoPagado >= f.total) {
                estadoCalculado = 'pagada';
            } else if (montoPagado > 0) {
                estadoCalculado = 'parcial';
            }

            if (estadoCalculado !== f.estado && f.estado !== 'anulada') {
                console.log(`⚠️  INCONSISTENCIA: ${f.numeroFactura}`);
                console.log(`   Estado DB: ${f.estado} | Estado Calculado: ${estadoCalculado}`);
                console.log(`   Total: $${f.total} | Pagado: $${montoPagado} | Pagos: ${f.pagos.length}`);
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

revisarTodasLasFacturas();