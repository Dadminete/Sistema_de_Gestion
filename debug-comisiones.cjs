const prisma = require('./server/prismaClient');

async function debugComisiones() {
  try {
    console.log('=== DEBUGGING COMISIONES ===');
    
    // 1. Ver las comisiones con detalles completos
    console.log('\n1. COMISIONES COMPLETAS:');
    const comisiones = await prisma.comision.findMany({
      select: {
        id: true,
        montoBase: true,
        montoComision: true,
        porcentajeAplicado: true,
        estado: true,
        empleado: {
          select: { nombres: true, apellidos: true }
        },
        tipoComision: {
          select: { nombreTipo: true, porcentajeBase: true }
        }
      },
      orderBy: { id: 'desc' },
      take: 5
    });
    
    console.table(comisiones.map(c => ({
      id: c.id.toString(),
      montoBase: c.montoBase?.toString() || 'null',
      montoComision: c.montoComision?.toString() || 'null',
      porcentajeAplicado: c.porcentajeAplicado?.toString() || 'null',
      estado: c.estado,
      empleado: `${c.empleado.nombres} ${c.empleado.apellidos}`,
      tipoComision: c.tipoComision?.nombreTipo || 'null',
      porcentajeBase: c.tipoComision?.porcentajeBase?.toString() || 'null'
    })));

    // 2. Ver los tipos de comisión
    console.log('\n2. TIPOS DE COMISION:');
    const tipos = await prisma.tipoComision.findMany({
      select: {
        id: true,
        nombreTipo: true,
        porcentajeBase: true,
        montoFijo: true,
        activo: true
      }
    });
    
    console.table(tipos.map(t => ({
      id: t.id.toString(),
      nombreTipo: t.nombreTipo,
      porcentajeBase: t.porcentajeBase?.toString() || 'null',
      montoFijo: t.montoFijo?.toString() || 'null',
      activo: t.activo
    })));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugComisiones();