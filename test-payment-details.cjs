require('dotenv').config();
const { PrismaClient } = require('./server/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function testPaymentDetails() {
  try {
    const periodId = 5; // 2025-12-Q2
    
    console.log(`\n🔍 Buscando detalles de pago para período ${periodId}...\n`);
    
    // Get all payrolls for this period
    const payrolls = await prisma.nomina.findMany({
      where: { periodoId: periodId },
      include: {
        empleado: {
          include: {
            cargo: true
          }
        },
        periodo: true
      },
      orderBy: [{ empleado: { apellidos: 'asc' } }]
    });

    console.log(`📋 Nóminas encontradas: ${payrolls.length}\n`);

    for (const p of payrolls) {
      const salarioNeto = Number(p.salarioNeto);
      
      // Get payments
      const pagos = await prisma.movimientoContable.findMany({
        where: {
          tipo: 'gasto',
          descripcion: {
            contains: `[nominaId:${p.id.toString()}]`,
            mode: 'insensitive'
          }
        }
      });

      const totalPagado = pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
      const montoPendiente = salarioNeto - totalPagado;

      console.log(`👤 ${p.empleado.nombres} ${p.empleado.apellidos} - ${p.empleado.cargo?.nombreCargo || 'N/A'}`);
      console.log(`   ID Nómina: ${p.id}`);
      console.log(`   Salario Neto: RD$${salarioNeto.toFixed(2)}`);
      console.log(`   Pagos encontrados: ${pagos.length}`);
      if (pagos.length > 0) {
        pagos.forEach(pago => {
          console.log(`      - RD$${Number(pago.monto).toFixed(2)} el ${pago.fecha.toISOString().split('T')[0]}`);
        });
      }
      console.log(`   💰 Total Pagado: RD$${totalPagado.toFixed(2)}`);
      console.log(`   📊 Monto Pendiente: RD$${montoPendiente.toFixed(2)}`);
      console.log(`   Estado: ${p.estadoPago}\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentDetails();
