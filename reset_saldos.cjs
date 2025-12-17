const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetSaldos() {
  try {
    console.log('Reseteando saldos de cuentas contables a 0...');

    const result = await prisma.cuentaContable.updateMany({
      where: { activa: true },
      data: {
        saldoActual: 0,
        saldoInicial: 0
      }
    });

    console.log(`Actualizadas ${result.count} cuentas contables.`);

    // También resetear saldos de cajas
    const cajasResult = await prisma.caja.updateMany({
      where: { activa: true },
      data: {
        saldoActual: 0,
        saldoInicial: 0
      }
    });

    console.log(`Actualizadas ${cajasResult.count} cajas.`);

    // Resetear saldos de cuentas bancarias si es necesario
    const bancosResult = await prisma.cuentaBancaria.updateMany({
      where: { activo: true },
      data: {}
    });

    console.log('Saldos reseteados exitosamente.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetSaldos();