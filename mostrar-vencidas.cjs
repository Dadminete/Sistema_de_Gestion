const prisma = require('./server/prismaClient');

async function mostrarCuentasVencidas() {
  try {
    console.log('🔍 Buscando cuentas VENCIDAS...\n');
    
    // Obtener cuentas vencidas
    const cuentasVencidas = await prisma.cuentaPorCobrar.findMany({
      where: { estado: 'vencida' },
      include: {
        cliente: {
          select: { nombre: true, apellidos: true, telefono: true }
        },
        factura: {
          select: { numeroFactura: true, fechaFactura: true }
        }
      },
      orderBy: { diasVencido: 'desc' }
    });
    
    console.log(`📊 Total de cuentas VENCIDAS: ${cuentasVencidas.length}\n`);
    
    if (cuentasVencidas.length === 0) {
      console.log('✅ No hay cuentas vencidas en el sistema.');
      return;
    }
    
    cuentasVencidas.forEach((cuenta, index) => {
      console.log(`${index + 1}. 🔴 ${cuenta.numeroDocumento}`);
      console.log(`   👤 Cliente: ${cuenta.cliente?.nombre} ${cuenta.cliente?.apellidos || ''}`);
      console.log(`   📞 Teléfono: ${cuenta.cliente?.telefono || 'No disponible'}`);
      console.log(`   💰 Monto pendiente: $${cuenta.montoPendiente}`);
      console.log(`   📅 Fecha emisión: ${cuenta.fechaEmision.toISOString().split('T')[0]}`);
      console.log(`   📅 Fecha vencimiento: ${cuenta.fechaVencimiento.toISOString().split('T')[0]}`);
      console.log(`   ⏰ Días vencida: ${cuenta.diasVencido} días`);
      if (cuenta.factura) {
        console.log(`   🧾 Factura: ${cuenta.factura.numeroFactura} (${cuenta.factura.fechaFactura?.toISOString().split('T')[0]})`);
      }
      console.log('');
    });
    
    // Calcular total vencido
    const totalVencido = cuentasVencidas.reduce((sum, cuenta) => sum + parseFloat(cuenta.montoPendiente), 0);
    console.log(`💸 TOTAL VENCIDO: $${totalVencido.toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

mostrarCuentasVencidas();