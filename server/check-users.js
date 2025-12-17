require('dotenv').config();
const prisma = require('./prismaClient');

async function checkUsers() {
  try {
    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        username: true,
        nombre: true,
        apellido: true,
        intentosFallidos: true,
        bloqueadoHasta: true,
        activo: true
      }
    });

    console.log('📋 Users in database:');
    console.log('='.repeat(80));
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    users.forEach(user => {
      const isBlocked = user.bloqueadoHasta && new Date(user.bloqueadoHasta) > new Date();
      const status = isBlocked ? '🔒 BLOCKED' : user.activo ? '✅ ACTIVE' : '❌ INACTIVE';
      
      console.log(`${status} | ${user.username} | ${user.nombre} ${user.apellido}`);
      console.log(`   Failed attempts: ${user.intentosFallidos}`);
      if (user.bloqueadoHasta) {
        console.log(`   Blocked until: ${user.bloqueadoHasta}`);
      }
      console.log('-'.repeat(40));
    });

    // Unblock all users
    console.log('\n🔓 Unblocking all users...');
    const result = await prisma.usuario.updateMany({
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null
      }
    });

    console.log(`✅ Successfully unblocked ${result.count} users`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
