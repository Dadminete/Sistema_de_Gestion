const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarEstadoFacturas() {
    try {
        const facturas = await prisma.facturaCliente.findMany({
            include: { cliente: { select: { nombre: true, apellidos: true } } },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        
        console.log('Estados de facturas en la base de datos:');
        const conteoEstados = {};
        
        facturas.forEach(f => {
            console.log(`${f.numeroFactura} | ${f.cliente.nombre} | Estado: ${f.estado} | Total: ${f.total}`);
            conteoEstados[f.estado] = (conteoEstados[f.estado] || 0) + 1;
        });
        
        console.log('\nResumen por estado:');
        Object.keys(conteoEstados).forEach(estado => {
            console.log(`${estado}: ${conteoEstados[estado]} facturas`);
        });
        
        // Si no hay facturas parciales, crear una manualmente
        if (!conteoEstados['parcial'] && facturas.length > 0) {
            console.log('\nNo hay facturas parciales. Creando una de prueba...');
            
            const facturaParaConvertir = facturas.find(f => f.estado === 'pagada');
            if (facturaParaConvertir) {
                // Cambiar estado a parcial y crear un pago parcial
                const montoParcial = Math.round(facturaParaConvertir.total * 0.6);
                
                // Primero eliminar pagos existentes para simular pago parcial
                await prisma.pagoCliente.deleteMany({
                    where: { facturaId: facturaParaConvertir.id }
                });
                
                // Crear un pago parcial
                await prisma.pagoCliente.create({
                    data: {
                        facturaId: facturaParaConvertir.id,
                        clienteId: facturaParaConvertir.clienteId,
                        numeroPago: `PAG-PARCIAL-${Date.now()}`,
                        fechaPago: new Date(),
                        monto: montoParcial,
                        metodoPago: 'efectivo',
                        estado: 'confirmado'
                    }
                });
                
                // Cambiar estado a parcial
                await prisma.facturaCliente.update({
                    where: { id: facturaParaConvertir.id },
                    data: { estado: 'parcial' }
                });
                
                console.log(`✅ Factura ${facturaParaConvertir.numeroFactura} convertida a pago parcial`);
                console.log(`   Monto total: ${facturaParaConvertir.total}`);
                console.log(`   Monto pagado: ${montoParcial} (${Math.round((montoParcial/facturaParaConvertir.total)*100)}%)`);
                console.log(`   Monto pendiente: ${facturaParaConvertir.total - montoParcial}`);
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verificarEstadoFacturas();