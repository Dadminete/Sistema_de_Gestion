const prisma = require('./server/prismaClient');

async function debugPagosClientes() {
  try {
    console.log('\n=== VERIFICANDO PAGOS DE CLIENTES ===\n');

    // Obtener todos los pagos confirmados
    const pagos = await prisma.pagoCliente.findMany({
      where: {
        estado: 'confirmado'
      },
      include: {
        cliente: {
          select: { nombre: true, apellidos: true }
        },
        caja: {
          select: { id: true, nombre: true }
        },
        cuentaBancaria: {
          select: { id: true, numeroCuenta: true }
        }
      },
      orderBy: { fechaPago: 'desc' },
      take: 20
    });

    console.log(`Total de pagos confirmados: ${pagos.length}\n`);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const pagosHoy = pagos.filter(p => {
      const fechaPago = new Date(p.fechaPago);
      fechaPago.setHours(0, 0, 0, 0);
      return fechaPago.getTime() === hoy.getTime();
    });

    console.log(`Pagos de hoy: ${pagosHoy.length}\n`);

    pagos.forEach(pago => {
      const fecha = new Date(pago.fechaPago).toLocaleString('es-ES');
      const cliente = `${pago.cliente.nombre} ${pago.cliente.apellidos}`;
      const metodo = pago.caja ? `CAJA: ${pago.caja.nombre}` : pago.cuentaBancaria ? `BANCO: ${pago.cuentaBancaria.numeroCuenta}` : 'DESCONOCIDO';
      
      console.log(`📝 ${pago.numeroPago}`);
      console.log(`   Fecha: ${fecha}`);
      console.log(`   Cliente: ${cliente}`);
      console.log(`   Monto: RD$ ${parseFloat(pago.monto)}`);
      console.log(`   Método: ${metodo}`);
      console.log(`   cajaId: ${pago.cajaId || 'NULL'}`);
      console.log(`   cuentaBancariaId: ${pago.cuentaBancariaId || 'NULL'}`);
      console.log('');
    });

    // Verificar pagos sin caja ni cuenta
    const pagosRaros = await prisma.pagoCliente.findMany({
      where: {
        estado: 'confirmado',
        AND: [
          { cajaId: null },
          { cuentaBancariaId: null }
        ]
      }
    });

    if (pagosRaros.length > 0) {
      console.log(`⚠️  Advertencia: ${pagosRaros.length} pago(s) sin caja ni cuenta bancaria`);
    }

    // Verificar cajas disponibles
    console.log('\n=== CAJAS DISPONIBLES ===\n');
    const cajas = await prisma.caja.findMany({
      where: { activa: true }
    });

    cajas.forEach(caja => {
      console.log(`${caja.nombre} (${caja.id}): ${caja.activa ? 'ACTIVA' : 'INACTIVA'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPagosClientes();
