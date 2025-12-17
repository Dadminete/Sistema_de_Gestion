#!/usr/bin/env node
/*
  Seed idempotente para crear permisos alineados a TODOS los menús y submenús
  - No borra nada
  - Crea/actualiza permisos con upsert
  - Asigna a rol "admin" todos los permisos automáticamente
  
  Estructura de permisos: menu.submenu
  Ejemplo: clientes.dashboard, clientes.crear, averias.dashboard, etc.
*/
const prisma = require('./prismaClient');

async function main() {
  // Definición completa de menús y submenús basada en Sidebar.tsx
  const menuStructure = {
    averias: [
      { key: 'averias.dashboard', nombre: 'Dashboard Averias', descripcion: 'Acceso al Dashboard de Averias' },
      { key: 'averias.crear', nombre: 'Crear Averia', descripcion: 'Crear nuevas averías' },
      { key: 'averias.listado', nombre: 'Listado Averias', descripcion: 'Ver listado de averías' },
      { key: 'averias.cerrar', nombre: 'Cerrar Averias', descripcion: 'Cerrar averías registradas' },
    ],
    banco: [
      { key: 'banco.dashboard', nombre: 'Dashboard Banco', descripcion: 'Acceso al Dashboard de Banco' },
      { key: 'banco.gestion', nombre: 'Gestión de Bancos', descripcion: 'Gestionar bancos' },
    ],
    cajas: [
      { key: 'cajas.dashboard', nombre: 'Dashboard Cajas', descripcion: 'Acceso al Dashboard de Cajas Chicas' },
      { key: 'cajas.apertura_cierre', nombre: 'Apertura & Cierre', descripcion: 'Abrir y cerrar cajas chicas' },
      { key: 'cajas.listado', nombre: 'Listado Cajas', descripcion: 'Ver listado de cajas chicas' },
      { key: 'cajas.configuracion', nombre: 'Configuración', descripcion: 'Configurar cajas chicas (solo admin)' },
    ],
    clientes: [
      { key: 'clientes.dashboard', nombre: 'Dashboard Clientes', descripcion: 'Acceso al Dashboard de Clientes' },
      { key: 'clientes.crear', nombre: 'Crear Clientes', descripcion: 'Crear nuevos clientes' },
      { key: 'clientes.equipos_servicios', nombre: 'Equipos & Servicios', descripcion: 'Ver/gestionar Equipos & Servicios de clientes' },
      { key: 'clientes.listado', nombre: 'Listado Clientes', descripcion: 'Ver listado de clientes activos' },
      { key: 'clientes.inactivos', nombre: 'Listado Inactivos', descripcion: 'Ver listado de clientes inactivos/suspendidos' },
      { key: 'clientes.suscripciones', nombre: 'Suscripciones', descripcion: 'Ver/gestionar suscripciones de clientes' },
    ],
    contabilidad: [
      { key: 'contabilidad.dashboard', nombre: 'Dash. Contabilidad', descripcion: 'Acceso al Dashboard de Contabilidad' },
      { key: 'contabilidad.categorias_cuentas', nombre: 'Categorias Cuentas', descripcion: 'Gestionar categorías de cuentas contables' },
      { key: 'contabilidad.cuentas_contables', nombre: 'Cuentas Contables', descripcion: 'Gestionar cuentas contables' },
      { key: 'contabilidad.cxp', nombre: 'CXP', descripcion: 'Gestionar Cuentas por Pagar' },
      { key: 'contabilidad.ingresos_gastos', nombre: 'Ingresos & Gastos', descripcion: 'Gestionar ingresos y gastos' },
      { key: 'contabilidad.pagos_mes', nombre: 'Pagos X Mes', descripcion: 'Ver pagos por mes' },
      { key: 'contabilidad.traspasos', nombre: 'Traspasos', descripcion: 'Gestionar traspasos contables' },
    ],
    facturas: [
      { key: 'facturas.dashboard', nombre: 'Dashboard Facturas', descripcion: 'Acceso al Dashboard de Facturas' },
      { key: 'facturas.crear', nombre: 'Crear Facturas', descripcion: 'Crear nuevas facturas' },
      { key: 'facturas.anuladas', nombre: 'Facturas Anuladas', descripcion: 'Ver facturas anuladas' },
      { key: 'facturas.pendientes', nombre: 'Facturas Pendientes', descripcion: 'Ver facturas pendientes' },
      { key: 'facturas.pagar', nombre: 'Pagar Facturas', descripcion: 'Procesar pagos de facturas' },
      { key: 'facturas.pagas', nombre: 'Facturas Pagas', descripcion: 'Ver facturas pagadas' },
      { key: 'facturas.pagos_mes', nombre: 'Pagos x Mes', descripcion: 'Ver pagos por mes' },
    ],
    listados: [
      { key: 'listados.ingresos', nombre: 'Lista Ingresos', descripcion: 'Ver listado de ingresos' },
      { key: 'listados.gastos', nombre: 'Lista Gastos', descripcion: 'Ver listado de gastos' },
    ],
    papeleria: [
      { key: 'papeleria.dashboard', nombre: 'Dashboard Papeleria', descripcion: 'Acceso al Dashboard de Papelería' },
      { key: 'papeleria.papeleria', nombre: 'Papeleria', descripcion: 'Gestionar papelería' },
      { key: 'papeleria.clientes', nombre: 'Clientes', descripcion: 'Gestionar clientes de papelería' },
      { key: 'papeleria.productos', nombre: 'Productos', descripcion: 'Gestionar productos de papelería' },
      { key: 'papeleria.categorias', nombre: 'Categorias', descripcion: 'Gestionar categorías de productos' },
      { key: 'papeleria.listado', nombre: 'Listado Papeleria', descripcion: 'Ver listado de papelería' },
    ],
    base_datos: [
      { key: 'base_datos.backup_crear', nombre: 'Crear Backup', descripcion: 'Crear backup de base de datos' },
      { key: 'base_datos.backup_listado', nombre: 'Listado de Backups', descripcion: 'Ver listado de backups' },
    ],
    chat: [
      { key: 'chat.acceso', nombre: 'Chat', descripcion: 'Acceso al módulo de chat' },
    ],
    calendario: [
      { key: 'calendario.acceso', nombre: 'Calendario', descripcion: 'Acceso al módulo de calendario' },
    ],
    rrhh: [
      { key: 'rrhh.empleados', nombre: 'Empleados', descripcion: 'Gestionar empleados' },
      { key: 'rrhh.nomina', nombre: 'Nómina', descripcion: 'Gestionar nómina' },
      { key: 'rrhh.prestamos', nombre: 'Préstamos', descripcion: 'Gestionar préstamos a empleados' },
      { key: 'rrhh.comisiones', nombre: 'Comisiones', descripcion: 'Gestionar comisiones' },
    ],
    servicios: [
      { key: 'servicios.categorias', nombre: 'Categorias', descripcion: 'Gestionar categorías de servicios' },
      { key: 'servicios.servicios', nombre: 'Servicios', descripcion: 'Gestionar servicios' },
      { key: 'servicios.planes', nombre: 'Planes', descripcion: 'Gestionar planes de servicios' },
    ],
    sistema: [
      { key: 'sistema.permisos', nombre: 'Permisos', descripcion: 'Gestionar permisos del sistema' },
      { key: 'sistema.info', nombre: 'Info', descripcion: 'Ver información del sistema' },
    ],
    usuarios: [
      { key: 'usuarios.usuarios', nombre: 'Usuarios', descripcion: 'Gestionar usuarios' },
      { key: 'usuarios.roles', nombre: 'Roles', descripcion: 'Gestionar roles' },
      { key: 'usuarios.permisos', nombre: 'Permisos', descripcion: 'Gestionar permisos de usuarios' },
      { key: 'usuarios.bitacora', nombre: 'Bitácora', descripcion: 'Ver bitácora de auditoría' },
    ],
  };

  // Flatten all permissions for creation
  const allPermisos = [];
  for (const [categoria, permisos] of Object.entries(menuStructure)) {
    allPermisos.push(...permisos.map(p => ({ ...p, categoria })));
  }

  console.log(`Creando ${allPermisos.length} permisos del sistema...`);
  const createdPermisos = [];
  
  for (const p of allPermisos) {
    const permiso = await prisma.permiso.upsert({
      where: { nombrePermiso: p.key },
      update: { 
        descripcion: p.descripcion, 
        categoria: p.categoria, 
        activo: true 
      },
      create: {
        nombrePermiso: p.key,
        descripcion: p.descripcion,
        categoria: p.categoria,
        activo: true,
        esSistema: false,
      },
    });
    createdPermisos.push(permiso);
  }
  console.log(`✅ ${createdPermisos.length} permisos creados/actualizados.`);

  // Asignar todos los permisos a rol admin
  const admin = await prisma.role.findFirst({ 
    where: { nombreRol: { in: ['admin', 'ADMIN', 'Administrador', 'administrador'] } } 
  });
  
  if (admin) {
    console.log(`\n🔐 Asignando todos los permisos al rol admin: ${admin.nombreRol}`);
    
    for (const perm of createdPermisos) {
      await prisma.rolePermiso.upsert({
        where: { rolId_permisoId: { rolId: admin.id, permisoId: perm.id } },
        update: { activo: true },
        create: { rolId: admin.id, permisoId: perm.id, activo: true },
      });
    }
    console.log(`✅ ${createdPermisos.length} permisos asignados al rol admin.`);
  } else {
    console.log('⚠️  No se encontró rol admin, se omitió asignación automática.');
  }

  console.log('\n✅ Seed completado exitosamente.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Error:', e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
