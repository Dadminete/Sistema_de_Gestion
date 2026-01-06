require('dotenv').config();
const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function fixNominaPagos() {
  try {
    console.log('🔍 Buscando nómina de Daniel Beras Sanchez...\n');

    // Buscar la nómina de Daniel
    const nomina = await prisma.nomina.findFirst({
      where: {
        empleado: {
          nombres: { contains: 'Daniel', mode: 'insensitive' },
          apellidos: { contains: 'Beras', mode: 'insensitive' }
        },
        estadoPago: 'PENDIENTE'
      },
      include: {
        empleado: true,
        periodo: true
      },
      orderBy: { fechaCalculo: 'desc' }
    });

    if (!nomina) {
      console.log('❌ No se encontró nómina pendiente para Daniel Beras');
      return;
    }

    console.log('✅ Nómina encontrada:');
    console.log(`   ID: ${nomina.id}`);
    console.log(`   Empleado: ${nomina.empleado.nombres} ${nomina.empleado.apellidos}`);
    console.log(`   Salario Neto: RD$${Number(nomina.salarioNeto)}`);
    console.log(`   Estado: ${nomina.estadoPago}`);
    console.log(`   Periodo: ${nomina.periodo.codigoPeriodo}\n`);

    // Buscar movimientos que puedan ser pagos a esta nómina
    console.log('🔍 Buscando movimientos contables relacionados...\n');

    // Buscar con el nuevo formato
    const movimientosNuevoFormato = await prisma.movimientoContable.findMany({
      where: {
        tipo: 'gasto',
        descripcion: {
          contains: `[nominaId:${nomina.id}]`,
          mode: 'insensitive'
        }
      },
      orderBy: { fecha: 'desc' }
    });

    console.log(`📋 Movimientos con formato nuevo [nominaId:${nomina.id}]: ${movimientosNuevoFormato.length}`);
    movimientosNuevoFormato.forEach(mov => {
      console.log(`   - ${mov.fecha.toISOString().split('T')[0]} | RD$${Number(mov.monto)} | ${mov.descripcion}`);
    });

    // Buscar movimientos que mencionen a Daniel y sean de nómina
    const movimientosPosibles = await prisma.movimientoContable.findMany({
      where: {
        tipo: 'gasto',
        descripcion: {
          contains: 'Daniel',
          mode: 'insensitive'
        }
      },
      orderBy: { fecha: 'desc' },
      take: 10
    });

    console.log(`\n📋 Movimientos que mencionan "Daniel": ${movimientosPosibles.length}`);
    movimientosPosibles.forEach(mov => {
      console.log(`   - ID: ${mov.id} | ${mov.fecha.toISOString().split('T')[0]} | RD$${Number(mov.monto)}`);
      console.log(`     Desc: ${mov.descripcion || 'Sin descripción'}`);
    });

    // Si hay movimientos sin el formato correcto, preguntar si corregir
    const movimientosSinFormato = movimientosPosibles.filter(m => 
      m.descripcion && 
      m.descripcion.toLowerCase().includes('daniel') &&
      m.descripcion.toLowerCase().includes('nómina') &&
      !m.descripcion.includes(`[nominaId:${nomina.id}]`)
    );

    if (movimientosSinFormato.length > 0) {
      console.log(`\n⚠️  Encontrados ${movimientosSinFormato.length} movimientos que parecen ser pagos pero no tienen el formato correcto.`);
      console.log('   Estos movimientos serán actualizados para incluir [nominaId:XXX]:\n');

      for (const mov of movimientosSinFormato) {
        console.log(`   Actualizando movimiento ${mov.id}...`);
        const nuevaDescripcion = `${mov.descripcion} [nominaId:${nomina.id}]`;
        
        await prisma.movimientoContable.update({
          where: { id: mov.id },
          data: { descripcion: nuevaDescripcion }
        });
        
        console.log(`   ✅ Actualizado: ${nuevaDescripcion}`);
      }

      console.log('\n✅ Movimientos actualizados correctamente!');
    } else {
      console.log('\n✅ No hay movimientos que necesiten corrección.');
    }

    // Calcular total pagado
    const todosLosPagos = await prisma.movimientoContable.findMany({
      where: {
        tipo: 'gasto',
        descripcion: {
          contains: `[nominaId:${nomina.id}]`,
          mode: 'insensitive'
        }
      }
    });

    const totalPagado = todosLosPagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
    const montoPendiente = Number(nomina.salarioNeto) - totalPagado;

    console.log('\n💰 RESUMEN:');
    console.log(`   Salario Neto: RD$${Number(nomina.salarioNeto).toFixed(2)}`);
    console.log(`   Total Pagado: RD$${totalPagado.toFixed(2)}`);
    console.log(`   Monto Pendiente: RD$${montoPendiente.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNominaPagos();
