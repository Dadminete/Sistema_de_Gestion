require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verificarSaldoCajaPrincipal() {
  try {
    console.log('🧮 VERIFICACIÓN COMPLETA DEL SALDO DE CAJA PRINCIPAL');
    console.log('='.repeat(60));

    // 1. Obtener la caja principal
    const cajaPrincipal = await prisma.caja.findFirst({
      where: { 
        OR: [
          { nombre: { equals: 'Caja Principal', mode: 'insensitive' } }, 
          { tipo: 'general' }
        ]
      },
      include: {
        cuentaContable: true
      }
    });

    if (!cajaPrincipal) {
      throw new Error('No se encontró la Caja Principal');
    }

    console.log(`\n📦 INFORMACIÓN DE LA CAJA PRINCIPAL:`);
    console.log(`   ID: ${cajaPrincipal.id}`);
    console.log(`   Nombre: ${cajaPrincipal.nombre}`);
    console.log(`   Saldo Inicial: RD$ ${Number(cajaPrincipal.saldoInicial).toLocaleString()}`);
    console.log(`   Saldo Actual (DB): RD$ ${Number(cajaPrincipal.saldoActual).toLocaleString()}`);
    
    if (cajaPrincipal.cuentaContable) {
      console.log(`   Cuenta Contable: ${cajaPrincipal.cuentaContable.nombre}`);
      console.log(`   Saldo Cuenta Contable: RD$ ${Number(cajaPrincipal.cuentaContable.saldoActual).toLocaleString()}`);
    }

    // 2. Obtener todos los movimientos contables de la caja principal
    console.log(`\n💰 ANÁLISIS DE MOVIMIENTOS CONTABLES:`);
    
    const movimientosIngresos = await prisma.movimientoContable.findMany({
      where: {
        cajaId: cajaPrincipal.id,
        tipo: 'ingreso'
      },
      select: {
        id: true,
        fecha: true,
        monto: true,
        descripcion: true,
        metodo: true,
        tipo: true
      },
      orderBy: { fecha: 'asc' }
    });

    const movimientosGastos = await prisma.movimientoContable.findMany({
      where: {
        cajaId: cajaPrincipal.id,
        tipo: 'gasto'
      },
      select: {
        id: true,
        fecha: true,
        monto: true,
        descripcion: true,
        metodo: true,
        tipo: true
      },
      orderBy: { fecha: 'asc' }
    });

    const totalIngresosMov = movimientosIngresos.reduce((sum, mov) => sum + Number(mov.monto), 0);
    const totalGastosMov = movimientosGastos.reduce((sum, mov) => sum + Number(mov.monto), 0);

    console.log(`   Movimientos de Ingreso: ${movimientosIngresos.length} (Total: RD$ ${totalIngresosMov.toLocaleString()})`);
    console.log(`   Movimientos de Gasto: ${movimientosGastos.length} (Total: RD$ ${totalGastosMov.toLocaleString()})`);

    // 3. Obtener pagos de clientes que van a esta caja
    const pagosClientes = await prisma.pagoCliente.findMany({
      where: {
        cajaId: cajaPrincipal.id,
        estado: { not: 'anulado' }
      },
      select: {
        id: true,
        fechaPago: true,
        monto: true,
        cliente: {
          select: { nombre: true }
        }
      },
      orderBy: { fechaPago: 'asc' }
    });

    const totalPagosClientes = pagosClientes.reduce((sum, pago) => sum + Number(pago.monto), 0);
    console.log(`   Pagos de Clientes: ${pagosClientes.length} (Total: RD$ ${totalPagosClientes.toLocaleString()})`);

    // 4. Obtener ventas de papelería si van a esta caja
    const ventasPapeleria = await prisma.ventaPapeleria.findMany({
      where: {
        cajaId: cajaPrincipal.id,
        estado: { not: 'anulada' }
      },
      select: {
        id: true,
        fechaVenta: true,
        total: true
      },
      orderBy: { fechaVenta: 'asc' }
    });

    const totalVentasPapeleria = ventasPapeleria.reduce((sum, venta) => sum + Number(venta.total), 0);
    console.log(`   Ventas Papelería: ${ventasPapeleria.length} (Total: RD$ ${totalVentasPapeleria.toLocaleString()})`);

    // 5. Calcular saldo esperado manualmente
    const saldoInicial = Number(cajaPrincipal.saldoInicial);
    const saldoCalculadoManual = saldoInicial + totalIngresosMov - totalGastosMov + totalPagosClientes + totalVentasPapeleria;

    console.log(`\n🧮 CÁLCULO MANUAL DEL SALDO:`);
    console.log(`   Saldo Inicial:           + RD$ ${saldoInicial.toLocaleString()}`);
    console.log(`   Ingresos (Movimientos):  + RD$ ${totalIngresosMov.toLocaleString()}`);
    console.log(`   Gastos (Movimientos):    - RD$ ${totalGastosMov.toLocaleString()}`);
    console.log(`   Pagos Clientes:          + RD$ ${totalPagosClientes.toLocaleString()}`);
    console.log(`   Ventas Papelería:        + RD$ ${totalVentasPapeleria.toLocaleString()}`);
    console.log(`   ${'='.repeat(40)}`);
    console.log(`   SALDO CALCULADO:           RD$ ${saldoCalculadoManual.toLocaleString()}`);

    // 6. Comparar con el saldo almacenado
    const saldoAlmacenado = Number(cajaPrincipal.saldoActual);
    const diferencia = saldoCalculadoManual - saldoAlmacenado;
    
    console.log(`\n📊 COMPARACIÓN:`);
    console.log(`   Saldo en Base de Datos:  RD$ ${saldoAlmacenado.toLocaleString()}`);
    console.log(`   Saldo Calculado Manual:  RD$ ${saldoCalculadoManual.toLocaleString()}`);
    console.log(`   Diferencia:              RD$ ${diferencia.toLocaleString()}`);

    if (Math.abs(diferencia) < 0.01) {
      console.log(`   ✅ ¡PERFECTO! Los saldos coinciden exactamente.`);
    } else if (Math.abs(diferencia) < 1.00) {
      console.log(`   ⚠️  Diferencia mínima (centavos) - Probablemente por redondeo.`);
    } else {
      console.log(`   ❌ DISCREPANCIA DETECTADA - Requiere investigación.`);
      
      // Mostrar algunos movimientos recientes para ayudar en la investigación
      console.log(`\n🔍 ÚLTIMOS 5 MOVIMIENTOS PARA INVESTIGACIÓN:`);
      
      const ultimosMovimientos = [...movimientosIngresos, ...movimientosGastos]
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .slice(0, 5);
        
      ultimosMovimientos.forEach(mov => {
        const tipo = mov.tipo || 'desconocido';
        const signo = tipo === 'ingreso' ? '+' : '-';
        console.log(`   ${mov.fecha.toISOString().split('T')[0]} | ${tipo.toUpperCase()} | ${signo}RD$ ${Number(mov.monto).toLocaleString()} | ${mov.descripcion || 'Sin descripción'}`);
      });

      if (pagosClientes.length > 0) {
        console.log(`\n💳 ÚLTIMOS 3 PAGOS DE CLIENTES:`);
        pagosClientes.slice(-3).forEach(pago => {
          console.log(`   ${pago.fechaPago.toISOString().split('T')[0]} | +RD$ ${Number(pago.monto).toLocaleString()} | ${pago.cliente.nombre}`);
        });
      }
    }

    // 7. Verificar consistencia con cuenta contable
    if (cajaPrincipal.cuentaContable) {
      const saldoCuentaContable = Number(cajaPrincipal.cuentaContable.saldoActual);
      const diferenciaCuentaContable = saldoAlmacenado - saldoCuentaContable;
      
      console.log(`\n🏦 CONSISTENCIA CON CUENTA CONTABLE:`);
      console.log(`   Saldo Caja:             RD$ ${saldoAlmacenado.toLocaleString()}`);
      console.log(`   Saldo Cuenta Contable:  RD$ ${saldoCuentaContable.toLocaleString()}`);
      console.log(`   Diferencia:             RD$ ${diferenciaCuentaContable.toLocaleString()}`);
      
      if (Math.abs(diferenciaCuentaContable) < 0.01) {
        console.log(`   ✅ Caja y Cuenta Contable están sincronizadas.`);
      } else {
        console.log(`   ⚠️  Caja y Cuenta Contable no están sincronizadas.`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarSaldoCajaPrincipal();