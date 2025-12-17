const prisma = require('./server/prismaClient');

async function crearMovimientoMoises() {
  try {
    console.log('=== CREANDO MOVIMIENTO PARA MOISES ===');
    
    // Buscar la comisión de Moises
    const comisionMoises = await prisma.comision.findFirst({
      where: {
        empleado: {
          nombres: { contains: 'Moises', mode: 'insensitive' }
        },
        estado: 'PAGADO'
      },
      include: {
        empleado: { select: { nombres: true, apellidos: true } },
        tipoComision: { select: { nombreTipo: true } }
      }
    });

    if (!comisionMoises) {
      console.log('No se encontró comisión de Moises');
      return;
    }

    // Buscar categoría para comisiones
    let categoriaComisiones = await prisma.categoriaCuenta.findFirst({
      where: {
        OR: [
          { nombre: { contains: 'Comisiones', mode: 'insensitive' } },
          { nombre: { contains: 'Gastos Personal', mode: 'insensitive' } },
          { nombre: { contains: 'Gastos de Personal', mode: 'insensitive' } }
        ]
      }
    });

    if (!categoriaComisiones) {
      categoriaComisiones = await prisma.categoriaCuenta.findFirst({
        where: {
          tipo: 'gasto',
          activa: true
        }
      });
    }

    // Buscar caja principal
    const cajaPrincipal = await prisma.caja.findFirst({
      where: {
        OR: [
          { nombre: { equals: 'Caja', mode: 'insensitive' } },
          { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
          { tipo: 'general' }
        ],
        activa: true
      }
    });

    // Buscar usuario del sistema
    const sistemaUser = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: 'system' },
          { username: 'admin' },
          { username: 'Dadmin' }
        ]
      }
    });

    if (!categoriaComisiones || !cajaPrincipal || !sistemaUser) {
      console.log('Faltan datos necesarios:');
      console.log(`Categoría: ${categoriaComisiones ? '✓' : '✗'}`);
      console.log(`Caja: ${cajaPrincipal ? '✓' : '✗'}`);
      console.log(`Usuario: ${sistemaUser ? '✓' : '✗'}`);
      return;
    }

    console.log(`Creando movimiento para:`);
    console.log(`  Empleado: ${comisionMoises.empleado.nombres} ${comisionMoises.empleado.apellidos}`);
    console.log(`  Monto: ${comisionMoises.montoComision}`);
    console.log(`  Tipo: ${comisionMoises.tipoComision.nombreTipo}`);

    // Crear el movimiento contable
    const movimiento = await prisma.movimientoContable.create({
      data: {
        tipo: 'gasto',
        monto: parseFloat(comisionMoises.montoComision),
        categoriaId: categoriaComisiones.id,
        metodo: 'caja',
        cajaId: cajaPrincipal.id,
        descripcion: `Pago comisión - ${comisionMoises.empleado.nombres} ${comisionMoises.empleado.apellidos} - ${comisionMoises.tipoComision.nombreTipo}`,
        usuarioId: sistemaUser.id,
        fecha: comisionMoises.fechaPago || new Date()
      }
    });

    console.log(`✅ Movimiento creado: ID ${movimiento.id}`);

    // Recalcular saldo de caja
    const movimientos = await prisma.movimientoContable.groupBy({
      by: ['tipo'],
      where: { cajaId: cajaPrincipal.id },
      _sum: { monto: true }
    });

    let totalIngresos = 0;
    let totalGastos = 0;

    movimientos.forEach(m => {
      if (m.tipo === 'ingreso') {
        totalIngresos += parseFloat(m._sum.monto || 0);
      } else if (m.tipo === 'gasto') {
        totalGastos += parseFloat(m._sum.monto || 0);
      }
    });

    const saldoInicial = parseFloat(cajaPrincipal.saldoInicial);
    const nuevoSaldo = saldoInicial + totalIngresos - totalGastos;

    await prisma.caja.update({
      where: { id: cajaPrincipal.id },
      data: { saldoActual: nuevoSaldo }
    });

    console.log(`✅ Saldo de caja actualizado: ${nuevoSaldo}`);
    console.log(`  (Saldo anterior: ${cajaPrincipal.saldoActual})`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

crearMovimientoMoises();