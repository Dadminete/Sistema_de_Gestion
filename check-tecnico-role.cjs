const prisma = require('./server/prismaClient');

async function checkTecnicoRole() {
  console.log('🔍 Verificando rol de Técnico...\n');

  try {
    // Buscar el rol de Técnico
    const tecnicoRole = await prisma.role.findFirst({
      where: {
        OR: [
          { nombreRol: 'Técnico' },
          { nombreRol: 'Tecnico' }
        ]
      }
    });

    if (tecnicoRole) {
      console.log('✅ Rol encontrado:');
      console.log(`   ID: ${tecnicoRole.id}`);
      console.log(`   Nombre: "${tecnicoRole.nombreRol}"`);
      console.log(`   Descripción: ${tecnicoRole.descripcion}`);
      console.log(`   Prioridad: ${tecnicoRole.prioridad}`);
      console.log(`   Activo: ${tecnicoRole.activo}`);
    } else {
      console.log('❌ No se encontró el rol de Técnico');
    }

    // Buscar usuario Moises
    const moisesUser = await prisma.usuario.findFirst({
      where: {
        OR: [
          { username: 'Moises' },
          { nombre: { contains: 'Moises', mode: 'insensitive' } }
        ]
      },
      include: {
        usuariosRoles: {
          include: {
            rol: true
          }
        }
      }
    });

    if (moisesUser) {
      console.log('\n👤 Usuario encontrado:');
      console.log(`   ID: ${moisesUser.id}`);
      console.log(`   Username: ${moisesUser.username}`);
      console.log(`   Nombre: ${moisesUser.nombre} ${moisesUser.apellido}`);
      console.log('\n   Roles asignados:');
      moisesUser.usuariosRoles.forEach(ur => {
        console.log(`   - "${ur.rol.nombreRol}" (ID: ${ur.rol.id})`);
      });
    } else {
      console.log('\n❌ No se encontró el usuario Moises');
    }

    // Listar todos los usuarios con rol de Técnico
    console.log('\n👥 Usuarios con rol de Técnico:');
    const tecnicos = await prisma.usuario.findMany({
      where: {
        usuariosRoles: {
          some: {
            rol: {
              OR: [
                { nombreRol: 'Técnico' },
                { nombreRol: 'Tecnico' }
              ]
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

    if (tecnicos.length > 0) {
      tecnicos.forEach(user => {
        console.log(`\n   - ${user.username} (${user.nombre} ${user.apellido})`);
        console.log(`     Roles: ${user.usuariosRoles.map(ur => `"${ur.rol.nombreRol}"`).join(', ')}`);
      });
      console.log(`\n   Total: ${tecnicos.length} técnicos encontrados`);
    } else {
      console.log('   No se encontraron técnicos');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTecnicoRole();
