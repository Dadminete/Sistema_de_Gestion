const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsuarios() {
  try {
    console.log('=== LISTA DE USUARIOS ===');
    
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        username: true,
        nombre: true,
        apellido: true,
        email: true,
        activo: true
      }
    });
    
    console.log('Total de usuarios:', usuarios.length);
    
    usuarios.forEach(usuario => {
      console.log(`- ${usuario.nombre} ${usuario.apellido} (${usuario.username}) - ID: ${usuario.id} - Activo: ${usuario.activo}`);
    });
    
  } catch (error) {
    console.error('Error al listar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se corre directamente
if (require.main === module) {
  listUsuarios()
    .then(() => console.log('Listado completado'))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = listUsuarios;