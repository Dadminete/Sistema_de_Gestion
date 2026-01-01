const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function verificarAjustes() {
  try {
    console.log('=== VERIFICANDO MOVIMIENTOS DE AJUSTE ===\n');

    // Buscar todos los movimientos de ajuste
    const ajustes = await prisma.movimientoContable.findMany({
      where: {
        metodo: 'ajuste'
      },
      orderBy: {
        fecha: 'desc'
      },
      include: {
        caja: {
          select: { nombre: true }
        }
      }
    });

    console.log(`📊 Total de movimientos de ajuste encontrados: ${ajustes.length}\n`);

    ajustes.forEach((ajuste, index) => {
      console.log(`${index + 1}. ${ajuste.caja?.nombre || 'Sin caja'}`);
      console.log(`   ID: ${ajuste.id}`);
      console.log(`   Fecha: ${ajuste.fecha}`);
      console.log(`   Tipo: ${ajuste.tipo}`);
      console.log(`   Monto: RD$${Number(ajuste.monto)}`);
      console.log(`   Descripción: ${ajuste.descripcion}`);
      console.log('');
    });

    // Obtener saldos actuales de las cajas
    const cajaPrincipal = await prisma.caja.findFirst({
      where: {
        OR: [
          { nombre: { equals: 'Caja Principal', mode: 'insensitive' } },
          { tipo: 'general' }
        ],
        activa: true
      }
    });

    const cajaFuerte = await prisma.caja.findFirst({
      where: {
        nombre: { contains: 'Fuerte', mode: 'insensitive' },
        activa: true
      }
    });

    console.log('📦 Saldos actuales:');
    if (cajaPrincipal) {
      console.log(`   Caja Principal: RD$${Number(cajaPrincipal.saldoActual)}`);
    }
    if (cajaFuerte) {
      console.log(`   Caja Fuerte: RD$${Number(cajaFuerte.saldoActual)}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarAjustes();
