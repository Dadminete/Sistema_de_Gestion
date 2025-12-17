const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function vincularCuentasAntiguas() {
  console.log('🔗 Vinculando cuentas contables antiguas con cajas operativas...\n');

  try {
    // Obtener el primer usuario activo
    const primerUsuario = await prisma.usuario.findFirst({
      where: { activo: true },
      select: { id: true, nombre: true, apellido: true }
    });

    if (!primerUsuario) {
      console.log('⚠️  No hay usuarios activos');
      return;
    }

    console.log(`✅ Usuario responsable: ${primerUsuario.nombre} ${primerUsuario.apellido}\n`);

    // 1. Cuenta "001 - Caja" -> Crear caja operativa
    const cuentaCaja001 = await prisma.cuentaContable.findFirst({
      where: { codigo: '001' }
    });

    if (cuentaCaja001) {
      console.log(`📦 Procesando cuenta: ${cuentaCaja001.codigo} - ${cuentaCaja001.nombre}`);
      
      // Verificar si ya existe una caja con este nombre
      const cajaExistente = await prisma.caja.findFirst({
        where: { 
          OR: [
            { nombre: 'Caja' },
            { cuentaContableId: cuentaCaja001.id }
          ]
        }
      });

      if (cajaExistente && cajaExistente.cuentaContableId === cuentaCaja001.id) {
        console.log(`   ✅ Ya existe caja vinculada: ${cajaExistente.nombre}\n`);
      } else if (cajaExistente && cajaExistente.cuentaContableId !== cuentaCaja001.id) {
        // Actualizar la caja existente para vincularla con esta cuenta
        await prisma.caja.update({
          where: { id: cajaExistente.id },
          data: {
            cuentaContableId: cuentaCaja001.id,
            saldoInicial: parseFloat(cuentaCaja001.saldoInicial.toString()),
            saldoActual: parseFloat(cuentaCaja001.saldoActual.toString())
          }
        });
        console.log(`   ✅ Caja existente actualizada y vinculada: ${cajaExistente.nombre}\n`);
      } else {
        // Crear nueva caja
        const nuevaCaja = await prisma.caja.create({
          data: {
            nombre: cuentaCaja001.nombre,
            descripcion: `Caja vinculada con cuenta ${cuentaCaja001.codigo}`,
            tipo: 'efectivo',
            cuentaContableId: cuentaCaja001.id,
            responsableId: primerUsuario.id,
            saldoInicial: parseFloat(cuentaCaja001.saldoInicial.toString()),
            saldoActual: parseFloat(cuentaCaja001.saldoActual.toString()),
            activa: true
          }
        });
        console.log(`   ✅ Nueva caja creada: ${nuevaCaja.nombre} (ID: ${nuevaCaja.id})\n`);
      }
    }

    // 2. Cuenta "003 - Papeleria" -> Crear caja operativa
    const cuentaPapeleria003 = await prisma.cuentaContable.findFirst({
      where: { codigo: '003' }
    });

    if (cuentaPapeleria003) {
      console.log(`📦 Procesando cuenta: ${cuentaPapeleria003.codigo} - ${cuentaPapeleria003.nombre}`);
      
      // Verificar si ya existe una caja con este nombre
      const cajaExistente = await prisma.caja.findFirst({
        where: { 
          OR: [
            { nombre: 'Papeleria' },
            { cuentaContableId: cuentaPapeleria003.id }
          ]
        }
      });

      if (cajaExistente && cajaExistente.cuentaContableId === cuentaPapeleria003.id) {
        console.log(`   ✅ Ya existe caja vinculada: ${cajaExistente.nombre}\n`);
      } else if (cajaExistente && cajaExistente.cuentaContableId !== cuentaPapeleria003.id) {
        // Actualizar la caja existente para vincularla con esta cuenta
        await prisma.caja.update({
          where: { id: cajaExistente.id },
          data: {
            cuentaContableId: cuentaPapeleria003.id,
            saldoInicial: parseFloat(cuentaPapeleria003.saldoInicial.toString()),
            saldoActual: parseFloat(cuentaPapeleria003.saldoActual.toString())
          }
        });
        console.log(`   ✅ Caja existente actualizada y vinculada: ${cajaExistente.nombre}\n`);
      } else {
        // Crear nueva caja
        const nuevaCaja = await prisma.caja.create({
          data: {
            nombre: cuentaPapeleria003.nombre,
            descripcion: `Caja vinculada con cuenta ${cuentaPapeleria003.codigo}`,
            tipo: 'efectivo',
            cuentaContableId: cuentaPapeleria003.id,
            responsableId: primerUsuario.id,
            saldoInicial: parseFloat(cuentaPapeleria003.saldoInicial.toString()),
            saldoActual: parseFloat(cuentaPapeleria003.saldoActual.toString()),
            activa: true
          }
        });
        console.log(`   ✅ Nueva caja creada: ${nuevaCaja.nombre} (ID: ${nuevaCaja.id})\n`);
      }
    }

    // 3. Verificar resultado
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RESULTADO FINAL');
    console.log('═══════════════════════════════════════════════════\n');

    const todasLasCajas = await prisma.caja.findMany({
      include: {
        cuentaContable: {
          select: {
            codigo: true,
            nombre: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    console.log(`Total de cajas operativas: ${todasLasCajas.length}\n`);

    todasLasCajas.forEach((caja, index) => {
      console.log(`${index + 1}. ${caja.nombre}`);
      console.log(`   ID: ${caja.id}`);
      console.log(`   Tipo: ${caja.tipo}`);
      console.log(`   Activa: ${caja.activa ? '✅' : '❌'}`);
      if (caja.cuentaContable) {
        console.log(`   Cuenta: ${caja.cuentaContable.codigo} - ${caja.cuentaContable.nombre}`);
      }
      console.log('');
    });

    console.log('🎉 ¡Vinculación completada!\n');
    console.log('📋 Próximos pasos:');
    console.log('   1. Reinicia el servidor backend');
    console.log('   2. Refresca el navegador');
    console.log('   3. Verifica que las cajas aparezcan correctamente\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

vincularCuentasAntiguas();
