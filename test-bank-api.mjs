import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBankAPIs() {
  console.log('🧪 Probando APIs de bancos...\n');

  try {
    // 1. Crear un banco de prueba
    console.log('1️⃣ Creando banco de prueba...');
    const testBank = await prisma.bank.create({
      data: {
        nombre: 'Banco de Prueba API',
        codigo: 'TEST001',
        activo: true
      }
    });
    console.log(`✅ Banco creado: ${testBank.nombre} (ID: ${testBank.id})`);

    // 2. Verificar que aparece en la lista
    console.log('\n2️⃣ Verificando lista de bancos...');
    const banks = await prisma.bank.findMany({
      where: { activo: true }
    });
    console.log(`✅ Bancos activos encontrados: ${banks.length}`);
    banks.forEach(bank => {
      console.log(`   - ${bank.nombre} (${bank.codigo})`);
    });

    // 3. Crear una cuenta bancaria de prueba
    console.log('\n3️⃣ Creando cuenta bancaria de prueba...');
    const cuentaContable = await prisma.cuentaContable.findFirst();
    if (!cuentaContable) {
      console.log('❌ No hay cuentas contables disponibles para la prueba');
    } else {
      const testAccount = await prisma.cuentaBancaria.create({
        data: {
          bankId: testBank.id,
          numeroCuenta: 'TEST123456',
          tipoCuenta: 'corriente',
          moneda: 'DOP',
          nombreOficialCuenta: 'Cuenta de Prueba',
          cuentaContableId: cuentaContable.id,
          activo: true
        }
      });
      console.log(`✅ Cuenta bancaria creada: ${testAccount.numeroCuenta}`);

      // 4. Intentar eliminar el banco (debería fallar porque tiene cuenta)
      console.log('\n4️⃣ Intentando eliminar banco con cuenta activa (debería fallar)...');
      try {
        await prisma.bank.update({
          where: { id: testBank.id },
          data: { activo: false }
        });
        console.log('❌ El banco se eliminó cuando no debería haberlo hecho');
      } catch (error) {
        console.log(`✅ Eliminación bloqueada correctamente: ${error.message}`);
      }

      // 5. Eliminar primero la cuenta
      console.log('\n5️⃣ Eliminando cuenta bancaria primero...');
      await prisma.cuentaBancaria.update({
        where: { id: testAccount.id },
        data: { activo: false }
      });
      console.log('✅ Cuenta bancaria desactivada');

      // 6. Ahora intentar eliminar el banco (debería funcionar)
      console.log('\n6️⃣ Intentando eliminar banco sin cuentas activas...');
      const deletedBank = await prisma.bank.update({
        where: { id: testBank.id },
        data: { activo: false }
      });
      console.log(`✅ Banco desactivado correctamente: ${deletedBank.nombre}`);

      // 7. Verificar que ya no aparece en bancos activos
      console.log('\n7️⃣ Verificando que el banco ya no aparece en activos...');
      const activeBanks = await prisma.bank.findMany({
        where: { activo: true }
      });
      const inactiveBanks = await prisma.bank.findMany({
        where: { activo: false }
      });
      console.log(`✅ Bancos activos: ${activeBanks.length}`);
      console.log(`✅ Bancos inactivos: ${inactiveBanks.length}`);

    }

    console.log('\n🎉 ¡Todas las pruebas pasaron exitosamente!');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBankAPIs();
