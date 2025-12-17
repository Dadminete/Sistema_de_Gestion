const prisma = require('./server/prismaClient');

async function fixMovimientosComisiones() {
  try {
    console.log('=== FIXING MOVIMIENTOS DE COMISIONES ===');
    
    // 1. Buscar movimientos de comisiones con monto 0
    const movimientosCero = await prisma.movimientoContable.findMany({
      where: {
        AND: [
          { descripcion: { contains: 'comisión', mode: 'insensitive' } },
          { monto: 0 }
        ]
      },
      include: {
        caja: { select: { nombre: true } }
      }
    });

    console.log(`\nEncontrados ${movimientosCero.length} movimientos de comisiones con monto 0`);

    for (const movimiento of movimientosCero) {
      console.log(`\nProcesando movimiento ID ${movimiento.id.substring(0, 8)}:`);
      console.log(`  Descripción: ${movimiento.descripcion}`);
      console.log(`  Caja: ${movimiento.caja?.nombre}`);
      console.log(`  Monto actual: ${movimiento.monto}`);

      // Extraer información de la descripción para encontrar la comisión relacionada
      const descripcion = movimiento.descripcion;
      
      // Buscar comisiones pagadas que coincidan con la fecha y descripción
      const fechaMovimiento = movimiento.fecha;
      const fechaInicio = new Date(fechaMovimiento);
      fechaInicio.setHours(0, 0, 0, 0);
      const fechaFin = new Date(fechaMovimiento);
      fechaFin.setHours(23, 59, 59, 999);

      // Buscar todas las comisiones pagadas ese día
      const comisionesPagadas = await prisma.comision.findMany({
        where: {
          estado: 'PAGADO',
          fechaPago: {
            gte: fechaInicio,
            lte: fechaFin
          }
        },
        include: {
          empleado: { select: { nombres: true, apellidos: true } },
          tipoComision: { select: { nombreTipo: true } }
        }
      });

      // Intentar encontrar la comisión que corresponde a este movimiento
      let comisionCorrecta = null;
      for (const comision of comisionesPagadas) {
        const nombreEmpleado = `${comision.empleado.nombres} ${comision.empleado.apellidos}`;
        const tipoComision = comision.tipoComision.nombreTipo;
        
        if (descripcion.includes(nombreEmpleado) && descripcion.includes(tipoComision)) {
          comisionCorrecta = comision;
          break;
        }
      }

      if (comisionCorrecta) {
        const nuevoMonto = parseFloat(comisionCorrecta.montoComision);
        console.log(`  Comisión encontrada: ID ${comisionCorrecta.id}, monto ${nuevoMonto}`);

        if (nuevoMonto > 0) {
          // Actualizar el movimiento contable
          await prisma.movimientoContable.update({
            where: { id: movimiento.id },
            data: { monto: nuevoMonto }
          });
          console.log(`  ✅ Movimiento actualizado con monto: ${nuevoMonto}`);
        } else {
          console.log(`  ❌ La comisión aún tiene monto 0`);
        }
      } else {
        console.log(`  ❌ No se encontró comisión correspondiente para este movimiento`);
      }
    }

    // 2. Recalcular saldos de todas las cajas afectadas manualmente
    console.log('\n=== RECALCULANDO SALDOS DE CAJAS ===');
    
    const cajasAfectadas = [...new Set(movimientosCero.map(m => m.cajaId).filter(Boolean))];
    
    for (const cajaId of cajasAfectadas) {
      const caja = await prisma.caja.findUnique({
        where: { id: cajaId },
        select: { nombre: true, saldoActual: true, saldoInicial: true }
      });
      
      console.log(`\nRecalculando caja: ${caja.nombre} (saldo actual: ${caja.saldoActual})`);
      
      // Recalcular manualmente
      const agregados = await prisma.movimientoContable.groupBy({
        by: ['tipo'],
        where: { cajaId: cajaId },
        _sum: { monto: true }
      });

      let totalIngresos = 0;
      let totalGastos = 0;

      agregados.forEach(agregado => {
        if (agregado.tipo === 'ingreso') {
          totalIngresos += parseFloat(agregado._sum.monto || 0);
        } else if (agregado.tipo === 'gasto') {
          totalGastos += parseFloat(agregado._sum.monto || 0);
        }
      });

      const saldoInicial = parseFloat(caja.saldoInicial || 0);
      const nuevoSaldo = saldoInicial + totalIngresos - totalGastos;

      // Actualizar el saldo
      await prisma.caja.update({
        where: { id: cajaId },
        data: { saldoActual: nuevoSaldo }
      });

      console.log(`  Saldo inicial: ${saldoInicial}`);
      console.log(`  Total ingresos: ${totalIngresos}`);
      console.log(`  Total gastos: ${totalGastos}`);
      console.log(`✅ Nuevo saldo: ${nuevoSaldo}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMovimientosComisiones();