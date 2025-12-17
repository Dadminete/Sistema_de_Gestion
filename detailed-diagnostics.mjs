import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function detailedDiagnostics() {
  try {
    console.log('🔍 Detailed diagnostics for papeleria caja issue...\n');
    
    // Check all cajas
    const allCajas = await prisma.caja.findMany({
      orderBy: { tipo: 'asc' }
    });
    
    console.log(`📁 Found ${allCajas.length} total cajas:`);
    allCajas.forEach((caja, index) => {
      console.log(`  ${index + 1}. ${caja.nombre} (tipo: ${caja.tipo}, activa: ${caja.activa})`);
      console.log(`     ID: ${caja.id}`);
      console.log(`     Saldo inicial: ${caja.saldoInicial}`);
      console.log(`     Saldo actual: ${caja.saldoActual}`);
      console.log(`     Created: ${caja.createdAt}`);
      console.log('');
    });
    
    // Check specifically for papeleria caja
    const papeleriaCaja = await prisma.caja.findFirst({
      where: { tipo: 'papeleria', activa: true }
    });
    
    if (!papeleriaCaja) {
      console.log('❌ No active papeleria caja found!');
      return;
    }
    
    console.log(`✅ Papeleria caja found:`);
    console.log(`   Name: ${papeleriaCaja.nombre}`);
    console.log(`   ID: ${papeleriaCaja.id}`);
    console.log(`   Current balance: ${papeleriaCaja.saldoActual}`);
    console.log(`   Initial balance: ${papeleriaCaja.saldoInicial}`);
    
    // Check movimientos contables for papeleria
    console.log('\n📊 Checking movimientos contables for papeleria...');
    const papeleriaMovimientos = await prisma.movimientoContable.findMany({
      where: { metodo: 'papeleria' },
      orderBy: { fecha: 'desc' },
      take: 10
    });
    
    console.log(`Found ${papeleriaMovimientos.length} papeleria movimientos:`);
    if (papeleriaMovimientos.length > 0) {
      papeleriaMovimientos.forEach((mov, index) => {
        console.log(`  ${index + 1}. ${mov.tipo} - $${mov.monto} - ${mov.descripcion || 'No description'}`);
        console.log(`     Date: ${mov.fecha}`);
      });
    } else {
      console.log('  No papeleria movimientos found');
    }
    
    // Check ventas papeleria that might affect the caja
    console.log('\n📝 Checking ventas papeleria...');
    const ventasPapeleria = await prisma.ventaPapeleria.findMany({
      where: { metodoPago: 'papeleria' },
      orderBy: { fechaVenta: 'desc' },
      take: 5
    });
    
    console.log(`Found ${ventasPapeleria.length} papeleria ventas:`);
    if (ventasPapeleria.length > 0) {
      ventasPapeleria.forEach((venta, index) => {
        console.log(`  ${index + 1}. $${venta.total} - ${venta.estado}`);
        console.log(`     Date: ${venta.fechaVenta}`);
      });
    } else {
      console.log('  No papeleria ventas found');
    }
    
    // Test the balance calculation manually
    console.log('\n🧮 Manual balance calculation test...');
    
    // Calculate balance from movimientos (similar to how frontend does it)
    const movimientos = await prisma.movimientoContable.findMany({
      where: { metodo: 'papeleria' }
    });
    
    let calculatedBalance = 0;
    movimientos.forEach(mov => {
      if (mov.tipo === 'ingreso') {
        calculatedBalance += parseFloat(mov.monto);
      } else if (mov.tipo === 'gasto') {
        calculatedBalance -= parseFloat(mov.monto);
      }
    });
    
    console.log(`   Manual calculation from movimientos: $${calculatedBalance}`);
    console.log(`   Caja stored balance: $${papeleriaCaja.saldoActual}`);
    
    // Check if there are any discrepancies
    if (Math.abs(calculatedBalance - parseFloat(papeleriaCaja.saldoActual)) > 0.01) {
      console.log('   ⚠️  WARNING: Balance discrepancy detected!');
    }
    
    console.log('\n✅ Diagnostics completed.');
    
  } catch (error) {
    console.error('❌ Error during diagnostics:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

detailedDiagnostics();