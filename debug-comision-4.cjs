const prisma = require('./server/prismaClient');

async function debugComision4() {
  try {
    console.log('=== DEBUGGING COMISIÓN ID 4 ===');
    
    // Buscar la comisión ID 4
    const comision = await prisma.comision.findUnique({
      where: { id: BigInt(4) },
      include: {
        empleado: {
          select: { nombres: true, apellidos: true }
        },
        tipoComision: {
          select: { nombreTipo: true, porcentajeBase: true, montoFijo: true }
        }
      }
    });

    if (!comision) {
      console.log('❌ No se encontró la comisión ID 4');
      return;
    }

    console.log('📋 DETALLES DE LA COMISIÓN:');
    console.table([{
      id: comision.id.toString(),
      empleado: `${comision.empleado.nombres} ${comision.empleado.apellidos}`,
      tipoComision: comision.tipoComision.nombreTipo,
      montoBase: comision.montoBase?.toString() || 'null',
      montoComision: comision.montoComision?.toString() || 'null',
      porcentajeAplicado: comision.porcentajeAplicado?.toString() || 'null',
      estado: comision.estado,
      fechaPago: comision.fechaPago?.toISOString() || 'null'
    }]);

    console.log('\n📋 TIPO DE COMISIÓN:');
    console.table([{
      id: comision.tipoComision.id?.toString() || 'unknown',
      nombre: comision.tipoComision.nombreTipo,
      porcentajeBase: comision.tipoComision.porcentajeBase?.toString() || 'null',
      montoFijo: comision.tipoComision.montoFijo?.toString() || 'null'
    }]);

    // Verificar las validaciones que están fallando
    console.log('\n🔍 ANÁLISIS DE VALIDACIONES:');
    console.log(`montoComision existe: ${comision.montoComision !== null && comision.montoComision !== undefined}`);
    console.log(`montoComision valor: ${comision.montoComision}`);
    console.log(`parseFloat válido: ${!isNaN(parseFloat(comision.montoComision))}`);
    console.log(`parseFloat resultado: ${parseFloat(comision.montoComision)}`);
    console.log(`mayor que 0: ${parseFloat(comision.montoComision) > 0}`);

    // Si el monto es 0, intentar recalcularlo
    if (!comision.montoComision || parseFloat(comision.montoComision) <= 0) {
      console.log('\n🔧 INTENTANDO RECALCULAR MONTO:');
      
      let nuevoMonto = 0;
      let nuevoPorcentaje = 0;
      
      if (comision.tipoComision.montoFijo && parseFloat(comision.tipoComision.montoFijo) > 0) {
        nuevoMonto = parseFloat(comision.tipoComision.montoFijo);
        const montoBase = parseFloat(comision.montoBase) || 0;
        nuevoPorcentaje = montoBase > 0 ? (nuevoMonto / montoBase) * 100 : 0;
        console.log(`  Usando monto fijo: ${nuevoMonto}`);
      } else if (comision.tipoComision.porcentajeBase && parseFloat(comision.tipoComision.porcentajeBase) > 0) {
        nuevoPorcentaje = parseFloat(comision.tipoComision.porcentajeBase);
        const montoBase = parseFloat(comision.montoBase) || 0;
        nuevoMonto = (montoBase * nuevoPorcentaje) / 100;
        console.log(`  Usando porcentaje: ${nuevoPorcentaje}% de ${montoBase} = ${nuevoMonto}`);
      }
      
      if (nuevoMonto > 0) {
        console.log(`\n✅ Actualizando comisión con monto: ${nuevoMonto} y porcentaje: ${nuevoPorcentaje}`);
        
        await prisma.comision.update({
          where: { id: BigInt(4) },
          data: {
            montoComision: nuevoMonto,
            porcentajeAplicado: nuevoPorcentaje
          }
        });
        
        console.log('✅ Comisión actualizada correctamente');
      } else {
        console.log('❌ No se pudo calcular un monto válido');
      }
    } else {
      console.log('✅ El monto de la comisión parece estar correcto');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugComision4();