const prisma = require('./server/prismaClient');

async function corregirFechasCuentasPorCobrar() {
  try {
    console.log('🔧 Corrigiendo fechas de cuentas por cobrar...');
    
    // Encontrar cuentas con fechas inconsistentes
    const cuentasInconsistentes = await prisma.cuentaPorCobrar.findMany({
      include: {
        factura: {
          select: { 
            numeroFactura: true, 
            fechaFactura: true, 
            fechaVencimiento: true 
          }
        },
        cliente: {
          select: { nombre: true, apellidos: true }
        }
      }
    });
    
    console.log(`\n📊 Revisando ${cuentasInconsistentes.length} cuentas por cobrar...`);
    
    const correccionesNecesarias = [];
    
    cuentasInconsistentes.forEach(cuenta => {
      if (cuenta.factura) {
        const fechaFactura = new Date(cuenta.factura.fechaFactura);
        const fechaEmisionCxC = new Date(cuenta.fechaEmision);
        
        // Si la fecha de emisión de CxC no coincide con la fecha de la factura
        if (fechaFactura.toDateString() !== fechaEmisionCxC.toDateString()) {
          correccionesNecesarias.push({
            id: cuenta.id,
            numeroDocumento: cuenta.numeroDocumento,
            cliente: `${cuenta.cliente?.nombre} ${cuenta.cliente?.apellidos || ''}`,
            fechaFacturaOriginal: cuenta.factura.fechaFactura,
            fechaEmisionActual: cuenta.fechaEmision,
            fechaVencimientoFactura: cuenta.factura.fechaVencimiento,
            fechaVencimientoActual: cuenta.fechaVencimiento,
            nuevaFechaEmision: cuenta.factura.fechaFactura,
            nuevaFechaVencimiento: cuenta.factura.fechaVencimiento || new Date(fechaFactura.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 días después si no hay fecha vencimiento
          });
        }
      }
    });
    
    console.log(`\n⚠️  Cuentas con fechas inconsistentes: ${correccionesNecesarias.length}`);
    
    if (correccionesNecesarias.length === 0) {
      console.log('✅ Todas las fechas están correctas.');
      return;
    }
    
    // Mostrar las correcciones que se van a hacer
    correccionesNecesarias.forEach((correccion, index) => {
      console.log(`\n${index + 1}. 📋 ${correccion.numeroDocumento} - ${correccion.cliente}`);
      console.log(`   📅 Fecha Factura: ${correccion.fechaFacturaOriginal.toISOString().split('T')[0]}`);
      console.log(`   ❌ Fecha CxC Actual: ${correccion.fechaEmisionActual.toISOString().split('T')[0]}`);
      console.log(`   ✅ Nueva Fecha CxC: ${correccion.nuevaFechaEmision.toISOString().split('T')[0]}`);
      console.log(`   📅 Vencimiento Actual: ${correccion.fechaVencimientoActual.toISOString().split('T')[0]}`);
      console.log(`   ✅ Nuevo Vencimiento: ${correccion.nuevaFechaVencimiento.toISOString().split('T')[0]}`);
    });
    
    // Aplicar correcciones
    console.log(`\n🔄 Aplicando correcciones...`);
    
    for (const correccion of correccionesNecesarias) {
      await prisma.cuentaPorCobrar.update({
        where: { id: correccion.id },
        data: {
          fechaEmision: correccion.nuevaFechaEmision,
          fechaVencimiento: correccion.nuevaFechaVencimiento,
          // Recalcular días vencidos
          diasVencido: Math.ceil((new Date() - new Date(correccion.nuevaFechaVencimiento)) / (1000 * 60 * 60 * 24))
        }
      });
      
      console.log(`   ✅ Corregido: ${correccion.numeroDocumento}`);
    }
    
    console.log(`\n🎉 ¡Correcciones completadas! ${correccionesNecesarias.length} cuentas actualizadas.`);
    
    // Verificar el resultado
    console.log(`\n🔍 Verificando resultados...`);
    const cuentasCorregidas = await prisma.cuentaPorCobrar.findMany({
      where: {
        id: { in: correccionesNecesarias.map(c => c.id) }
      },
      include: {
        factura: { select: { numeroFactura: true, fechaFactura: true } },
        cliente: { select: { nombre: true, apellidos: true } }
      }
    });
    
    cuentasCorregidas.forEach(cuenta => {
      console.log(`✅ ${cuenta.numeroDocumento} - ${cuenta.cliente?.nombre}`);
      console.log(`   📅 Factura: ${cuenta.factura?.fechaFactura.toISOString().split('T')[0]}`);
      console.log(`   📅 CxC Emisión: ${cuenta.fechaEmision.toISOString().split('T')[0]}`);
      console.log(`   📅 CxC Vencimiento: ${cuenta.fechaVencimiento.toISOString().split('T')[0]}`);
      console.log(`   ⏰ Días vencido: ${cuenta.diasVencido}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

corregirFechasCuentasPorCobrar();