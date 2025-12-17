const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarDetalleFacturado() {
    try {
        console.log('=== DETALLE COMPLETO DE FACTURAS PARA TOTAL FACTURADO ===\n');
        
        // Obtener facturas pagadas
        const facturasPagadas = await prisma.facturaCliente.findMany({
            where: { estado: 'pagada' },
            include: { cliente: { select: { nombre: true, apellidos: true } } },
            orderBy: { fechaFactura: 'desc' }
        });

        // Obtener facturas parciales
        const facturasParciales = await prisma.facturaCliente.findMany({
            where: { estado: 'parcial' },
            include: { 
                cliente: { select: { nombre: true, apellidos: true } },
                pagos: { select: { monto: true } }
            },
            orderBy: { fechaFactura: 'desc' }
        });

        console.log('💰 FACTURAS PAGADAS COMPLETAS:');
        let totalPagadas = 0;
        facturasPagadas.forEach(f => {
            console.log(`├─ ${f.numeroFactura} | ${f.cliente.nombre} ${f.cliente.apellidos} | $${f.total.toFixed(2)}`);
            totalPagadas += Number(f.total);
        });
        console.log(`└─ SUBTOTAL PAGADAS: $${totalPagadas.toFixed(2)}`);

        console.log('\n🔄 FACTURAS CON PAGOS PARCIALES:');
        let totalParciales = 0;
        facturasParciales.forEach(f => {
            const montoPagado = f.pagos.reduce((total, p) => total + Number(p.monto), 0);
            const porcentaje = Math.round((montoPagado / f.total) * 100);
            console.log(`├─ ${f.numeroFactura} | ${f.cliente.nombre} ${f.cliente.apellidos} | $${f.total.toFixed(2)} (${porcentaje}% pagado)`);
            totalParciales += Number(f.total);
        });
        console.log(`└─ SUBTOTAL PARCIALES: $${totalParciales.toFixed(2)}`);

        const totalFacturado = totalPagadas + totalParciales;
        console.log('\n📊 RESUMEN FINAL:');
        console.log(`├─ Facturas Pagadas: $${totalPagadas.toFixed(2)}`);
        console.log(`├─ Facturas Parciales: $${totalParciales.toFixed(2)}`);
        console.log(`└─ TOTAL FACTURADO: $${totalFacturado.toFixed(2)}`);

        // Verificar si falta algo para llegar a $6,800
        console.log('\n🎯 ANÁLISIS PARA $6,800:');
        const diferencia = 6800 - totalFacturado;
        if (Math.abs(diferencia) < 0.01) {
            console.log('✅ El total coincide exactamente con $6,800');
        } else if (diferencia > 0) {
            console.log(`⚠️  Faltan $${diferencia.toFixed(2)} para llegar a $6,800`);
            console.log('   Posibles causas: facturas pendientes no consideradas o facturas anuladas');
        } else {
            console.log(`ℹ️  El total actual ($${totalFacturado.toFixed(2)}) es mayor que $6,800 por $${Math.abs(diferencia).toFixed(2)}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verificarDetalleFacturado();