import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDadminPermissions() {
  console.log('🔍 Verificando permisos del usuario Dadmin...\n');

  try {
    // Buscar usuario Dadmin
    const dadminUser = await prisma.usuario.findUnique({
      where: { username: 'Dadmin' },
      include: {
        usuariosRoles: {
          include: {
            rol: {
              include: {
                rolesPermisos: {
                  include: {
                    permiso: true
                  }
                }
              }
            }
          }
        },
        empleado: true
      }
    });

    if (!dadminUser) {
      console.log('❌ Usuario Dadmin no encontrado');
      return;
    }

    console.log('👤 Información del usuario Dadmin:');
    console.log(`   Nombre: ${dadminUser.nombre} ${dadminUser.apellido}`);
    console.log(`   Username: ${dadminUser.username}`);
    console.log(`   Es empleado: ${dadminUser.esEmpleado ? 'Sí' : 'No'}`);
    console.log(`   Empleado: ${dadminUser.empleado ? 'Sí' : 'No'}`);

    if (dadminUser.empleado) {
      console.log(`   Código empleado: ${dadminUser.empleado.codigoEmpleado}`);
      console.log(`   Estado empleado: ${dadminUser.empleado.estado}`);
    }

    console.log('\n🔐 Roles asignados:');
    if (dadminUser.usuariosRoles.length === 0) {
      console.log('   ❌ No tiene roles asignados');
    } else {
      dadminUser.usuariosRoles.forEach(usuarioRol => {
        console.log(`   ✅ Rol: ${usuarioRol.rol.nombreRol} (Prioridad: ${usuarioRol.rol.prioridad})`);
      });
    }

    console.log('\n⚡ Permisos a través de roles:');
    let totalPermissions = 0;
    dadminUser.usuariosRoles.forEach(usuarioRol => {
      console.log(`   📋 Permisos del rol "${usuarioRol.rol.nombreRol}":`);
      if (usuarioRol.rol.rolesPermisos.length === 0) {
        console.log('      ❌ No tiene permisos asignados');
      } else {
        usuarioRol.rol.rolesPermisos.forEach(rolPermiso => {
          console.log(`      ✅ ${rolPermiso.permiso.nombrePermiso} (${rolPermiso.permiso.categoria})`);
          totalPermissions++;
        });
      }
    });

    console.log(`\n📊 Total de permisos: ${totalPermissions}`);

    // Verificar permisos específicos que deberían tener según seed-original.mjs
    const requiredPermissions = [
      'gestionar_usuarios',
      'gestionar_roles',
      'gestionar_permisos',
      'ver_dashboard_admin'
    ];

    console.log('\n🔍 Verificando permisos específicos requeridos:');
    for (const permName of requiredPermissions) {
      const hasPermission = dadminUser.usuariosRoles.some(usuarioRol =>
        usuarioRol.rol.rolesPermisos.some(rolPermiso =>
          rolPermiso.permiso.nombrePermiso === permName
        )
      );

      if (hasPermission) {
        console.log(`   ✅ ${permName}: Tiene acceso`);
      } else {
        console.log(`   ❌ ${permName}: No tiene acceso`);
      }
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDadminPermissions();
