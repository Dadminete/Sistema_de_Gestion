const prisma = require('./server/prismaClient');

async function investigarFacturasPendientes() {
  try {
    console.log('🔍 Investigando facturas pendientes de noviembre...');
    
    // 1. Revisar facturas de noviembre
    console.log('\n📋 === FACTURAS DE NOVIEMBRE ===');
    const facturasNoviembre = await prisma.facturaCliente.findMany({
      where: {
        fechaFactura: {
          gte: new Date('2025-11-01'),
          lt: new Date('2025-12-01')
        }
      },
      include: {
        cliente: {
          select: { nombre: true, apellidos: true }
        }
      },
      orderBy: { fechaFactura: 'desc' }
    });
    
    console.log(`📊 Total facturas noviembre: ${facturasNoviembre.length}`);
    facturasNoviembre.forEach(f => {
      console.log(`  📄 ${f.numeroFactura} - ${f.cliente?.nombre} ${f.cliente?.apellidos || ''}`);
      console.log(`     💰 Total: $${f.total} - Estado: ${f.estado} - Fecha: ${f.fechaFactura.toISOString().split('T')[0]}`);
    });
    
    // 2. Revisar cuentas por cobrar existentes
    console.log('\n💳 === CUENTAS POR COBRAR EXISTENTES ===');
    const cuentasPorCobrar = await prisma.cuentaPorCobrar.findMany({
      include: {
        cliente: { select: { nombre: true, apellidos: true } },
        factura: { select: { numeroFactura: true, fechaFactura: true } }
      },
      orderBy: { fechaEmision: 'desc' }
    });
    
    console.log(`📊 Total cuentas por cobrar: ${cuentasPorCobrar.length}`);
    cuentasPorCobrar.forEach(c => {
      console.log(`  📋 ${c.numeroDocumento} - ${c.cliente?.nombre} ${c.cliente?.apellidos || ''}`);
      console.log(`     💰 Pendiente: $${c.montoPendiente} - Estado: ${c.estado}`);
      console.log(`     📅 Emisión: ${c.fechaEmision.toISOString().split('T')[0]} - Vencimiento: ${c.fechaVencimiento.toISOString().split('T')[0]}`);
      if (c.factura) {
        console.log(`     🧾 Factura: ${c.factura.numeroFactura} (${c.factura.fechaFactura?.toISOString().split('T')[0]})`);
      }
    });
    
    // 3. Buscar facturas pendientes SIN cuenta por cobrar
    console.log('\n❌ === FACTURAS SIN CUENTA POR COBRAR ===');
    const facturasSinCxC = await prisma.facturaCliente.findMany({
      where: {
        AND: [
          { estado: { not: 'pagada' } },
          {
            cuentasPorCobrar: {
              none: {}
            }
          }
        ]
      },
      include: {
        cliente: { select: { nombre: true, apellidos: true } }
      },
      orderBy: { fechaFactura: 'desc' }
    });
    
    console.log(`⚠️  Facturas pendientes sin CxC: ${facturasSinCxC.length}`);
    facturasSinCxC.forEach(f => {
      console.log(`  ❗ ${f.numeroFactura} - ${f.cliente?.nombre} ${f.cliente?.apellidos || ''}`);
      console.log(`     💰 Total: $${f.total} - Estado: ${f.estado}`);
      console.log(`     📅 Fecha: ${f.fechaFactura.toISOString().split('T')[0]} - Vencimiento: ${f.fechaVencimiento?.toISOString().split('T')[0] || 'No definido'}`);
    });
    
    // 4. Verificar específicamente noviembre pendientes
    const noviembrePendientes = facturasSinCxC.filter(f => {
      const fecha = new Date(f.fechaFactura);
      return fecha.getMonth() === 10 && fecha.getFullYear() === 2025; // Noviembre es mes 10 (0-indexed)
    });
    
    console.log(`\n🎯 === FACTURAS NOVIEMBRE SIN CxC ===`);
    console.log(`📊 Total: ${noviembrePendientes.length}`);
    noviembrePendientes.forEach(f => {
      console.log(`  🚨 FALTA: ${f.numeroFactura} - $${f.total} - ${f.estado}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigarFacturasPendientes();