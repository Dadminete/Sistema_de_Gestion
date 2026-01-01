const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function rehacerAjustes() {
  try {
    console.log('=== REHACIENDO AJUSTES CORRECTAMENTE ===\n');

    // 1. Eliminar TODOS los ajustes existentes
    const ajustes = await prisma.movimientoContable.findMany({
      where: { metodo: 'ajuste' }
    });

    console.log(`🗑️  Eliminando ${ajustes.length} movimientos de ajuste existentes...\n`);

    for (const ajuste of ajustes) {
      await prisma.movimientoContable.delete({
        where: { id: ajuste.id }
      });
      console.log(`   ✅ Eliminado: ${ajuste.id}`);
    }

    // 2. Obtener cajas
    const cajaPrincipal = await prisma.caja.findFirst({
      where: {
        OR: [
          { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
          { tipo: 'general' }
        ],
        activa: true
      }
    });

    const cajaFuerte = await prisma.caja.findFirst({
      where: {
        nombre: { contains: 'Fuerte', mode: 'insensitive' },
        activa: true
      }
    });

    if (!cajaPrincipal || !cajaFuerte) {
      console.log('❌ No se encontraron las cajas');
      return;
    }

    // 3. Calcular saldos actuales SIN ajustes
    const calcularSaldo = async (cajaId, saldoInicial) => {
      const movimientos = await prisma.movimientoContable.groupBy({
        by: ['tipo'],
        where: { cajaId },
        _sum: { monto: true }
      });

      let ingresos = 0;
      let gastos = 0;

      movimientos.forEach(m => {
        if (m.tipo === 'ingreso') {
          ingresos += parseFloat(m._sum.monto || 0);
        } else if (m.tipo === 'gasto') {
          gastos += parseFloat(m._sum.monto || 0);
        }
      });

      return parseFloat(saldoInicial) + ingresos - gastos;
    };

    const saldoCalculadoPrincipal = await calcularSaldo(cajaPrincipal.id, cajaPrincipal.saldoInicial);
    const saldoCalculadoFuerte = await calcularSaldo(cajaFuerte.id, cajaFuerte.saldoInicial);

    console.log('\n📊 Saldos calculados (sin ajustes):');
    console.log(`   Caja Principal: RD$${saldoCalculadoPrincipal}`);
    console.log(`   Caja Fuerte: RD$${saldoCalculadoFuerte}`);

    console.log('\n🎯 Saldos objetivo:');
    console.log(`   Caja Principal: RD$-105535`);
    console.log(`   Caja Fuerte: RD$13200`);

    const ajustePrincipal = -105535 - saldoCalculadoPrincipal;
    const ajusteFuerte = 13200 - saldoCalculadoFuerte;

    console.log('\n🧮 Ajustes necesarios:');
    console.log(`   Caja Principal: RD$${ajustePrincipal} (${ajustePrincipal > 0 ? 'ingreso' : 'gasto'})`);
    console.log(`   Caja Fuerte: RD$${ajusteFuerte} (${ajusteFuerte > 0 ? 'ingreso' : 'gasto'})`);

    // 4. Buscar usuario y categoría
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: 'system' },
          { username: 'admin' },
          { username: 'Dadmin' }
        ]
      }
    });

    let categoria = await prisma.categoriaCuenta.findFirst({
      where: { 
        OR: [
          { nombre: { contains: 'Ajuste', mode: 'insensitive' } },
          { nombre: { contains: 'Varios', mode: 'insensitive' } }
        ]
      }
    });

    if (!categoria) {
      categoria = await prisma.categoriaCuenta.findFirst({
        where: { tipo: 'ingreso' }
      });
    }

    if (!usuario || !categoria) {
      console.log('❌ No se encontró usuario o categoría');
      return;
    }

    // 5. Crear ajustes si son necesarios
    console.log('\n🔧 Creando ajustes...\n');

    if (Math.abs(ajustePrincipal) > 0.01) {
      const mov = await prisma.movimientoContable.create({
        data: {
          tipo: ajustePrincipal > 0 ? 'ingreso' : 'gasto',
          monto: Math.abs(ajustePrincipal),
          categoriaId: categoria.id,
          metodo: 'ajuste',
          cajaId: cajaPrincipal.id,
          descripcion: `Ajuste de saldo - Corrección tras eliminar traspaso`,
          usuarioId: usuario.id,
          fecha: new Date()
        }
      });
      console.log(`   ✅ Caja Principal: Movimiento de ${mov.tipo} por RD$${Math.abs(ajustePrincipal)}`);
      
      await prisma.caja.update({
        where: { id: cajaPrincipal.id },
        data: { saldoActual: -105535 }
      });

      if (cajaPrincipal.cuentaContableId) {
        await prisma.cuentaContable.update({
          where: { id: cajaPrincipal.cuentaContableId },
          data: { saldoActual: -105535 }
        });
      }
    }

    if (Math.abs(ajusteFuerte) > 0.01) {
      const mov = await prisma.movimientoContable.create({
        data: {
          tipo: ajusteFuerte > 0 ? 'ingreso' : 'gasto',
          monto: Math.abs(ajusteFuerte),
          categoriaId: categoria.id,
          metodo: 'ajuste',
          cajaId: cajaFuerte.id,
          descripcion: `Ajuste de saldo - Corrección tras eliminar traspaso`,
          usuarioId: usuario.id,
          fecha: new Date()
        }
      });
      console.log(`   ✅ Caja Fuerte: Movimiento de ${mov.tipo} por RD$${Math.abs(ajusteFuerte)}`);
      
      await prisma.caja.update({
        where: { id: cajaFuerte.id },
        data: { saldoActual: 13200 }
      });

      if (cajaFuerte.cuentaContableId) {
        await prisma.cuentaContable.update({
          where: { id: cajaFuerte.cuentaContableId },
          data: { saldoActual: 13200 }
        });
      }
    }

    console.log('\n🎉 ¡AJUSTES COMPLETADOS CORRECTAMENTE!');
    console.log(`   Caja Principal: RD$-105535`);
    console.log(`   Caja Fuerte: RD$13200`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

rehacerAjustes();
