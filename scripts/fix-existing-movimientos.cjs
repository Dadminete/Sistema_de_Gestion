const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixExistingMovimientos() {
  try {
    console.log('=== CORRECCIÓN DE MOVIMIENTOS EXISTENTES ===');
    
    // Obtener todos los movimientos existentes
    const movimientos = await prisma.movimientoContable.findMany({
      include: {
        categoria: true
      }
    });
    
    console.log('Total de movimientos:', movimientos.length);
    
    // Para cada movimiento, recalcular su impacto en los saldos
    for (const movimiento of movimientos) {
      console.log(`Procesando movimiento ${movimiento.id}: ${movimiento.tipo} de ${movimiento.monto} por ${movimiento.metodo}`);
      
      // Recalcular el impacto en los saldos
      const amount = movimiento.tipo === 'ingreso' ? parseFloat(movimiento.monto) : -parseFloat(movimiento.monto);
      
      if (movimiento.metodo === 'papeleria') {
        // Actualizar caja de papelería
        await prisma.caja.updateMany({
          where: { tipo: 'papeleria', activa: true },
          data: { saldoActual: { increment: amount } }
        });
        
        // Actualizar cuenta contable de papelería (código '03')
        await prisma.cuentaContable.updateMany({
          where: { codigo: '03', activa: true },
          data: { saldoActual: { increment: amount } }
        });
        
        console.log(`  - Actualizado saldo de papelería: ${amount > 0 ? '+' : ''}${amount}`);
      } else if (movimiento.metodo === 'caja') {
        // Actualizar caja general
        await prisma.caja.updateMany({
          where: { tipo: 'general', activa: true },
          data: { saldoActual: { increment: amount } }
        });
        
        console.log(`  - Actualizado saldo de caja: ${amount > 0 ? '+' : ''}${amount}`);
      } else if (movimiento.metodo === 'banco' && movimiento.cuentaBancariaId) {
        // Actualizar cuenta bancaria
        const cuentaBancaria = await prisma.cuentaBancaria.findUnique({
          where: { id: movimiento.cuentaBancariaId },
          include: { cuentaContable: true }
        });
        
        if (cuentaBancaria && cuentaBancaria.cuentaContable) {
          await prisma.cuentaContable.update({
            where: { id: cuentaBancaria.cuentaContable.id },
            data: { saldoActual: { increment: amount } }
          });
          
          console.log(`  - Actualizado saldo de cuenta bancaria: ${amount > 0 ? '+' : ''}${amount}`);
        }
      }
    }
    
    // Mostrar saldos finales
    console.log('\n=== SALDOS FINALES ===');
    const cajas = await prisma.caja.findMany({ where: { activa: true } });
    cajas.forEach(caja => {
      console.log(`${caja.nombre} (${caja.tipo}): ${caja.saldoActual}`);
    });
    
    const cuentas = await prisma.cuentaContable.findMany({ where: { activa: true } });
    cuentas.forEach(cuenta => {
      console.log(`${cuenta.codigo} - ${cuenta.nombre}: ${cuenta.saldoActual}`);
    });
    
  } catch (error) {
    console.error('Error al corregir movimientos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se corre directamente
if (require.main === module) {
  fixExistingMovimientos()
    .then(() => console.log('Corrección completada'))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = fixExistingMovimientos;