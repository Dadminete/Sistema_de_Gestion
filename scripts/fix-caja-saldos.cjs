const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCajaSaldos() {
  try {
    console.log('=== CORRECCIÓN DE SALDOS DE CAJAS ===');
    
    // Calcular el saldo real de caja general
    const movimientosCaja = await prisma.movimientoContable.findMany({
      where: { metodo: 'caja' }
    });
    
    const saldoCaja = movimientosCaja.reduce((sum, m) => {
      return sum + (m.tipo === 'ingreso' ? parseFloat(m.monto) : -parseFloat(m.monto));
    }, 0);
    
    console.log('Saldo calculado de caja:', saldoCaja);
    
    // Calcular el saldo real de caja de papelería
    const movimientosPapeleria = await prisma.movimientoContable.findMany({
      where: { metodo: 'papeleria' }
    });
    
    const saldoPapeleria = movimientosPapeleria.reduce((sum, m) => {
      return sum + (m.tipo === 'ingreso' ? parseFloat(m.monto) : -parseFloat(m.monto));
    }, 0);
    
    console.log('Saldo calculado de papelería:', saldoPapeleria);
    
    // Actualizar los saldos en las cajas
    console.log('\n--- Actualizando saldos en cajas ---');
    
    // Actualizar caja general
    const cajaGeneral = await prisma.caja.updateMany({
      where: { tipo: 'general', activa: true },
      data: { saldoActual: saldoCaja.toString() }
    });
    
    console.log('Caja general actualizada:', cajaGeneral);
    
    // Actualizar caja de papelería
    const cajaPapeleria = await prisma.caja.updateMany({
      where: { tipo: 'papeleria', activa: true },
      data: { saldoActual: saldoPapeleria.toString() }
    });
    
    console.log('Caja de papelería actualizada:', cajaPapeleria);
    
    // Verificar saldos finales
    console.log('\n--- Saldos finales ---');
    const cajas = await prisma.caja.findMany({ where: { activa: true } });
    cajas.forEach(caja => {
      console.log(`${caja.nombre} (${caja.tipo}): ${caja.saldoActual}`);
    });
    
  } catch (error) {
    console.error('Error al corregir saldos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se corre directamente
if (require.main === module) {
  fixCajaSaldos()
    .then(() => console.log('Corrección completada'))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = fixCajaSaldos;