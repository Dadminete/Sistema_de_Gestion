const prisma = require('./prismaClient');

async function analizarCajaPrincipalHoy() {
  try {
    console.log('🔍 ANÁLISIS CAJA PRINCIPAL - SOLO HOY (2025-12-17)\n');
    
    // 1. Encontrar Caja Principal
    const cajaPrincipal = await prisma.caja.findFirst({
      where: {
        id: 'e6a3f6db-6df2-4d05-8413-b164d4f95560'
      }
    });

    if (!cajaPrincipal) {
      console.log('❌ No se encontró Caja Principal');
      return;
    }

    console.log(`✅ CAJA PRINCIPAL:`);
    console.log(`   Nombre: ${cajaPrincipal.nombre}`);
    console.log(`   Saldo Inicial: RD$ ${cajaPrincipal.saldoInicial}`);
    console.log(`   Saldo Actual (BD): RD$ ${cajaPrincipal.saldoActual}\n`);

    // 2. Obtener movimientos de HOY SOLAMENTE en caja principal
    const hoy = new Date('2025-12-17');
    const mañana = new Date('2025-12-18');

    const movimientosHoy = await prisma.movimientoContable.findMany({
      where: { 
        cajaId: cajaPrincipal.id,
        fecha: {
          gte: hoy,
          lt: mañana
        }
      },
      orderBy: { fecha: 'asc' },
      include: {
        categoria: true,
        usuario: { select: { nombre: true, apellido: true } }
      }
    });

    console.log(`📊 MOVIMIENTOS DE HOY EN CAJA PRINCIPAL (${movimientosHoy.length}):`);
    let sumaIngresosHoy = 0;
    let sumaGastosHoy = 0;

    movimientosHoy.forEach((mov, index) => {
      const hora = mov.fecha.toISOString().split('T')[1].split('.')[0];
      const usuario = mov.usuario ? `${mov.usuario.nombre} ${mov.usuario.apellido}` : 'N/A';
      console.log(`   ${index + 1}. ${hora} | ${mov.tipo.toUpperCase()} | RD$ ${mov.monto} | ${mov.descripcion || 'Sin descripción'} | ${usuario}`);
      
      if (mov.tipo === 'ingreso') {
        sumaIngresosHoy += parseFloat(mov.monto);
      } else {
        sumaGastosHoy += parseFloat(mov.monto);
      }
    });

    console.log(`\n💰 RESUMEN DE HOY:`);
    console.log(`   Ingresos de Hoy: RD$ ${sumaIngresosHoy.toFixed(2)}`);
    console.log(`   Gastos de Hoy: RD$ ${sumaGastosHoy.toFixed(2)}`);
    console.log(`   Diferencia de Hoy: RD$ ${(sumaIngresosHoy - sumaGastosHoy).toFixed(2)}\n`);

    // 3. Cálculo según sistema
    const saldoCalculadoSistema = parseFloat(cajaPrincipal.saldoInicial) + sumaIngresosHoy - sumaGastosHoy;
    
    // 4. Cálculo según conteo físico del usuario
    const saldoFisicoReportado = 6620;
    const saldoInicialReportado = 500;
    const ingresosSegunFisico = saldoFisicoReportado - saldoInicialReportado;

    console.log(`🧮 COMPARACIÓN:`);
    console.log(`   SEGÚN SISTEMA:`);
    console.log(`     Saldo Inicial: RD$ ${cajaPrincipal.saldoInicial}`);
    console.log(`     + Ingresos Hoy: RD$ ${sumaIngresosHoy.toFixed(2)}`);
    console.log(`     - Gastos Hoy: RD$ ${sumaGastosHoy.toFixed(2)}`);
    console.log(`     = Total Sistema: RD$ ${saldoCalculadoSistema.toFixed(2)}\n`);
    
    console.log(`   SEGÚN CONTEO FÍSICO:`);
    console.log(`     Saldo Inicial: RD$ ${saldoInicialReportado}`);
    console.log(`     Total Físico: RD$ ${saldoFisicoReportado}`);
    console.log(`     Ingresos Implícitos: RD$ ${ingresosSegunFisico.toFixed(2)}\n`);
    
    console.log(`   DIFERENCIAS:`);
    console.log(`     Sistema vs Físico: RD$ ${(saldoCalculadoSistema - saldoFisicoReportado).toFixed(2)}`);
    console.log(`     Ingresos Faltantes: RD$ ${(ingresosSegunFisico - sumaIngresosHoy).toFixed(2)}\n`);

    if (ingresosSegunFisico > sumaIngresosHoy) {
      console.log(`❗ POSIBLES INGRESOS NO REGISTRADOS:`);
      console.log(`     Monto no registrado: RD$ ${(ingresosSegunFisico - sumaIngresosHoy).toFixed(2)}`);
      console.log(`     Esto podría ser:`);
      console.log(`     - Pagos de clientes no registrados en el sistema`);
      console.log(`     - Ingresos en efectivo no contabilizados`);
      console.log(`     - Diferencia en el saldo inicial real vs registrado`);
    }

  } catch (error) {
    console.error('❌ Error en análisis:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analizarCajaPrincipalHoy();