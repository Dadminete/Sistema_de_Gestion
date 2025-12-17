require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showUsers() {
  try {
    const users = await prisma.usuario.findMany();
    
    console.log('='.repeat(50));
    console.log('USUARIOS EN LA BASE DE DATOS');
    console.log('='.repeat(50));
    
    if (users.length === 0) {
      console.log('No hay usuarios en la base de datos');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Nombre: ${user.nombre} ${user.apellido}`);
        console.log(`   Activo: ${user.activo ? 'Sí' : 'No'}`);
        console.log(`   Intentos fallidos: ${user.intentosFallidos}`);
        console.log(`   Bloqueado hasta: ${user.bloqueadoHasta || 'No bloqueado'}`);
        console.log('-'.repeat(30));
      });
    }
    
    // Unblock all users
    await prisma.usuario.updateMany({
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null
      }
    });
    console.log('✅ Todos los usuarios han sido desbloqueados');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

showUsers();
