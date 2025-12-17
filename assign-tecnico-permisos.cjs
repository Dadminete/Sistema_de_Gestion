#!/usr/bin/env node
/*
  Script para asignar permisos al rol "Tecnico"
  Basado en los permisos que están definidos en seed-permisos-menu.cjs
*/
const prisma = require('./server/prismaClient');

async function main() {
  console.log('🔧 Asignando permisos al rol "Tecnico"...\n');

  // Buscar el rol "Tecnico"
  const tecnicoRole = await prisma.role.findFirst({
    where: {
      nombreRol: {
        in: ['tecnico', 'Tecnico', 'TECNICO', 'Técnico', 'técnico'],
      },
    },
  });

  if (!tecnicoRole) {
    console.error('❌ No se encontró el rol "Tecnico"');
    return;
  }

  console.log(`✅ Rol encontrado: ${tecnicoRole.nombreRol} (ID: ${tecnicoRole.id})\n`);

  // Permisos que debe tener Tecnico
  // Típicamente: Averías, Clientes (lectura), Dashboard, Chat, Calendario
  const permisosParaTecnico = [
    // Averías - acceso completo
    'averias.dashboard',
    'averias.crear',
    'averias.listado',
    'averias.cerrar',
    
    // Clientes - acceso a consulta
    'clientes.dashboard',
    'clientes.listado',
    'clientes.equipos_servicios',
    'clientes.suscripciones',
    
    // Banco - solo lectura
    'banco.dashboard',
    
    // Cajas - acceso básico
    'cajas.dashboard',
    'cajas.listado',
    
    // Contabilidad - solo lectura
    'contabilidad.dashboard',
    
    // Facturas - acceso para consulta
    'facturas.dashboard',
    'facturas.pendientes',
    'facturas.pagas',
    
    // Listados
    'listados.ingresos',
    'listados.gastos',
    
    // Chat y Calendario
    'chat.acceso',
    'calendario.acceso',
  ];

  console.log(`📋 Asignando ${permisosParaTecnico.length} permisos:\n`);

  let asignados = 0;
  let existentes = 0;

  for (const nombrePermiso of permisosParaTecnico) {
    // Buscar el permiso
    const permiso = await prisma.permiso.findFirst({
      where: { nombrePermiso },
    });

    if (!permiso) {
      console.warn(`⚠️  Permiso no encontrado: ${nombrePermiso}`);
      continue;
    }

    // Asignar al rol (upsert)
    const rolePermiso = await prisma.rolePermiso.upsert({
      where: {
        rolId_permisoId: {
          rolId: tecnicoRole.id,
          permisoId: permiso.id,
        },
      },
      update: { activo: true },
      create: {
        rolId: tecnicoRole.id,
        permisoId: permiso.id,
        activo: true,
      },
    });

    if (rolePermiso) {
      console.log(`✅ ${nombrePermiso}`);
      asignados++;
    } else {
      existentes++;
    }
  }

  console.log(`\n✅ Permisos asignados al rol Tecnico: ${asignados}`);
  console.log(`📊 Total procesados: ${permisosParaTecnico.length}`);

  // Mostrar resumen de permisos del rol
  const permisosDeTecnico = await prisma.rolePermiso.findMany({
    where: {
      rolId: tecnicoRole.id,
      activo: true,
    },
    include: {
      permiso: true,
    },
  });

  console.log(`\n📋 Total de permisos activos para ${tecnicoRole.nombreRol}: ${permisosDeTecnico.length}`);
  console.log('\n📍 Permisos asignados:');
  permisosDeTecnico.forEach((rp) => {
    console.log(`  - ${rp.permiso.nombrePermiso}`);
  });
}

main()
  .then(() => {
    console.log('\n✅ Script completado exitosamente.');
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error('\n❌ Error:', e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
