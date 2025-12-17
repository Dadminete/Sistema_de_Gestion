import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCajaLink() {
  try {
    console.log('🔧 Fixing caja-cuenta contable link...\n');
    
    // Find the papeleria caja
    const papeleriaCaja = await prisma.caja.findFirst({
      where: { tipo: 'papeleria', activa: true }
    });
    
    if (!papeleriaCaja) {
      console.log('❌ No papeleria caja found!');
      return;
    }
    
    console.log(`📄 Papeleria caja:`);
    console.log(`   ID: ${papeleriaCaja.id}`);
    console.log(`   Name: ${papeleriaCaja.nombre}`);
    console.log(`   Current cuentaContableId: ${papeleriaCaja.cuentaContableId || 'null'}`);
    
    // Find the papeleria cuenta contable
    const papeleriaCuenta = await prisma.cuentaContable.findFirst({
      where: { codigo: '003', activa: true }
    });
    
    if (!papeleriaCuenta) {
      console.log('❌ No papeleria cuenta contable found!');
      return;
    }
    
    console.log(`\n📄 Papeleria cuenta contable:`);
    console.log(`   ID: ${papeleriaCuenta.id}`);
    console.log(`   Code: ${papeleriaCuenta.codigo}`);
    console.log(`   Name: ${papeleriaCuenta.nombre}`);
    
    // Check if they're already linked
    if (papeleriaCaja.cuentaContableId === papeleriaCuenta.id) {
      console.log('\n✅ Caja and cuenta contable are already linked!');
      return;
    }
    
    // Link them if not already linked
    console.log('\n🔗 Linking caja to cuenta contable...');
    const updatedCaja = await prisma.caja.update({
      where: { id: papeleriaCaja.id },
      data: { cuentaContableId: papeleriaCuenta.id }
    });
    
    console.log('✅ Successfully linked caja to cuenta contable!');
    console.log(`   New cuentaContableId: ${updatedCaja.cuentaContableId}`);
    
    // Test the updateBalance function manually to see if it works now
    console.log('\n🧪 Testing updateBalance function...');
    
    // Get the existing movimiento to see what amount to use
    const movimientos = await prisma.movimientoContable.findMany({
      where: { metodo: 'papeleria' }
    });
    
    if (movimientos.length > 0) {
      const movimiento = movimientos[0];
      const amount = movimiento.tipo === 'ingreso' ? parseFloat(movimiento.monto) : -parseFloat(movimiento.monto);
      
      console.log(`   Testing with movimiento: ${movimiento.tipo} of $${movimiento.monto}`);
      console.log(`   Calculated amount: ${amount}`);
      
      // Try to update the balance manually
      try {
        console.log('   Updating caja balance...');
        await prisma.caja.updateMany({
          where: { tipo: 'papeleria', activa: true },
          data: { saldoActual: { increment: amount } }
        });
        
        console.log('   Updating cuenta contable balance...');
        await prisma.cuentaContable.updateMany({
          where: { codigo: '003', activa: true },
          data: { saldoActual: { increment: amount } }
        });
        
        console.log('✅ Balance updates completed successfully!');
        
        // Check the new balances
        const updatedPapeleriaCaja = await prisma.caja.findFirst({
          where: { tipo: 'papeleria', activa: true }
        });
        
        const updatedPapeleriaCuenta = await prisma.cuentaContable.findFirst({
          where: { codigo: '003', activa: true }
        });
        
        console.log(`\n📊 New balances:`);
        console.log(`   Caja balance: $${updatedPapeleriaCaja.saldoActual}`);
        console.log(`   Cuenta contable balance: $${updatedPapeleriaCuenta.saldoActual}`);
        
      } catch (error) {
        console.error('❌ Error updating balances:', error.message);
      }
    } else {
      console.log('   No movimientos found to test with');
    }
    
  } catch (error) {
    console.error('❌ Error fixing caja link:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixCajaLink();