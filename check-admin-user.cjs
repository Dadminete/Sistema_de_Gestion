const prisma = require('./server/prismaClient');

(async () => {
  try {
    console.log('🔍 Verificando estructura de usuario administrador...');
    
    // Buscar usuario con rol de Administrador
    const adminUser = await prisma.usuario.findFirst({
      where: {
        usuariosRoles: {
          some: {
            rol: {
              nombreRol: 'Administrador'
            }
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
    
    if (adminUser) {
      console.log('✅ Usuario administrador encontrado:');
      console.log('  - ID:', adminUser.id);
      console.log('  - Username:', adminUser.username);
      console.log('  - Nombre:', adminUser.nombre, adminUser.apellido);
      console.log('  - Roles:');
      adminUser.usuariosRoles.forEach(ur => {
        console.log('    -', ur.rol.nombreRol);
      });
      
      // Verificar permisos
      const permisos = await prisma.rolePermiso.findMany({
        where: {
          rol: {
            nombreRol: 'Administrador'
          }
        },
        include: {
          permiso: true
        }
      });
      
      console.log('  - Permisos del rol Administrador:');
      permisos.forEach(rp => {
        console.log('    -', rp.permiso.nombrePermiso);
      });
      
      // Buscar permisos específicos que necesitamos
      const adminPermisos = ['gestionar_usuarios', 'gestionar_roles', 'sistema.permisos'];
      const tienePermisosAdmin = permisos.filter(rp => 
        adminPermisos.includes(rp.permiso.nombrePermiso)
      );
      
      console.log('  - Permisos de administración encontrados:');
      tienePermisosAdmin.forEach(rp => {
        console.log('    ✅', rp.permiso.nombrePermiso);
      });
      
      if (tienePermisosAdmin.length === 0) {
        console.log('  ❌ No se encontraron permisos de administración!');
      }
      
    } else {
      console.log('❌ No se encontró usuario con rol Administrador');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
})();