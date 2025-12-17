import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function fixDadminPermissions() {
  console.log('🔧 Corrigiendo permisos del usuario Dadmin...\n');

  try {
    // 1. Buscar o crear el rol de Administrador
    let adminRole = await prisma.role.findUnique({
      where: { nombreRol: 'Administrador' },
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          nombreRol: 'Administrador',
          descripcion: 'Rol con acceso total al sistema.',
          prioridad: 1,
          activo: true,
        },
      });
      console.log('✅ Rol "Administrador" creado.');
    } else {
      console.log('ℹ️ Rol "Administrador" ya existe.');
    }

    // 2. Buscar usuario Dadmin
    let dadminUser = await prisma.usuario.findUnique({
      where: { username: 'Dadmin' },
    });

    if (!dadminUser) {
      console.log('❌ Usuario Dadmin no encontrado. Creándolo...');
      const hashedPassword = await bcrypt.hash('Axm0227*', 10);
      dadminUser = await prisma.usuario.create({
        data: {
          username: 'Dadmin',
          nombre: 'Daniel',
          apellido: 'Beras',
          passwordHash: hashedPassword,
          activo: true,
          esEmpleado: true,
        },
      });
      console.log('✅ Usuario "Dadmin" creado.');
    } else {
      console.log('ℹ️ Usuario "Dadmin" ya existe.');
    }

    // 3. Crear empleado asociado si no existe
    let empleado = await prisma.empleado.findFirst({
      where: { usuarioId: dadminUser.id },
    });

    if (!empleado) {
      empleado = await prisma.empleado.create({
        data: {
          usuarioId: dadminUser.id,
          codigoEmpleado: 'ADM001',
          cedula: '123456789',
          nombres: 'Daniel',
          apellidos: 'Beras',
          fechaIngreso: new Date(),
          salarioBase: 60000,
          estado: 'ACTIVO',
        },
      });
      console.log('✅ Empleado "Daniel Beras" creado.');
    } else {
      console.log('ℹ️ Empleado "Daniel Beras" ya existe.');
    }

    // 4. Verificar si ya tiene el rol asignado
    const existingRole = await prisma.usuarioRole.findFirst({
      where: {
        usuarioId: dadminUser.id,
        rolId: adminRole.id,
      },
    });

    if (!existingRole) {
      // Asignar rol de Administrador
      await prisma.usuarioRole.create({
        data: {
          usuarioId: dadminUser.id,
          rolId: adminRole.id,
          activo: true,
        },
      });
      console.log('✅ Rol "Administrador" asignado a "Dadmin".');
    } else {
      console.log('ℹ️ Rol "Administrador" ya está asignado a "Dadmin".');
    }

    // 5. Crear permisos específicos si no existen
    const permissions = [
      { name: 'gestionar_usuarios', description: 'Permite crear, ver, editar y eliminar usuarios.', categoria: 'Administración' },
      { name: 'gestionar_roles', description: 'Permite gestionar los roles y sus permisos.', categoria: 'Administración' },
      { name: 'gestionar_permisos', description: 'Permite gestionar los permisos del sistema.', categoria: 'Administración' },
      { name: 'ver_dashboard_admin', description: 'Permite ver el dashboard de administración.', categoria: 'Administración' },
    ];

    for (const p of permissions) {
      let permission = await prisma.permiso.findUnique({
        where: { nombrePermiso: p.name },
      });

      if (!permission) {
        permission = await prisma.permiso.create({
          data: {
            nombrePermiso: p.name,
            descripcion: p.description,
            categoria: p.categoria,
            activo: true,
          },
        });
        console.log(`✅ Permiso "${p.name}" creado.`);
      } else {
        console.log(`ℹ️ Permiso "${p.name}" ya existe.`);
      }

      // Verificar si el rol ya tiene este permiso
      const existingRolePermission = await prisma.rolePermiso.findFirst({
        where: {
          rolId: adminRole.id,
          permisoId: permission.id,
        },
      });

      if (!existingRolePermission) {
        await prisma.rolePermiso.create({
          data: {
            rolId: adminRole.id,
            permisoId: permission.id,
            activo: true,
          },
        });
        console.log(`✅ Permiso "${p.name}" asignado al rol "Administrador".`);
      } else {
        console.log(`ℹ️ Permiso "${p.name}" ya está asignado al rol "Administrador".`);
      }
    }

    console.log('\n🎉 ¡Permisos de Dadmin corregidos exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDadminPermissions();
