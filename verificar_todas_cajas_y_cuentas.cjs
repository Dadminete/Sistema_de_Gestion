const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarTodo() {
  console.log('🔍 Verificando TODAS las cajas y cuentas contables...\n');

  try {
    // 1. TODAS las cuentas contables
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 CUENTAS CONTABLES EN LA BASE DE DATOS');
    console.log('═══════════════════════════════════════════════════\n');
    
    const todasLasCuentas = await prisma.cuentaContable.findMany({
      select: {
        id: true,
        codigo: true,
        nombre: true,
        tipoCuenta: true,
        saldoInicial: true,
        saldoActual: true,
        activa: true,
        createdAt: true,
        cajas: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        codigo: 'asc'
      }
    });

    console.log(`Total de cuentas contables: ${todasLasCuentas.length}\n`);

    todasLasCuentas.forEach((cuenta, index) => {
      console.log(`--- Cuenta ${index + 1} ---`);
      console.log(`ID: ${cuenta.id}`);
      console.log(`Código: ${cuenta.codigo}`);
      console.log(`Nombre: ${cuenta.nombre}`);
      console.log(`Tipo: ${cuenta.tipoCuenta}`);
      console.log(`Activa: ${cuenta.activa ? '✅ SÍ' : '❌ NO'}`);
      console.log(`Saldo Inicial: $${cuenta.saldoInicial}`);
      console.log(`Saldo Actual: $${cuenta.saldoActual}`);
      console.log(`Creada: ${cuenta.createdAt.toISOString()}`);
      
      if (cuenta.cajas && cuenta.cajas.length > 0) {
        console.log(`✅ Vinculada con caja operativa:`);
        cuenta.cajas.forEach(caja => {
          console.log(`   - ${caja.nombre} (ID: ${caja.id})`);
        });
      } else {
        console.log(`⚠️  SIN caja operativa vinculada`);
      }
      console.log('');
    });

    // 2. TODAS las cajas
    console.log('\n═══════════════════════════════════════════════════');
    console.log('💰 CAJAS OPERATIVAS EN LA BASE DE DATOS');
    console.log('═══════════════════════════════════════════════════\n');

    const todasLasCajas = await prisma.caja.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        tipo: true,
        cuentaContableId: true,
        responsableId: true,
        saldoInicial: true,
        saldoActual: true,
        activa: true,
        createdAt: true,
        cuentaContable: {
          select: {
            codigo: true,
            nombre: true
          }
        },
        responsable: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    console.log(`Total de cajas operativas: ${todasLasCajas.length}\n`);

    if (todasLasCajas.length === 0) {
      console.log('⚠️  No hay cajas operativas en la base de datos\n');
    } else {
      todasLasCajas.forEach((caja, index) => {
        console.log(`--- Caja ${index + 1} ---`);
        console.log(`ID: ${caja.id}`);
        console.log(`Nombre: ${caja.nombre}`);
        console.log(`Descripción: ${caja.descripcion || 'Sin descripción'}`);
        console.log(`Tipo: ${caja.tipo}`);
        console.log(`Activa: ${caja.activa ? '✅ SÍ' : '❌ NO'}`);
        console.log(`Saldo Inicial: $${caja.saldoInicial}`);
        console.log(`Saldo Actual: $${caja.saldoActual}`);
        console.log(`Creada: ${caja.createdAt.toISOString()}`);
        
        if (caja.cuentaContable) {
          console.log(`✅ Vinculada con cuenta contable:`);
          console.log(`   - ${caja.cuentaContable.codigo} - ${caja.cuentaContable.nombre}`);
          console.log(`   - ID: ${caja.cuentaContableId}`);
        } else {
          console.log(`⚠️  SIN cuenta contable vinculada`);
          console.log(`   - cuentaContableId: ${caja.cuentaContableId || 'NULL'}`);
        }

        if (caja.responsable) {
          console.log(`👤 Responsable: ${caja.responsable.nombre} ${caja.responsable.apellido}`);
        } else {
          console.log(`⚠️  Sin responsable asignado`);
        }
        console.log('');
      });
    }

    // 3. ANÁLISIS DE PROBLEMAS
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🔍 ANÁLISIS DE PROBLEMAS');
    console.log('═══════════════════════════════════════════════════\n');

    // Cuentas contables tipo "caja" sin caja operativa
    const cuentasSinCaja = todasLasCuentas.filter(c => 
      c.tipoCuenta === 'caja' && (!c.cajas || c.cajas.length === 0)
    );

    if (cuentasSinCaja.length > 0) {
      console.log(`⚠️  PROBLEMA 1: ${cuentasSinCaja.length} cuenta(s) contable(s) tipo "caja" SIN caja operativa vinculada:`);
      cuentasSinCaja.forEach(cuenta => {
        console.log(`   - ${cuenta.codigo} - ${cuenta.nombre} (ID: ${cuenta.id})`);
      });
      console.log('');
    }

    // Cajas sin cuenta contable
    const cajasSinCuenta = todasLasCajas.filter(c => !c.cuentaContableId);

    if (cajasSinCuenta.length > 0) {
      console.log(`⚠️  PROBLEMA 2: ${cajasSinCuenta.length} caja(s) operativa(s) SIN cuenta contable vinculada:`);
      cajasSinCuenta.forEach(caja => {
        console.log(`   - ${caja.nombre} (ID: ${caja.id})`);
      });
      console.log('');
    }

    // Cajas inactivas
    const cajasInactivas = todasLasCajas.filter(c => !c.activa);

    if (cajasInactivas.length > 0) {
      console.log(`⚠️  PROBLEMA 3: ${cajasInactivas.length} caja(s) INACTIVA(s):`);
      cajasInactivas.forEach(caja => {
        console.log(`   - ${caja.nombre} (ID: ${caja.id})`);
      });
      console.log('');
    }

    // 4. RECOMENDACIONES
    console.log('\n═══════════════════════════════════════════════════');
    console.log('💡 RECOMENDACIONES');
    console.log('═══════════════════════════════════════════════════\n');

    if (cuentasSinCaja.length > 0 && todasLasCajas.length > 0) {
      console.log('📋 Opción 1: VINCULAR cajas existentes con cuentas contables');
      console.log('   Ejecuta el script: node vincular_cajas_con_cuentas.cjs\n');
    }

    if (cuentasSinCaja.length > 0 && todasLasCajas.length === 0) {
      console.log('📋 Opción 2: CREAR cajas operativas para las cuentas contables existentes');
      console.log('   Ejecuta el script: node crear_cajas_desde_cuentas.cjs\n');
    }

    if (todasLasCajas.length > 2) {
      console.log('📋 Opción 3: ELIMINAR cajas duplicadas');
      console.log('   Revisa cuáles cajas quieres mantener y elimina las demás\n');
    }

    console.log('✅ Verificación completada\n');

  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarTodo();
