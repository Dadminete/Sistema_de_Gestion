import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBankDeletion() {
  console.log('🔍 Probando eliminación de bancos con cuentas activas...\n');

  try {
    // Crear banco de prueba
    const testBank = await prisma.bank.create({
      data: {
        nombre: 'Banco Test Eliminación',
        codigo: 'TESTDEL',
        activo: true
      }
    });
    console.log(`✅ Banco creado: ${testBank.nombre} (ID: ${testBank.id})`);

    // Crear cuenta contable si no existe
    let cuentaContable = await prisma.cuentaContable.findFirst();
    if (!cuentaContable) {
      cuentaContable = await prisma.categoriaCuenta.findFirst();
      if (cuentaContable) {
        cuentaContable = await prisma.cuentaContable.create({
          data: {
            codigo: 'TEST001',
            nombre: 'Cuenta Test',
            categoriaId: cuentaContable.id,
            tipoCuenta: 'Banco',
            moneda: 'DOP',
            saldoInicial: 0,
            saldoActual: 0,
            activa: true
          }
        });
      }
    }

    if (cuentaContable) {
      // Crear cuenta bancaria activa
      const testAccount = await prisma.cuentaBancaria.create({
        data: {
          bankId: testBank.id,
          numeroCuenta: 'TESTDELETE123',
          tipoCuenta: 'corriente',
          moneda: 'DOP',
          nombreOficialCuenta: 'Cuenta para Test de Eliminación',
          cuentaContableId: cuentaContable.id,
          activo: true
        }
      });
      console.log(`✅ Cuenta bancaria creada: ${testAccount.numeroCuenta}`);

      // Verificar estado antes de intentar eliminar
      const cuentasActivas = await prisma.cuentaBancaria.count({
        where: { bankId: testBank.id, activo: true }
      });
      console.log(`📊 Cuentas activas antes de eliminación: ${cuentasActivas}`);

      // Intentar eliminar banco (debería fallar)
      console.log('\n🚫 Intentando eliminar banco con cuenta activa...');
      try {
        await prisma.bank.update({
          where: { id: testBank.id },
          data: { activo: false }
        });
        console.log('❌ ERROR: El banco se eliminó cuando no debería');
      } catch (error) {
        console.log(`✅ Eliminación correctamente bloqueada: ${error.message}`);
      }

      // Verificar que el banco sigue activo
      const bankAfterFailedDelete = await prisma.bank.findUnique({
        where: { id: testBank.id }
      });
      console.log(`📊 Estado del banco después del intento fallido: ${bankAfterFailedDelete.activo ? 'ACTIVO' : 'INACTIVO'}`);

      // Ahora desactivar la cuenta primero
      console.log('\n🔄 Desactivando cuenta bancaria primero...');
      await prisma.cuentaBancaria.update({
        where: { id: testAccount.id },
        data: { activo: false }
      });
      console.log('✅ Cuenta bancaria desactivada');

      // Verificar cuentas activas después de desactivar
      const cuentasActivasAfter = await prisma.cuentaBancaria.count({
        where: { bankId: testBank.id, activo: true }
      });
      console.log(`📊 Cuentas activas después de desactivar: ${cuentasActivasAfter}`);

      // Ahora intentar eliminar el banco (debería funcionar)
      console.log('\n✅ Intentando eliminar banco sin cuentas activas...');
      const deletedBank = await prisma.bank.update({
        where: { id: testBank.id },
        data: { activo: false }
      });
      console.log(`✅ Banco desactivado correctamente: ${deletedBank.nombre}`);

      // Verificar estado final
      const finalBankState = await prisma.bank.findUnique({
        where: { id: testBank.id }
      });
      console.log(`📊 Estado final del banco: ${finalBankState.activo ? 'ACTIVO' : 'INACTIVO'}`);

      // Verificar bancos activos vs inactivos
      const activeBanks = await prisma.bank.count({ where: { activo: true } });
      const inactiveBanks = await prisma.bank.count({ where: { activo: false } });
      console.log(`📊 Total bancos activos: ${activeBanks}, inactivos: ${inactiveBanks}`);

    } else {
      console.log('❌ No se pudo crear cuenta contable para la prueba');
    }

    console.log('\n🎉 ¡Prueba completada!');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBankDeletion();
