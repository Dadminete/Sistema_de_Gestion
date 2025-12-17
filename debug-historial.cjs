const prisma = require('./server/prismaClient');

async function debugHistorial() {
  try {
    console.log('=== DEBUG HISTORIAL DE TODAS LAS CAJAS ===\n');
    
    // Obtener todas las cajas activas
    const cajasActivas = await prisma.caja.findMany({
      where: { activa: true },
      select: { id: true, nombre: true, tipo: true }
    });
    
    console.log(`Cajas activas encontradas: ${cajasActivas.length}`);
    cajasActivas.forEach(c => {
      console.log(`- ${c.nombre} (${c.tipo}) - ID: ${c.id}`);
    });
    
    // Contar aperturas y cierres por caja
    console.log('\n=== CONTEO POR CAJA ===');
    for (const caja of cajasActivas) {
      const aperturasCount = await prisma.aperturaCaja.count({
        where: { cajaId: caja.id }
      });
      
      const cierresCount = await prisma.cierreCaja.count({
        where: { cajaId: caja.id }
      });
      
      console.log(`${caja.nombre}:`);
      console.log(`  Aperturas: ${aperturasCount}`);
      console.log(`  Cierres: ${cierresCount}`);
    }
    
    // Obtener historial reciente de todas las cajas
    console.log('\n=== HISTORIAL RECIENTE DE TODAS LAS CAJAS ===');
    
    let historialCompleto = [];
    
    for (const caja of cajasActivas) {
      // Aperturas
      const aperturas = await prisma.aperturaCaja.findMany({
        where: { cajaId: caja.id },
        include: { 
          usuario: { select: { nombre: true, apellido: true } }
        },
        orderBy: { fechaApertura: 'desc' },
        take: 5
      });
      
      aperturas.forEach(a => {
        historialCompleto.push({
          tipo: 'apertura',
          fecha: a.fechaApertura,
          monto: a.montoInicial,
          usuario: `${a.usuario.nombre} ${a.usuario.apellido}`,
          caja: caja.nombre
        });
      });
      
      // Cierres
      const cierres = await prisma.cierreCaja.findMany({
        where: { cajaId: caja.id },
        include: { 
          usuario: { select: { nombre: true, apellido: true } }
        },
        orderBy: { fechaCierre: 'desc' },
        take: 5
      });
      
      cierres.forEach(c => {
        historialCompleto.push({
          tipo: 'cierre',
          fecha: c.fechaCierre,
          monto: c.montoFinal,
          usuario: `${c.usuario.nombre} ${c.usuario.apellido}`,
          caja: caja.nombre
        });
      });
    }
    
    // Ordenar y mostrar
    historialCompleto
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 15)
      .forEach(h => {
        console.log(`${h.tipo.toUpperCase()} - ${h.caja} - ${h.fecha} - $${h.monto} - ${h.usuario}`);
      });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugHistorial();