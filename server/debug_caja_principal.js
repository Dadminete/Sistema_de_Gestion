const prisma = require('./prismaClient');

async function debugCajaPrincipal() {
  try {
    console.log('🔍 DEBUG CAJA PRINCIPAL - ANÁLISIS COMPLETO\n');
    
    // 1. Encontrar Caja Principal
    const cajaPrincipal = await prisma.caja.findFirst({
      where: {
        OR: [
          { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
          { nombre: { equals: 'Caja', mode: 'insensitive' } },
          { tipo: 'general' }
        ],
        activa: true
      }
    });

    if (!cajaPrincipal) {
      console.log('❌ No se encontró Caja Principal');
      return;
    }

    console.log(`✅ CAJA PRINCIPAL ENCONTRADA:`);
    console.log(`   Nombre: ${cajaPrincipal.nombre}`);
    console.log(`   ID: ${cajaPrincipal.id}`);
    console.log(`   Saldo Inicial: RD$ ${cajaPrincipal.saldoInicial}`);
    console.log(`   Saldo Actual (BD): RD$ ${cajaPrincipal.saldoActual}\n`);

    // 2. Obtener todos los movimientos contables de esta caja
    const movimientosContables = await prisma.movimientoContable.findMany({
      where: { cajaId: cajaPrincipal.id },
      orderBy: { fecha: 'desc' },
      include: {
        categoria: true,
        usuario: { select: { nombre: true, apellido: true } }
      }
    });

    console.log(`📊 MOVIMIENTOS CONTABLES EN CAJA (${movimientosContables.length}):`);
    let sumaIngresos = 0;
    let sumaGastos = 0;

    movimientosContables.forEach(mov => {
      const fecha = mov.fecha.toISOString().split('T')[0];
      const usuario = mov.usuario ? `${mov.usuario.nombre} ${mov.usuario.apellido}` : 'N/A';
      console.log(`   ${fecha} | ${mov.tipo.toUpperCase()} | RD$ ${mov.monto} | ${mov.descripcion || 'Sin descripción'} | ${usuario}`);
      
      if (mov.tipo === 'ingreso') {
        sumaIngresos += parseFloat(mov.monto);
      } else {
        sumaGastos += parseFloat(mov.monto);
      }
    });

    console.log(`\n💰 RESUMEN MOVIMIENTOS CONTABLES:`);
    console.log(`   Total Ingresos: RD$ ${sumaIngresos.toFixed(2)}`);
    console.log(`   Total Gastos: RD$ ${sumaGastos.toFixed(2)}`);
    console.log(`   Diferencia: RD$ ${(sumaIngresos - sumaGastos).toFixed(2)}\n`);

    // 3. Analizar tipos de ingresos
    const ingresosPagos = movimientosContables.filter(m => 
      m.tipo === 'ingreso' && m.descripcion && m.descripcion.toLowerCase().includes('pago factura')
    );
    
    const ingresosOtros = movimientosContables.filter(m => 
      m.tipo === 'ingreso' && (!m.descripcion || !m.descripcion.toLowerCase().includes('pago factura'))
    );

    let sumaPagos = 0;
    let sumaOtrosIngresos = 0;

    ingresosPagos.forEach(pago => {
      sumaPagos += parseFloat(pago.monto);
    });

    ingresosOtros.forEach(otro => {
      sumaOtrosIngresos += parseFloat(otro.monto);
    });

    console.log(`\n🧾 ANÁLISIS DE INGRESOS:`);
    console.log(`   Pagos de Facturas: ${ingresosPagos.length} | Total: RD$ ${sumaPagos.toFixed(2)}`);
    console.log(`   Otros Ingresos: ${ingresosOtros.length} | Total: RD$ ${sumaOtrosIngresos.toFixed(2)}`);
    console.log(`   TOTAL INGRESOS: RD$ ${(sumaPagos + sumaOtrosIngresos).toFixed(2)}\n`);

    // 4. Cálculo total esperado
    const saldoCalculado = parseFloat(cajaPrincipal.saldoInicial) + sumaIngresos - sumaGastos;
    
    console.log(`🧮 CÁLCULO FINAL:`);
    console.log(`   Saldo Inicial: RD$ ${cajaPrincipal.saldoInicial}`);
    console.log(`     - Pagos de Facturas: RD$ ${sumaPagos.toFixed(2)}`);
    console.log(`     - Otros Ingresos: RD$ ${sumaOtrosIngresos.toFixed(2)}`);
    console.log(`   + Total Ingresos: RD$ ${sumaIngresos.toFixed(2)}`);
    console.log(`   - Total Gastos: RD$ ${sumaGastos.toFixed(2)}`);
    console.log(`   ----------------------------------------`);
    console.log(`   TOTAL CALCULADO: RD$ ${saldoCalculado.toFixed(2)}`);
    console.log(`   SALDO EN BD: RD$ ${cajaPrincipal.saldoActual}`);
    console.log(`   DIFERENCIA: RD$ ${(saldoCalculado - parseFloat(cajaPrincipal.saldoActual)).toFixed(2)}\n`);

    // 5. Verificar traspasos
    const traspasosEntrada = await prisma.traspasoHistorial.findMany({
      where: { 
        cajaDestinoId: cajaPrincipal.id,
        estado: 'completado'
      },
      orderBy: { fecha: 'desc' }
    });

    const traspasosSalida = await prisma.traspasoHistorial.findMany({
      where: { 
        cajaOrigenId: cajaPrincipal.id,
        estado: 'completado'
      },
      orderBy: { fecha: 'desc' }
    });

    let sumaTraspasosEntrada = 0;
    let sumaTraspasosalidA = 0;

    traspasosEntrada.forEach(t => sumaTraspasosEntrada += parseFloat(t.monto));
    traspasosSalida.forEach(t => sumaTraspasosalidA += parseFloat(t.monto));

    console.log(`🔄 TRASPASOS:`);
    console.log(`   Entradas: ${traspasosEntrada.length} traspasos | Total: RD$ ${sumaTraspasosEntrada.toFixed(2)}`);
    console.log(`   Salidas: ${traspasosSalida.length} traspasos | Total: RD$ ${sumaTraspasosalidA.toFixed(2)}`);
    console.log(`   Diferencia Traspasos: RD$ ${(sumaTraspasosEntrada - sumaTraspasosalidA).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error en debug:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugCajaPrincipal();