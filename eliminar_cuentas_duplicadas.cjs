const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function eliminarDuplicadas() {
  console.log('🗑️  Eliminando cuentas contables duplicadas...\n');

  try {
    // Mostrar las cuentas que se van a eliminar
    const cuentasAEliminar = await prisma.cuentaContable.findMany({
      where: {
        codigo: {
          in: ['1101-001', '1101-002']
        }
      },
      select: {
        id: true,
        codigo: true,
        nombre: true
      }
    });

    if (cuentasAEliminar.length === 0) {
      console.log('✅ No hay cuentas duplicadas para eliminar\n');
      return;
    }

    console.log(`Cuentas a eliminar:`);
    cuentasAEliminar.forEach(cuenta => {
      console.log(`   - ${cuenta.codigo} - ${cuenta.nombre}`);
    });
    console.log('');

    // Eliminar las cuentas
    const result = await prisma.cuentaContable.deleteMany({
      where: {
        codigo: {
          in: ['1101-001', '1101-002']
        }
      }
    });

    console.log(`✅ Eliminadas ${result.count} cuenta(s) duplicada(s)\n`);

    // Mostrar las cuentas restantes
    const cuentasRestantes = await prisma.cuentaContable.findMany({
      select: {
        codigo: true,
        nombre: true,
        tipoCuenta: true
      },
      orderBy: {
        codigo: 'asc'
      }
    });

    console.log('📊 Cuentas contables restantes:');
    cuentasRestantes.forEach(cuenta => {
      console.log(`   - ${cuenta.codigo} - ${cuenta.nombre} (${cuenta.tipoCuenta})`);
    });
    console.log('');

    console.log('🎉 ¡Limpieza completada!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

eliminarDuplicadas();
