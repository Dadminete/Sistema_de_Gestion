const prisma = require('./server/prismaClient');

async function verificarComisionMoises() {
  try {
    console.log('=== VERIFICANDO COMISIÓN DE MOISES ===');
    
    // Buscar la comisión de Moises
    const comisionMoises = await prisma.comision.findFirst({
      where: {
        empleado: {
          nombres: { contains: 'Moises', mode: 'insensitive' }
        },
        estado: 'PAGADO'
      },
      include: {
        empleado: { select: { nombres: true, apellidos: true } }
      }
    });

    if (!comisionMoises) {
      console.log('No se encontró comisión pagada de Moises');
      return;
    }

    console.log(`Comisión de Moises ID: ${comisionMoises.id}`);
    console.log(`Monto: ${comisionMoises.montoComision}`);
    console.log(`Estado: ${comisionMoises.estado}`);
    console.log(`Fecha pago: ${comisionMoises.fechaPago}`);

    // Buscar movimiento contable correspondiente
    const movimiento = await prisma.movimientoContable.findFirst({
      where: {
        descripcion: {
          contains: 'Moises',
          mode: 'insensitive'
        },
        tipo: 'gasto'
      },
      include: {
        caja: { select: { nombre: true } }
      }
    });

    if (movimiento) {
      console.log(`\nMovimiento encontrado:`);
      console.log(`ID: ${movimiento.id}`);
      console.log(`Monto: ${movimiento.monto}`);
      console.log(`Descripción: ${movimiento.descripcion}`);
      console.log(`Caja: ${movimiento.caja?.nombre}`);
      console.log(`Fecha: ${movimiento.fecha}`);
    } else {
      console.log(`\n❌ No se encontró movimiento contable para la comisión de Moises`);
      console.log(`Esto significa que cuando se marcó como pagada, no se creó el movimiento correctamente.`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarComisionMoises();