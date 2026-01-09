const prisma = require('./server/prismaClient');

async function fixAdminPermissions() {
  console.log('🔧 Arreglando permisos de administrador...\n');

  try {
    // 1. Buscar el rol Administrador
    let adminRole = await prisma.role.findFirst({
      where: { nombreRol: 'Administrador' }
    });

    if (!adminRole) {
      console.log('❌ Rol "Administrador" no encontrado. Creando...');
      adminRole = await prisma.role.create({
        data: {
          nombreRol: 'Administrador',
          descripcion: 'Rol con acceso completo al sistema',
          prioridad: 100,
          esSistema: true,
          activo: true
        }
      });
      console.log('✅ Rol "Administrador" creado');
    } else {
      console.log('✅ Rol "Administrador" encontrado:', adminRole.id);
    }

    // 2. Lista de TODOS los permisos críticos del sistema
    const permisosRequeridos = [
      // Sistema
      { nombrePermiso: 'sistema.permisos', descripcion: 'Gestionar permisos del sistema', categoria: 'Sistema' },
      
      // Usuarios
      { nombrePermiso: 'usuarios.gestionar', descripcion: 'Gestionar usuarios del sistema', categoria: 'Usuarios' },
      { nombrePermiso: 'usuarios.roles', descripcion: 'Gestionar roles', categoria: 'Usuarios' },
      { nombrePermiso: 'usuarios.bitacora', descripcion: 'Ver bitácora de auditoría', categoria: 'Usuarios' },
      
      // Dashboard
      { nombrePermiso: 'dashboard.principal', descripcion: 'Ver dashboard principal', categoria: 'Dashboard' },
      
      // Clientes
      { nombrePermiso: 'clientes.dashboard', descripcion: 'Ver dashboard de clientes', categoria: 'Clientes' },
      { nombrePermiso: 'clientes.listado', descripcion: 'Ver listado de clientes activos', categoria: 'Clientes' },
      { nombrePermiso: 'clientes.inactivos', descripcion: 'Ver listado de clientes inactivos', categoria: 'Clientes' },
      { nombrePermiso: 'clientes.crear', descripcion: 'Crear nuevos clientes', categoria: 'Clientes' },
      { nombrePermiso: 'clientes.editar', descripcion: 'Editar clientes', categoria: 'Clientes' },
      { nombrePermiso: 'clientes.eliminar', descripcion: 'Eliminar clientes', categoria: 'Clientes' },
      { nombrePermiso: 'clientes.equipos_servicios', descripcion: 'Ver/gestionar Equipos & Servicios de clientes', categoria: 'Clientes' },
      { nombrePermiso: 'clientes.suscripciones', descripcion: 'Ver/gestionar suscripciones de clientes', categoria: 'Clientes' },
      
      // Servicios
      { nombrePermiso: 'servicios.categorias', descripcion: 'Gestionar categorías de servicios', categoria: 'Servicios' },
      { nombrePermiso: 'servicios.listado', descripcion: 'Ver listado de servicios', categoria: 'Servicios' },
      { nombrePermiso: 'servicios.planes', descripcion: 'Gestionar planes de servicio', categoria: 'Servicios' },
      
      // Contabilidad
      { nombrePermiso: 'contabilidad.dashboard', descripcion: 'Acceso al Dashboard de Contabilidad', categoria: 'Contabilidad' },
      { nombrePermiso: 'contabilidad.categorias_cuentas', descripcion: 'Gestionar categorías de cuentas contables', categoria: 'Contabilidad' },
      { nombrePermiso: 'contabilidad.ingresos_gastos', descripcion: 'Gestionar ingresos y gastos', categoria: 'Contabilidad' },
      { nombrePermiso: 'contabilidad.balance_general', descripcion: 'Ver balance general', categoria: 'Contabilidad' },
      
      // Cajas
      { nombrePermiso: 'cajas.dashboard', descripcion: 'Ver dashboard de cajas', categoria: 'Cajas' },
      { nombrePermiso: 'cajas.listado', descripcion: 'Ver listado de cajas', categoria: 'Cajas' },
      { nombrePermiso: 'cajas.traspasos', descripcion: 'Gestionar traspasos entre cajas', categoria: 'Cajas' },
      { nombrePermiso: 'cajas.cuentas_bancarias', descripcion: 'Gestionar cuentas bancarias', categoria: 'Cajas' },
      
      // Facturas
      { nombrePermiso: 'facturas.dashboard', descripcion: 'Ver dashboard de facturas', categoria: 'Facturas' },
      { nombrePermiso: 'facturas.listado', descripcion: 'Ver listado de facturas', categoria: 'Facturas' },
      { nombrePermiso: 'facturas.crear', descripcion: 'Crear facturas', categoria: 'Facturas' },
      { nombrePermiso: 'facturas.editar', descripcion: 'Editar facturas', categoria: 'Facturas' },
      
      // RRHH
      { nombrePermiso: 'rrhh.dashboard', descripcion: 'Ver dashboard de RRHH', categoria: 'RRHH' },
      { nombrePermiso: 'rrhh.empleados', descripcion: 'Gestionar empleados', categoria: 'RRHH' },
      { nombrePermiso: 'rrhh.nomina', descripcion: 'Gestionar nómina', categoria: 'RRHH' },
      { nombrePermiso: 'rrhh.prestamos', descripcion: 'Gestionar préstamos', categoria: 'RRHH' },
      { nombrePermiso: 'rrhh.comisiones', descripcion: 'Gestionar comisiones', categoria: 'RRHH' },
      { nombrePermiso: 'rrhh.cargos', descripcion: 'Gestionar cargos', categoria: 'RRHH' },
      { nombrePermiso: 'rrhh.departamentos', descripcion: 'Gestionar departamentos', categoria: 'RRHH' },
      
      // Agenda
      { nombrePermiso: 'agenda.tareas', descripcion: 'Gestionar tareas', categoria: 'Agenda' },
      { nombrePermiso: 'agenda.eventos', descripcion: 'Gestionar eventos', categoria: 'Agenda' },
      
      // Papelería
      { nombrePermiso: 'papeleria.dashboard', descripcion: 'Ver dashboard de papelería', categoria: 'Papelería' },
      { nombrePermiso: 'papeleria.productos', descripcion: 'Gestionar productos de papelería', categoria: 'Papelería' },
      { nombrePermiso: 'papeleria.categorias', descripcion: 'Gestionar categorías de papelería', categoria: 'Papelería' },
      { nombrePermiso: 'papeleria.ventas', descripcion: 'Gestionar ventas de papelería', categoria: 'Papelería' },
      { nombrePermiso: 'papeleria.clientes', descripcion: 'Gestionar clientes de papelería', categoria: 'Papelería' },
    ];

    console.log(`\n📝 Verificando ${permisosRequeridos.length} permisos...\n`);

    // 3. Crear/actualizar permisos
    const permisosCreados = [];
    for (const permisoData of permisosRequeridos) {
      let permiso = await prisma.permiso.findUnique({
        where: { nombrePermiso: permisoData.nombrePermiso }
      });

      if (!permiso) {
        permiso = await prisma.permiso.create({
          data: {
            nombrePermiso: permisoData.nombrePermiso,
            descripcion: permisoData.descripcion,
            categoria: permisoData.categoria,
            activo: true
          }
        });
        console.log(`   ✅ Permiso creado: ${permisoData.nombrePermiso}`);
      } else if (!permiso.activo) {
        // Activar si estaba inactivo
        await prisma.permiso.update({
          where: { id: permiso.id },
          data: { activo: true }
        });
        console.log(`   🔄 Permiso activado: ${permisoData.nombrePermiso}`);
      }

      permisosCreados.push(permiso);

      // 4. Asignar permiso al rol Administrador si no existe
      const rolePermisoExistente = await prisma.rolePermiso.findFirst({
        where: {
          rolId: adminRole.id,
          permisoId: permiso.id
        }
      });

      if (!rolePermisoExistente) {
        await prisma.rolePermiso.create({
          data: {
            rolId: adminRole.id,
            permisoId: permiso.id,
            activo: true
          }
        });
      } else if (!rolePermisoExistente.activo) {
        await prisma.rolePermiso.update({
          where: { id: rolePermisoExistente.id },
          data: { activo: true }
        });
      }
    }

    console.log(`\n✅ Total de permisos procesados: ${permisosCreados.length}`);

    // 5. Buscar usuario administrador (Dadmin o cualquier usuario con rol Administrador)
    const adminUsers = await prisma.usuario.findMany({
      where: {
        usuariosRoles: {
          some: {
            rolId: adminRole.id
          }
        }
      },
      include: {
        usuariosRoles: {
          include: {
            rol: true
          }
        }
      }
    });

    console.log(`\n👥 Usuarios con rol Administrador: ${adminUsers.length}`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.nombre} ${user.apellido})`);
    });

    // 6. Verificar asignación del rol
    if (adminUsers.length === 0) {
      console.log('\n⚠️ No se encontraron usuarios con rol Administrador');
      console.log('   Por favor, asigna manualmente el rol en la interfaz');
    } else {
      console.log('\n✅ Usuarios administradores tienen acceso a todos los permisos');
    }

    // 7. Verificar que los rolePermisos estén activos
    const rolePermisosCount = await prisma.rolePermiso.count({
      where: {
        rolId: adminRole.id,
        activo: true
      }
    });

    console.log(`\n📊 Total de permisos activos asignados al rol Administrador: ${rolePermisosCount}`);

    console.log('\n✅ ¡Proceso completado exitosamente!');
    console.log('\n🔑 Instrucciones finales:');
    console.log('   1. Cierra sesión en el navegador');
    console.log('   2. Limpia las cookies y caché del navegador (Ctrl+Shift+Delete)');
    console.log('   3. Vuelve a iniciar sesión');
    console.log('   4. Los permisos deberían estar disponibles ahora\n');

  } catch (error) {
    console.error('❌ Error al arreglar permisos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPermissions();
