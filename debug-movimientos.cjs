const prisma = require('./server/prismaClient');

async function debugMovimientos() {
  try {
    console.log('=== DEBUGGING MOVIMIENTOS CONTABLES ===');
    
    // 1. Verificar cajas existentes
    console.log('\n1. CAJAS EXISTENTES:');
    const cajas = await prisma.caja.findMany({
      select: {
        id: true,
        nombre: true,
        tipo: true,
        saldoInicial: true,
        saldoActual: true,
        activa: true
      }
    });
    console.table(cajas);

    // 2. Verificar movimientos recientes (últimas 24 horas)
    console.log('\n2. MOVIMIENTOS RECIENTES (últimas 24 horas):');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const movimientos = await prisma.movimientoContable.findMany({
      where: {
        fecha: {
          gte: yesterday
        }
      },
      select: {
        id: true,
        tipo: true,
        monto: true,
        descripcion: true,
        fecha: true,
        cajaId: true,
        caja: {
          select: { nombre: true }
        }
      },
      orderBy: { fecha: 'desc' }
    });
    console.table(movimientos.map(m => ({
      id: m.id.substring(0, 8),
      tipo: m.tipo,
      monto: m.monto.toString(),
      descripcion: m.descripcion?.substring(0, 50),
      fecha: m.fecha.toISOString().substring(0, 19),
      caja: m.caja?.nombre
    })));

    // 3. Verificar comisiones pagadas recientes
    console.log('\n3. COMISIONES PAGADAS RECIENTES:');
    const comisionesPagadas = await prisma.comision.findMany({
      where: {
        estado: 'PAGADO',
        fechaPago: {
          gte: yesterday
        }
      },
      select: {
        id: true,
        montoComision: true,
        fechaPago: true,
        empleado: {
          select: { nombres: true, apellidos: true }
        }
      },
      orderBy: { fechaPago: 'desc' }
    });
    console.table(comisionesPagadas.map(c => ({
      id: c.id,
      monto: c.montoComision.toString(),
      fechaPago: c.fechaPago?.toISOString().substring(0, 19),
      empleado: `${c.empleado.nombres} ${c.empleado.apellidos}`
    })));

    // 4. Verificar si hay movimientos de comisiones
    console.log('\n4. MOVIMIENTOS DE COMISIONES:');
    const movimientosComision = await prisma.movimientoContable.findMany({
      where: {
        descripcion: {
          contains: 'comisión',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        tipo: true,
        monto: true,
        descripcion: true,
        fecha: true,
        cajaId: true,
        caja: {
          select: { nombre: true }
        }
      },
      orderBy: { fecha: 'desc' },
      take: 10
    });
    console.table(movimientosComision.map(m => ({
      id: m.id.substring(0, 8),
      tipo: m.tipo,
      monto: m.monto.toString(),
      descripcion: m.descripcion?.substring(0, 50),
      fecha: m.fecha.toISOString().substring(0, 19),
      caja: m.caja?.nombre
    })));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMovimientos();