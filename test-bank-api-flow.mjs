// Script para probar el flujo completo de la API de bancos
// Simulando exactamente lo que hace el controlador

import { PrismaClient } from '@prisma/client';

const bankService = {
  deleteBank: async (id) => {
    const prisma = new PrismaClient();

    try {
      console.log(`🔍 [SERVICE] Intentando eliminar banco con ID: ${id}`);

      // Verificar si existe el banco primero
      const bankExists = await prisma.bank.findUnique({
        where: { id }
      });

      if (!bankExists) {
        console.log(`❌ [SERVICE] Banco con ID ${id} no encontrado`);
        throw new Error('Banco no encontrado');
      }

      console.log(`✅ [SERVICE] Banco encontrado: ${bankExists.nombre} (Activo: ${bankExists.activo})`);

      // Verificar si tiene cuentas activas
      console.log(`🔍 [SERVICE] Verificando cuentas activas para banco ${id}...`);
      const cuentasActivas = await prisma.cuentaBancaria.count({
        where: { bankId: id, activo: true }
      });

      console.log(`📊 [SERVICE] Cuentas activas encontradas: ${cuentasActivas}`);

      if (cuentasActivas > 0) {
        const errorMsg = `No se puede eliminar el banco "${bankExists.nombre}" porque tiene ${cuentasActivas} cuenta(s) activa(s) asociada(s). Desactive primero todas las cuentas bancarias.`;
        console.log(`❌ [SERVICE] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      console.log('✅ [SERVICE] Procediendo con la desactivación del banco...');
      const deletedBank = await prisma.bank.update({
        where: { id },
        data: {
          activo: false,
          updatedAt: new Date()
        }
      });

      console.log(`✅ [SERVICE] Banco "${deletedBank.nombre}" desactivado exitosamente`);
      return deletedBank;
    } catch (error) {
      console.error('❌ [SERVICE] Error en deleteBank:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
};

async function testBankAPIFlow() {
  console.log('🌐 Probando flujo completo de API de bancos...\n');

  try {
    // Crear banco de prueba
    const prisma = new PrismaClient();

    const testBank = await prisma.bank.create({
      data: {
        nombre: 'Banco API Flow Test',
        codigo: 'FLOW01',
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
        numeroCuenta: 'FLOW123',
        tipoCuenta: 'corriente',
        moneda: 'DOP',
        nombreOficialCuenta: 'Cuenta Flow Test',
        cuentaContableId: cuentaContable.id,
        activo: true
      }
    });
    console.log(`✅ Cuenta creada: ${testAccount.numeroCuenta}`);

    // Probar el flujo completo de eliminación
    console.log('\n🚀 Probando flujo completo de eliminación...');

    try {
      console.log(`\n📞 [FRONTEND] Llamando a DELETE /api/banks/${testBank.id}`);
      const result = await bankService.deleteBank(testBank.id);

      console.log('❌ ERROR: El banco se eliminó cuando no debería haberlo hecho');
      console.log('Resultado:', result);

    } catch (error) {
      console.log(`\n✅ [FRONTEND] Eliminación correctamente bloqueada`);
      console.log(`📄 Mensaje de error: ${error.message}`);

      // Verificar que el banco sigue activo
      const bankAfterFailedDelete = await prisma.bank.findUnique({
        where: { id: testBank.id }
      });
      console.log(`📊 Estado del banco después del intento fallido: ${bankAfterFailedDelete.activo ? 'ACTIVO' : 'INACTIVO'}`);

      // Ahora probar el flujo correcto: desactivar cuenta primero
      console.log('\n🔄 [FRONTEND] Desactivando cuenta primero...');
      await prisma.cuentaBancaria.update({
        where: { id: testAccount.id },
        data: { activo: false }
      });
      console.log('✅ Cuenta desactivada');

      // Ahora intentar eliminar el banco
      console.log('\n✅ [FRONTEND] Intentando eliminar banco sin cuentas activas...');
      const deleteResult = await bankService.deleteBank(testBank.id);
      console.log(`✅ Banco eliminado correctamente: ${deleteResult.nombre}`);

      // Verificar estado final
      const finalBankState = await prisma.bank.findUnique({
        where: { id: testBank.id }
      });
      console.log(`📊 Estado final del banco: ${finalBankState.activo ? 'ACTIVO' : 'INACTIVO'}`);

    }

    console.log('\n🎉 ¡Flujo de API probado exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la prueba del flujo:', error);
  }
}

testBankAPIFlow();
