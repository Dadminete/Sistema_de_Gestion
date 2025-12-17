const prisma = require('./server/prismaClient');

async function fixComisiones() {
  try {
    console.log('=== FIXING COMISIONES CON MONTO 0 ===');
    
    // 1. Buscar comisiones con monto 0
    const comisionesCero = await prisma.comision.findMany({
      where: {
        montoComision: 0
      },
      include: {
        tipoComision: true,
        empleado: {
          select: { nombres: true, apellidos: true }
        }
      }
    });

    console.log(`\nEncontradas ${comisionesCero.length} comisiones con monto 0`);

    for (const comision of comisionesCero) {
      console.log(`\nProcesando comisión ID ${comision.id}:`);
      console.log(`  Empleado: ${comision.empleado.nombres} ${comision.empleado.apellidos}`);
      console.log(`  Tipo: ${comision.tipoComision.nombreTipo}`);
      console.log(`  Monto Base: ${comision.montoBase}`);
      console.log(`  Porcentaje Base: ${comision.tipoComision.porcentajeBase}`);
      console.log(`  Monto Fijo: ${comision.tipoComision.montoFijo}`);

      let nuevoMontoComision = 0;
      let nuevoPorcentajeAplicado = 0;

      // Calcular según el tipo
      if (comision.tipoComision.montoFijo != null && parseFloat(comision.tipoComision.montoFijo) > 0) {
        // Monto fijo
        nuevoMontoComision = parseFloat(comision.tipoComision.montoFijo);
        const montoBase = parseFloat(comision.montoBase) || 0;
        nuevoPorcentajeAplicado = montoBase > 0 ? (nuevoMontoComision / montoBase) * 100 : 0;
        console.log(`  -> Usando monto fijo: ${nuevoMontoComision}`);
      } else if (comision.tipoComision.porcentajeBase != null && parseFloat(comision.tipoComision.porcentajeBase) > 0) {
        // Porcentaje
        nuevoPorcentajeAplicado = parseFloat(comision.tipoComision.porcentajeBase);
        const montoBase = parseFloat(comision.montoBase) || 0;
        nuevoMontoComision = (montoBase * nuevoPorcentajeAplicado) / 100;
        console.log(`  -> Usando porcentaje: ${nuevoPorcentajeAplicado}% de ${montoBase} = ${nuevoMontoComision}`);
      }

      // Actualizar en la base de datos
      if (nuevoMontoComision > 0) {
        await prisma.comision.update({
          where: { id: comision.id },
          data: {
            montoComision: nuevoMontoComision,
            porcentajeAplicado: nuevoPorcentajeAplicado
          }
        });
        console.log(`  ✅ Actualizada: monto ${nuevoMontoComision}, porcentaje ${nuevoPorcentajeAplicado}%`);
      } else {
        console.log(`  ❌ No se pudo calcular un monto válido`);
      }
    }

    console.log('\n=== VERIFICACIÓN FINAL ===');
    const comisionesActualizadas = await prisma.comision.findMany({
      where: {
        id: { in: comisionesCero.map(c => c.id) }
      },
      select: {
        id: true,
        montoBase: true,
        montoComision: true,
        porcentajeAplicado: true,
        empleado: {
          select: { nombres: true, apellidos: true }
        }
      }
    });

    console.table(comisionesActualizadas.map(c => ({
      id: c.id.toString(),
      empleado: `${c.empleado.nombres} ${c.empleado.apellidos}`,
      montoBase: c.montoBase.toString(),
      montoComision: c.montoComision.toString(),
      porcentajeAplicado: c.porcentajeAplicado.toString()
    })));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixComisiones();