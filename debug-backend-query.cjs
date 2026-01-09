const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_Ev0Hi7VFnPOJ@ep-gentle-block-a4dvm99d-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function debugBackendQuery() {
  try {
    console.log('🔍 Replicando EXACTAMENTE la consulta del backend...\n');

    // Consulta SQL directa para ver TODOS los registros
    const suscripcionesDia15Raw = await prisma.$queryRaw`
      SELECT 
        s.id,
        s.precio_mensual,
        s.estado,
        s.numero_contrato,
        c.nombre,
        c.apellidos
      FROM suscripciones s
      LEFT JOIN clientes c ON s.cliente_id = c.id
      WHERE s.dia_facturacion = 15
        AND LOWER(s.estado) IN ('activo')
      ORDER BY s.precio_mensual DESC
    `;

    console.log(`📋 TODAS las suscripciones día 15 (${suscripcionesDia15Raw.length} registros):\n`);
    
    let total = 0;
    suscripcionesDia15Raw.forEach((sus, idx) => {
      const precio = parseFloat(sus.precio_mensual);
      total += precio;
      console.log(`   ${idx + 1}. ${sus.nombre || 'Sin nombre'} ${sus.apellidos || ''} - RD$${precio} - Estado: ${sus.estado} - Contrato: ${sus.numero_contrato}`);
    });

    console.log(`\n💰 Total calculado: RD$${total.toFixed(2)}`);

    // Ahora verificar con múltiples estados para comparar con el backend
    const suscripcionesMultiEstado = await prisma.$queryRaw`
      SELECT 
        s.id,
        s.precio_mensual,
        s.estado,
        s.numero_contrato,
        c.nombre,
        c.apellidos
      FROM suscripciones s
      LEFT JOIN clientes c ON s.cliente_id = c.id
      WHERE s.dia_facturacion = 15
        AND (LOWER(s.estado) = 'activo' OR s.estado = 'Activo' OR s.estado = 'ACTIVO')
      ORDER BY s.precio_mensual DESC
    `;

    console.log(`\n🔄 Con múltiples estados (${suscripcionesMultiEstado.length} registros):\n`);
    
    let totalMulti = 0;
    suscripcionesMultiEstado.forEach((sus, idx) => {
      const precio = parseFloat(sus.precio_mensual);
      totalMulti += precio;
      console.log(`   ${idx + 1}. ${sus.nombre || 'Sin nombre'} ${sus.apellidos || ''} - RD$${precio} - Estado: '${sus.estado}' - Contrato: ${sus.numero_contrato}`);
    });

    console.log(`\n💰 Total con múltiples estados: RD$${totalMulti.toFixed(2)}`);

    // Verificar clientes con múltiples suscripciones
    const clientesDuplicados = await prisma.$queryRaw`
      SELECT 
        c.nombre,
        c.apellidos,
        COUNT(*) as cantidad,
        SUM(s.precio_mensual) as total
      FROM suscripciones s
      JOIN clientes c ON s.cliente_id = c.id
      WHERE s.dia_facturacion = 15
        AND (LOWER(s.estado) = 'activo' OR s.estado = 'Activo' OR s.estado = 'ACTIVO')
      GROUP BY c.id, c.nombre, c.apellidos
      HAVING COUNT(*) > 1
    `;

    if (clientesDuplicados.length > 0) {
      console.log(`\n⚠️ CLIENTES CON MÚLTIPLES SUSCRIPCIONES ACTIVAS DÍA 15:`);
      clientesDuplicados.forEach(cliente => {
        console.log(`   ${cliente.nombre} ${cliente.apellidos}: ${cliente.cantidad} suscripciones - Total: RD$${parseFloat(cliente.total).toFixed(2)}`);
      });
    } else {
      console.log(`\n✅ No hay clientes con múltiples suscripciones activas día 15`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBackendQuery();
