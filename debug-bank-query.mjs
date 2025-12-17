import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugBankQuery() {
  console.log('🔍 Debug de consulta de bancos...\n');

  try {
    // Crear banco de prueba
    const testBank = await prisma.bank.create({
      data: {
        nombre: 'Banco Debug Test',
        codigo: 'DEBUG01',
        activo: true
      }
    });
    console.log(`✅ Banco creado: ${testBank.nombre} (ID: ${testBank.id})`);

    // Crear cuenta contable
    const cuentaContable = await prisma.cuentaContable.findFirst();
    if (!cuentaContable) {
      console.log('❌ No hay cuentas contables disponibles');
      return;
    }

    // Crear cuenta bancaria
    const testAccount = await prisma.cuentaBancaria.create({
      data: {
        bankId: testBank.id,
        numeroCuenta: 'DEBUG123',
        tipoCuenta: 'corriente',
        moneda: 'DOP',
        nombreOficialCuenta: 'Cuenta Debug',
        cuentaContableId: cuentaContable.id,
        activo: true
      }
    });
    console.log(`✅ Cuenta creada: ${testAccount.numeroCuenta}`);

    // Debug: Verificar diferentes formas de consultar
    console.log('\n🔍 Debug de consultas:');

    // Consulta 1: Contar cuentas activas
    const count1 = await prisma.cuentaBancaria.count({
      where: { bankId: testBank.id, activo: true }
    });
    console.log(`Consulta 1 - count({ bankId: id, activo: true }): ${count1}`);

    // Consulta 2: Buscar cuentas activas
    const accounts1 = await prisma.cuentaBancaria.findMany({
      where: { bankId: testBank.id, activo: true }
    });
    console.log(`Consulta 2 - findMany({ bankId: id, activo: true }): ${accounts1.length} cuentas`);

    // Consulta 3: Contar todas las cuentas del banco
    const count2 = await prisma.cuentaBancaria.count({
      where: { bankId: testBank.id }
    });
    console.log(`Consulta 3 - count({ bankId: id }): ${count2}`);

    // Consulta 4: Ver estado de la cuenta específica
    const specificAccount = await prisma.cuentaBancaria.findUnique({
      where: { id: testAccount.id }
    });
    console.log(`Consulta 4 - Estado de la cuenta específica: activo = ${specificAccount.activo}`);

    // Consulta 5: Ver todas las cuentas del banco
    const allAccounts = await prisma.cuentaBancaria.findMany({
      where: { bankId: testBank.id }
    });
    console.log('Consulta 5 - Todas las cuentas del banco:');
    allAccounts.forEach(acc => {
      console.log(`   - ID: ${acc.id}, Número: ${acc.numeroCuenta}, Activo: ${acc.activo}`);
    });

    console.log('\n🎯 Conclusión del debug:');
    if (count1 === 0) {
      console.log('❌ El problema está en la consulta - no encuentra cuentas activas cuando sí las hay');
    } else {
      console.log('✅ La consulta funciona correctamente');
    }

    // Limpiar datos de prueba
    await prisma.cuentaBancaria.update({
      where: { id: testAccount.id },
      data: { activo: false }
    });
    await prisma.bank.update({
      where: { id: testBank.id },
      data: { activo: false }
    });
    console.log('\n🧹 Datos de prueba limpiados');

  } catch (error) {
    console.error('❌ Error durante el debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBankQuery();
