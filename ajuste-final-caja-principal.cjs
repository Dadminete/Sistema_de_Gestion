const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function ajusteFinalCajaPrincipal() {
  try {
    console.log('=== AJUSTE FINAL CAJA PRINCIPAL ===\n');

    const cajaPrincipal = await prisma.caja.findFirst({
      where: {
        OR: [
          { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
          { tipo: 'general' }
        ],
        activa: true
      }
    });

    if (!cajaPrincipal) {
      console.log('❌ NO se encontró Caja Principal');
      return;
    }

    const saldoActual = Number(cajaPrincipal.saldoActual);
    const saldoObjetivo = 10535;
    const ajusteNecesario = saldoObjetivo - saldoActual;

    console.log('📊 Estado actual:');
    console.log(`   Saldo Actual: RD$${saldoActual}`);
    console.log(`   Saldo Objetivo: RD$${saldoObjetivo}`);
    console.log(`   Ajuste Necesario: RD$${ajusteNecesario} (${ajusteNecesario > 0 ? 'ingreso' : 'gasto'})`);

    // Buscar usuario
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: 'system' },
          { username: 'admin' },
          { username: 'Dadmin' }
        ]
      }
    });

    // Buscar categoría
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

    console.log('\n🔧 Creando movimiento de ajuste...');

    const movimiento = await prisma.movimientoContable.create({
      data: {
        tipo: ajusteNecesario > 0 ? 'ingreso' : 'gasto',
        monto: Math.abs(ajusteNecesario),
        categoriaId: categoria.id,
        metodo: 'ajuste',
        cajaId: cajaPrincipal.id,
        descripcion: `Ajuste final - Corrección de saldo a RD$10,535`,
        usuarioId: usuario.id,
        fecha: new Date()
      }
    });

    console.log(`   ✅ Movimiento creado (ID: ${movimiento.id})`);
    console.log(`   Tipo: ${movimiento.tipo}`);
    console.log(`   Monto: RD$${Number(movimiento.monto)}`);

    // Actualizar saldo
    await prisma.caja.update({
      where: { id: cajaPrincipal.id },
      data: { saldoActual: saldoObjetivo }
    });

    if (cajaPrincipal.cuentaContableId) {
      await prisma.cuentaContable.update({
        where: { id: cajaPrincipal.cuentaContableId },
        data: { saldoActual: saldoObjetivo }
      });
    }

    console.log('\n🎉 ¡AJUSTE COMPLETADO!');
    console.log(`   Saldo Final Caja Principal: RD$${saldoObjetivo}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

ajusteFinalCajaPrincipal();
