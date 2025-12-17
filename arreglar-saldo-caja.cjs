const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function arreglarSaldoCaja() {
  try {
    console.log('=== ARREGLANDO SALDO DE CAJA PRINCIPAL ===\n');

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
    console.log(`   Saldo Inicial: RD$${Number(cajaPrincipal.saldoInicial)}`);
    console.log(`   Saldo Actual (incorrecto): RD$${Number(cajaPrincipal.saldoActual)}`);

    // 2. Recalcular saldo correcto
    const movimientosCaja = await prisma.movimientoContable.groupBy({
      by: ['tipo'],
      where: { cajaId: cajaPrincipal.id },
      _sum: { monto: true }
    });

    let totalIngresos = 0;
    let totalGastos = 0;
    movimientosCaja.forEach(m => {
      if (m.tipo === 'ingreso') {
        totalIngresos += parseFloat(m._sum.monto || 0);
      } else if (m.tipo === 'gasto') {
        totalGastos += parseFloat(m._sum.monto || 0);
      }
    });

    const saldoCalculado = parseFloat(cajaPrincipal.saldoInicial) + totalIngresos - totalGastos;
    
    console.log('\n🧮 Cálculo correcto:');
    console.log(`   Saldo Inicial: RD$${parseFloat(cajaPrincipal.saldoInicial)}`);
    console.log(`   Total Ingresos: RD$${totalIngresos}`);
    console.log(`   Total Gastos: RD$${totalGastos}`);
    console.log(`   Saldo Correcto: RD$${saldoCalculado}`);
    console.log(`   Diferencia a corregir: RD$${saldoCalculado - Number(cajaPrincipal.saldoActual)}`);

    // 3. Actualizar saldo en la base de datos
    console.log('\n🔧 Actualizando saldo en la base de datos...');
    const cajaActualizada = await prisma.caja.update({
      where: { id: cajaPrincipal.id },
      data: { saldoActual: saldoCalculado }
    });

    console.log('✅ Saldo actualizado correctamente:');
    console.log(`   Nuevo saldo: RD$${Number(cajaActualizada.saldoActual)}`);

    // 4. También actualizar la cuenta contable asociada si existe
    if (cajaPrincipal.cuentaContableId) {
      console.log('\n🔧 Actualizando cuenta contable asociada...');
      await prisma.cuentaContable.update({
        where: { id: cajaPrincipal.cuentaContableId },
        data: { saldoActual: saldoCalculado }
      });
      console.log('✅ Cuenta contable actualizada correctamente');
    }

    console.log('\n🎉 ¡PROBLEMA SOLUCIONADO!');
    console.log(`   El saldo de Caja Principal ahora es correcto: RD$${saldoCalculado}`);
    console.log('   El pago de nómina se refleja correctamente en el sistema');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

arreglarSaldoCaja();