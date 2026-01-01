const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function ajustarSaldoPorTraspasoEliminado() {
  try {
    console.log('=== AJUSTANDO SALDO POR TRASPASO ELIMINADO ===\n');

    // 1. Obtener caja principal
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

    console.log('📊 Estado actual de Caja Principal:');
    console.log(`   ID: ${cajaPrincipal.id}`);
    console.log(`   Nombre: ${cajaPrincipal.nombre}`);
    console.log(`   Saldo Actual: RD$${Number(cajaPrincipal.saldoActual)}`);
    console.log(`   Saldo Objetivo: RD$13200`);

    const saldoActual = Number(cajaPrincipal.saldoActual);
    const saldoObjetivo = 13200;
    const montoAjuste = saldoObjetivo - saldoActual;

    // 2. Buscar usuario del sistema
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: 'system' },
          { username: 'admin' },
          { username: 'Dadmin' }
        ]
      }
    });

    if (!usuario) {
      console.log('❌ No se encontró un usuario del sistema');
      return;
    }

    console.log(`👤 Usuario: ${usuario.username}`);

    // 3. Buscar categoría para ajustes o usar una categoría general
    let categoria = await prisma.categoriaCuenta.findFirst({
      where: { 
        OR: [
          { nombre: { contains: 'Ajuste', mode: 'insensitive' } },
          { nombre: { contains: 'Varios', mode: 'insensitive' } }
        ]
      }
    });

    if (!categoria) {
      // Si no existe, buscar cualquier categoría de ingreso
      categoria = await prisma.categoriaCuenta.findFirst({
        where: { tipo: 'ingreso' }
      });
    }

    if (!categoria) {
      console.log('❌ No se encontró una categoría válida. Creando una...');
      categoria = await prisma.categoriaCuenta.create({
        data: {
          nombre: 'Ajustes y Correcciones',
          tipo: 'ingreso'
        }
      });
    }

    console.log(`📁 Usando categoría: ${categoria.nombre}`);

    // 4. Crear movimiento de ajuste
    console.log(`\n🔧 Creando movimiento de ajuste por RD$${montoAjuste}...`);
    
    const movimiento = await prisma.movimientoContable.create({
      data: {
        tipo: 'ingreso',
        monto: montoAjuste,
        categoriaId: categoria.id,
        metodo: 'ajuste',
        cajaId: cajaPrincipal.id,
        descripcion: `Ajuste de saldo - Corrección después de traspaso eliminado`,
        usuarioId: usuario.id,
        fecha: new Date()
      }
    });

    console.log('✅ Movimiento de ajuste creado');
    console.log(`   ID: ${movimiento.id}`);
    console.log(`   Monto: RD$${Number(movimiento.monto)}`);

    // 5. Actualizar saldo de la caja directamente al valor objetivo
    console.log('\n🔧 Actualizando saldo de la caja...');
    const cajaActualizada = await prisma.caja.update({
      where: { id: cajaPrincipal.id },
      data: { saldoActual: saldoObjetivo }
    });

    console.log('✅ Saldo actualizado correctamente:');
    console.log(`   Saldo anterior: RD$${saldoActual}`);
    console.log(`   Saldo nuevo: RD$${Number(cajaActualizada.saldoActual)}`);

    // 6. También actualizar la cuenta contable asociada si existe
    if (cajaPrincipal.cuentaContableId) {
      console.log('\n🔧 Actualizando cuenta contable asociada...');
      await prisma.cuentaContable.update({
        where: { id: cajaPrincipal.cuentaContableId },
        data: { saldoActual: saldoObjetivo }
      });
      console.log('✅ Cuenta contable actualizada');
    }

    console.log('\n🎉 ¡AJUSTE COMPLETADO!');
    console.log(`   El saldo de Caja Principal ahora es: RD$${saldoObjetivo}`);
    console.log(`   Se creó un movimiento de ajuste por: RD$${montoAjuste}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

ajustarSaldoPorTraspasoEliminado();
