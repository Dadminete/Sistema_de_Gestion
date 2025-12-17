require('dotenv').config();
const prisma = require('./prismaClient');

async function listUsers() {
  try {
    const users = await prisma.usuario.findMany({
      select: {
        username: true,
        nombre: true,
        apellido: true,
        activo: true,
        intentosFallidos: true,
        bloqueadoHasta: true
      }
    });

    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ${user.username}: ${user.nombre} ${user.apellido} (Failed: ${user.intentosFallidos})`);
    });

    // Unblock all users
    await prisma.usuario.updateMany({
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null
      }
    });
    console.log('All users unblocked');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
