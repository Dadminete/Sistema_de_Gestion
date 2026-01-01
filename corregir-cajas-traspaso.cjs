const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function corregirCajasTraspaso() {
  try {
    console.log('=== CORRIGIENDO CAJAS DESPUÉS DE TRASPASO ELIMINADO ===\n');

    // 1. Obtener ambas cajas
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

    if (!cajaPrincipal) {
      console.log('❌ NO se encontró Caja Principal');
      return;
    }

    if (!cajaFuerte) {
      console.log('❌ NO se encontró Caja Fuerte');
      return;
    }

    console.log('📊 Estado actual de las cajas:');
    console.log(`\n   CAJA PRINCIPAL:`);
    console.log(`   ID: ${cajaPrincipal.id}`);
    console.log(`   Saldo Actual: RD$${Number(cajaPrincipal.saldoActual)}`);
    console.log(`   Saldo Objetivo: RD$-105535`);

    console.log(`\n   CAJA FUERTE:`);
    console.log(`   ID: ${cajaFuerte.id}`);
    console.log(`   Saldo Actual: RD$${Number(cajaFuerte.saldoActual)}`);
    console.log(`   Saldo Objetivo: RD$13200`);

    const saldoActualPrincipal = Number(cajaPrincipal.saldoActual);
    const saldoObjetivoPrincipal = -105535;
    const ajustePrincipal = saldoObjetivoPrincipal - saldoActualPrincipal;

    const saldoActualFuerte = Number(cajaFuerte.saldoActual);
    const saldoObjetivoFuerte = 13200;
    const ajusteFuerte = saldoObjetivoFuerte - saldoActualFuerte;

    console.log(`\n🧮 Ajustes necesarios:`);
    console.log(`   Caja Principal: RD$${ajustePrincipal} (${ajustePrincipal > 0 ? 'ingreso' : 'gasto'})`);
    console.log(`   Caja Fuerte: RD$${ajusteFuerte} (${ajusteFuerte > 0 ? 'ingreso' : 'gasto'})`);

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

    // 3. Buscar categoría para ajustes
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

    if (!categoria) {
      console.log('❌ No se encontró una categoría válida');
      return;
    }

    // 4. AJUSTAR CAJA PRINCIPAL
    if (ajustePrincipal !== 0) {
      console.log(`\n🔧 Ajustando Caja Principal...`);
      
      const movimientoPrincipal = await prisma.movimientoContable.create({
        data: {
          tipo: ajustePrincipal > 0 ? 'ingreso' : 'gasto',
          monto: Math.abs(ajustePrincipal),
          categoriaId: categoria.id,
          metodo: 'ajuste',
          cajaId: cajaPrincipal.id,
          descripcion: `Ajuste de Caja Principal - Corrección de traspaso eliminado`,
          usuarioId: usuario.id,
          fecha: new Date()
        }
      });

      await prisma.caja.update({
        where: { id: cajaPrincipal.id },
        data: { saldoActual: saldoObjetivoPrincipal }
      });

      if (cajaPrincipal.cuentaContableId) {
        await prisma.cuentaContable.update({
          where: { id: cajaPrincipal.cuentaContableId },
          data: { saldoActual: saldoObjetivoPrincipal }
        });
      }

      console.log(`   ✅ Movimiento creado (ID: ${movimientoPrincipal.id})`);
      console.log(`   ✅ Saldo actualizado: RD$${saldoObjetivoPrincipal}`);
    }

    // 5. AJUSTAR CAJA FUERTE
    if (ajusteFuerte !== 0) {
      console.log(`\n🔧 Ajustando Caja Fuerte...`);
      
      const movimientoFuerte = await prisma.movimientoContable.create({
        data: {
          tipo: ajusteFuerte > 0 ? 'ingreso' : 'gasto',
          monto: Math.abs(ajusteFuerte),
          categoriaId: categoria.id,
          metodo: 'ajuste',
          cajaId: cajaFuerte.id,
          descripcion: `Ajuste de Caja Fuerte - Corrección de traspaso eliminado`,
          usuarioId: usuario.id,
          fecha: new Date()
        }
      });

      await prisma.caja.update({
        where: { id: cajaFuerte.id },
        data: { saldoActual: saldoObjetivoFuerte }
      });

      if (cajaFuerte.cuentaContableId) {
        await prisma.cuentaContable.update({
          where: { id: cajaFuerte.cuentaContableId },
          data: { saldoActual: saldoObjetivoFuerte }
        });
      }

      console.log(`   ✅ Movimiento creado (ID: ${movimientoFuerte.id})`);
      console.log(`   ✅ Saldo actualizado: RD$${saldoObjetivoFuerte}`);
    }

    console.log('\n🎉 ¡CORRECCIÓN COMPLETADA!');
    console.log(`   Caja Principal: RD$${saldoObjetivoPrincipal}`);
    console.log(`   Caja Fuerte: RD$${saldoObjetivoFuerte}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

corregirCajasTraspaso();
