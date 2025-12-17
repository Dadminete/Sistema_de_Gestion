const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function crearCajasIniciales() {
  console.log('🚀 Creando cajas iniciales...\n');

  try {
    // 1. Verificar si hay un usuario activo para asignar como responsable
    const primerUsuario = await prisma.usuario.findFirst({
      where: { activo: true },
      select: { id: true, nombre: true, apellido: true }
    });

    if (!primerUsuario) {
      console.log('⚠️  No hay usuarios activos en la base de datos');
      console.log('💡 Necesitas crear un usuario primero o ejecutar este script sin responsable');
      return;
    }

    console.log(`✅ Usuario encontrado: ${primerUsuario.nombre} ${primerUsuario.apellido}`);
    console.log(`   ID: ${primerUsuario.id}\n`);

    // 2. Crear cuentas contables para las cajas
    console.log('📊 Creando cuentas contables...');

    const cuentaCajaPrincipal = await prisma.cuentaContable.create({
      data: {
        codigo: '1101-001',
        nombre: 'Caja Principal',
        tipoCuenta: 'caja',
        moneda: 'DOP',
        saldoInicial: 0,
        saldoActual: 0,
        activa: true
      }
    });
    console.log(`   ✅ Cuenta contable creada: ${cuentaCajaPrincipal.nombre} (${cuentaCajaPrincipal.codigo})`);

    const cuentaCajaPapeleria = await prisma.cuentaContable.create({
      data: {
        codigo: '1101-002',
        nombre: 'Caja Papelería',
        tipoCuenta: 'caja',
        moneda: 'DOP',
        saldoInicial: 0,
        saldoActual: 0,
        activa: true
      }
    });
    console.log(`   ✅ Cuenta contable creada: ${cuentaCajaPapeleria.nombre} (${cuentaCajaPapeleria.codigo})\n`);

    // 3. Crear las cajas operativas vinculadas
    console.log('💰 Creando cajas operativas...');

    const cajaPrincipal = await prisma.caja.create({
      data: {
        nombre: 'Caja',
        descripcion: 'Caja principal del sistema',
        tipo: 'efectivo',
        cuentaContableId: cuentaCajaPrincipal.id,
        responsableId: primerUsuario.id,
        saldoInicial: 0,
        saldoActual: 0,
        activa: true
      }
    });
    console.log(`   ✅ Caja creada: ${cajaPrincipal.nombre}`);
    console.log(`      ID: ${cajaPrincipal.id}`);
    console.log(`      Vinculada con: ${cuentaCajaPrincipal.nombre}\n`);

    const cajaPapeleria = await prisma.caja.create({
      data: {
        nombre: 'Papeleria',
        descripcion: 'Caja para ventas de papelería',
        tipo: 'efectivo',
        cuentaContableId: cuentaCajaPapeleria.id,
        responsableId: primerUsuario.id,
        saldoInicial: 0,
        saldoActual: 0,
        activa: true
      }
    });
    console.log(`   ✅ Caja creada: ${cajaPapeleria.nombre}`);
    console.log(`      ID: ${cajaPapeleria.id}`);
    console.log(`      Vinculada con: ${cuentaCajaPapeleria.nombre}\n`);

    // 4. Resumen
    console.log('🎉 ¡Cajas creadas exitosamente!\n');
    console.log('📋 Resumen:');
    console.log('   ✅ 2 Cuentas contables creadas');
    console.log('   ✅ 2 Cajas operativas creadas');
    console.log('   ✅ Cajas vinculadas con cuentas contables');
    console.log('   ✅ Responsable asignado\n');

    console.log('🔑 IDs de las cajas (guarda estos para referencia):');
    console.log(`   - Caja Principal: ${cajaPrincipal.id}`);
    console.log(`   - Caja Papelería: ${cajaPapeleria.id}\n`);

    console.log('✨ Ahora puedes:');
    console.log('   1. Hacer aperturas de caja desde el frontend');
    console.log('   2. Registrar movimientos contables con cajaId');
    console.log('   3. Ver los movimientos por caja en tus datatables');

  } catch (error) {
    if (error.code === 'P2002') {
      console.error('\n❌ Error: Ya existen cajas o cuentas con estos códigos');
      console.error('💡 Solución: Elimina las cajas existentes o usa códigos diferentes');
    } else {
      console.error('\n❌ Error al crear cajas:', error.message);
      console.error(error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

crearCajasIniciales();
