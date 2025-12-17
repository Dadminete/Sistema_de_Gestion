const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarCajas() {
  console.log('🔍 Verificando cajas en la base de datos...\n');

  try {
    // 1. Obtener todas las cajas
    const todasLasCajas = await prisma.caja.findMany({
      select: {
        id: true,
        nombre: true,
        tipo: true,
        activa: true,
        saldoInicial: true,
        saldoActual: true,
        responsableId: true,
        cuentaContableId: true,
        createdAt: true
      }
    });

    console.log(`📦 Total de cajas en la base de datos: ${todasLasCajas.length}\n`);

    if (todasLasCajas.length === 0) {
      console.log('⚠️  No hay cajas en la base de datos');
      console.log('\n💡 Necesitas crear cajas primero.');
      return;
    }

    // Mostrar cada caja
    todasLasCajas.forEach((caja, index) => {
      console.log(`\n--- Caja ${index + 1} ---`);
      console.log(`ID: ${caja.id}`);
      console.log(`Nombre: ${caja.nombre}`);
      console.log(`Tipo: ${caja.tipo}`);
      console.log(`Activa: ${caja.activa ? '✅ SÍ' : '❌ NO'}`);
      console.log(`Saldo Inicial: $${caja.saldoInicial}`);
      console.log(`Saldo Actual: $${caja.saldoActual}`);
      console.log(`Responsable ID: ${caja.responsableId || 'Sin asignar'}`);
      console.log(`Cuenta Contable ID: ${caja.cuentaContableId || 'Sin vincular'}`);
      console.log(`Creada: ${caja.createdAt.toISOString()}`);
    });

    // 2. Verificar cajas inactivas
    const cajasInactivas = todasLasCajas.filter(c => !c.activa);
    if (cajasInactivas.length > 0) {
      console.log(`\n\n⚠️  PROBLEMA ENCONTRADO: Hay ${cajasInactivas.length} caja(s) INACTIVA(s):`);
      cajasInactivas.forEach(caja => {
        console.log(`   - ${caja.nombre} (ID: ${caja.id})`);
      });
      console.log('\n💡 Solución: Activar las cajas con el siguiente comando SQL:');
      cajasInactivas.forEach(caja => {
        console.log(`   UPDATE cajas SET activa = true WHERE id = '${caja.id}';`);
      });
    }

    // 3. Verificar aperturas existentes
    console.log('\n\n🔓 Verificando aperturas de caja...');
    const aperturas = await prisma.aperturaCaja.findMany({
      include: {
        caja: {
          select: {
            nombre: true
          }
        },
        usuario: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        fechaApertura: 'desc'
      },
      take: 5
    });

    if (aperturas.length > 0) {
      console.log(`   Total de aperturas registradas: ${aperturas.length}`);
      aperturas.forEach((apertura, index) => {
        console.log(`\n   Apertura ${index + 1}:`);
        console.log(`   - Caja: ${apertura.caja.nombre}`);
        console.log(`   - Monto Inicial: $${apertura.montoInicial}`);
        console.log(`   - Fecha: ${apertura.fechaApertura.toISOString()}`);
        console.log(`   - Usuario: ${apertura.usuario.nombre} ${apertura.usuario.apellido}`);
      });
    } else {
      console.log('   No hay aperturas registradas aún');
    }

    // 4. Verificar cierres
    console.log('\n\n🔒 Verificando cierres de caja...');
    const cierres = await prisma.cierreCaja.findMany({
      include: {
        caja: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        fechaCierre: 'desc'
      },
      take: 5
    });

    if (cierres.length > 0) {
      console.log(`   Total de cierres registrados: ${cierres.length}`);
    } else {
      console.log('   No hay cierres registrados aún');
    }

    // 5. Verificar cajas que están abiertas (tienen apertura sin cierre)
    console.log('\n\n📊 Estado de las cajas:');
    for (const caja of todasLasCajas) {
      const ultimaApertura = await prisma.aperturaCaja.findFirst({
        where: { cajaId: caja.id },
        orderBy: { fechaApertura: 'desc' }
      });

      if (ultimaApertura) {
        const ultimoCierre = await prisma.cierreCaja.findFirst({
          where: { 
            cajaId: caja.id,
            fechaCierre: { gt: ultimaApertura.fechaApertura }
          },
          orderBy: { fechaCierre: 'desc' }
        });

        if (!ultimoCierre) {
          console.log(`   🔓 ${caja.nombre}: ABIERTA (apertura: ${ultimaApertura.fechaApertura.toISOString()})`);
        } else {
          console.log(`   🔒 ${caja.nombre}: CERRADA`);
        }
      } else {
        console.log(`   ⭕ ${caja.nombre}: SIN APERTURAS`);
      }
    }

    // 6. Verificar usuarios disponibles
    console.log('\n\n👥 Verificando usuarios...');
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        apellido: true,
        activo: true
      },
      take: 5
    });

    if (usuarios.length > 0) {
      console.log(`   Total de usuarios: ${usuarios.length}`);
      usuarios.forEach(u => {
        console.log(`   - ${u.nombre} ${u.apellido} (ID: ${u.id}) ${u.activo ? '✅' : '❌'}`);
      });
    } else {
      console.log('   ⚠️  No hay usuarios en la base de datos');
    }

    console.log('\n\n✅ Verificación completada');

  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarCajas();
