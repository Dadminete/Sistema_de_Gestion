require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Usar el cliente de Prisma con el schema correcto
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkFactura() {
  try {
    console.log('Buscando factura FAC-2025-00041...\n');
    
    // Buscar la factura
    const factura = await prisma.facturaCliente.findFirst({
      where: { numeroFactura: 'FAC-2025-00041' },
      include: {
        cliente: {
          include: {
            suscripciones: {
              where: {
                estado: { in: ['activo', 'ACTIVO', 'Activo'] }
              },
              select: {
                diaFacturacion: true,
                estado: true
              }
            }
          }
        },
        pagos: {
          where: { estado: 'confirmado' }
        }
      }
    });
    
    if (!factura) {
      console.log('❌ Factura no encontrada');
      return;
    }
    
    console.log('✅ Factura encontrada:');
    console.log('Número:', factura.numeroFactura);
    console.log('Cliente:', factura.cliente.nombre, factura.cliente.apellidos);
    console.log('Fecha Factura:', factura.fechaFactura);
    console.log('Fecha Vencimiento:', factura.fechaVencimiento);
    console.log('Total:', factura.total);
    console.log('Estado:', factura.estado);
    console.log('\n--- Suscripciones del cliente ---');
    if (factura.cliente.suscripciones.length > 0) {
      factura.cliente.suscripciones.forEach((sub, idx) => {
        console.log(`Suscripción ${idx + 1}:`);
        console.log('  Día Facturación:', sub.diaFacturacion);
        console.log('  Estado:', sub.estado);
      });
    } else {
      console.log('⚠️  Cliente NO tiene suscripciones activas');
    }
    
    console.log('\n--- Pagos de la factura ---');
    if (factura.pagos.length > 0) {
      factura.pagos.forEach((pago, idx) => {
        console.log(`Pago ${idx + 1}:`);
        console.log('  Número:', pago.numeroPago);
        console.log('  Fecha Pago:', pago.fechaPago);
        console.log('  Monto:', pago.monto);
        console.log('  Estado:', pago.estado);
        
        const fechaPago = new Date(pago.fechaPago);
        const diaPago = fechaPago.getDate();
        
        if (factura.cliente.suscripciones.length > 0) {
          const diaFacturacion = factura.cliente.suscripciones[0].diaFacturacion;
          console.log(`  Día del pago: ${diaPago}`);
          console.log(`  Día de facturación del cliente: ${diaFacturacion}`);
          
          if (diaPago < diaFacturacion) {
            console.log('  ✅ Pagó ANTES del día de facturación (debería aparecer)');
          } else if (diaPago === diaFacturacion) {
            console.log('  ⚠️  Pagó EXACTAMENTE el día de facturación (no cuenta como anticipado)');
          } else {
            console.log('  ❌ Pagó DESPUÉS del día de facturación');
          }
        }
      });
    } else {
      console.log('⚠️  Factura NO tiene pagos confirmados');
    }
    
    // Buscar todos los pagos del año para este cliente
    console.log('\n--- Todos los pagos del cliente este año ---');
    const todosLosPagos = await prisma.pagoCliente.findMany({
      where: {
        clienteId: factura.clienteId,
        facturaId: { not: null },
        estado: 'confirmado',
        fechaPago: {
          gte: new Date('2025-01-01')
        }
      },
      include: {
        factura: {
          select: {
            numeroFactura: true,
            fechaVencimiento: true
          }
        }
      },
      orderBy: { fechaPago: 'desc' }
    });
    
    console.log(`Total pagos este año: ${todosLosPagos.length}`);
    todosLosPagos.forEach((pago) => {
      const fechaPago = new Date(pago.fechaPago);
      const diaPago = fechaPago.getDate();
      const diaFacturacion = factura.cliente.suscripciones[0]?.diaFacturacion || 'N/A';
      const esAnticipado = diaPago < diaFacturacion;
      
      console.log(`\n  ${pago.factura.numeroFactura} - ${pago.fechaPago.toISOString().split('T')[0]}`);
      console.log(`    Día del pago: ${diaPago} | Día facturación: ${diaFacturacion} | Anticipado: ${esAnticipado ? '✅' : '❌'}`);
      console.log(`    Monto: ${pago.monto}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFactura();
