const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApiBalances() {
  try {
    console.log('=== VERIFICACIÓN DE BALANCES DE API ===');
    
    // Simular las funciones de balance que se usan en las rutas API
    console.log('\n--- Balance de Caja ---');
    const caja = await prisma.caja.findFirst({
      where: { tipo: 'general', activa: true },
    });
    const cajaBalance = caja ? parseFloat(caja.saldoActual) : 0;
    console.log('Balance de caja:', cajaBalance);
    
    console.log('\n--- Balance de Papelería ---');
    const papeleria = await prisma.caja.findFirst({
      where: { tipo: 'papeleria', activa: true },
    });
    const papeleriaBalance = papeleria ? parseFloat(papeleria.saldoActual) : 0;
    console.log('Balance de papelería:', papeleriaBalance);
    
    console.log('\n--- Balance de Cuentas Contables ---');
    const cuentas = await prisma.cuentaContable.findMany({
      where: { activa: true }
    });
    
    cuentas.forEach(cuenta => {
      console.log(`${cuenta.codigo} - ${cuenta.nombre}: ${cuenta.saldoActual}`);
    });
    
    console.log('\n--- Movimientos por Método ---');
    // Contar movimientos por método
    const movimientos = await prisma.movimientoContable.findMany();
    
    const movimientosCaja = movimientos.filter(m => m.metodo === 'caja');
    const movimientosPapeleria = movimientos.filter(m => m.metodo === 'papeleria');
    const movimientosBanco = movimientos.filter(m => m.metodo === 'banco');
    
    console.log('Movimientos de caja:', movimientosCaja.length);
    console.log('Movimientos de papeleria:', movimientosPapeleria.length);
    console.log('Movimientos de banco:', movimientosBanco.length);
    
    // Calcular totales por método
    const totalCaja = movimientosCaja.reduce((sum, m) => {
      return sum + (m.tipo === 'ingreso' ? parseFloat(m.monto) : -parseFloat(m.monto));
    }, 0);
    
    const totalPapeleria = movimientosPapeleria.reduce((sum, m) => {
      return sum + (m.tipo === 'ingreso' ? parseFloat(m.monto) : -parseFloat(m.monto));
    }, 0);
    
    console.log('\n--- Totales Calculados ---');
    console.log('Total caja (calculado):', totalCaja);
    console.log('Total papeleria (calculado):', totalPapeleria);
    console.log('Total caja (en caja):', cajaBalance);
    console.log('Total papeleria (en caja):', papeleriaBalance);
    
  } catch (error) {
    console.error('Error al verificar balances:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se corre directamente
if (require.main === module) {
  checkApiBalances()
    .then(() => console.log('Verificación completada'))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = checkApiBalances;