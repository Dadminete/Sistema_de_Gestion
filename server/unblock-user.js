const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function unblockUser(username) {
  try {
    const user = await prisma.usuario.update({
      where: { username },
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null
      }
    });

    console.log(`✅ Account unblocked successfully for user: ${username}`);
    console.log(`User ID: ${user.id}`);
    console.log(`Failed attempts reset to: ${user.intentosFallidos}`);
    console.log(`Block expiry cleared: ${user.bloqueadoHasta}`);
  } catch (error) {
    if (error.code === 'P2025') {
      console.error(`❌ User '${username}' not found in database`);
    } else {
      console.error('❌ Error unblocking user:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Get username from command line argument or default to 'admin'
const username = process.argv[2] || 'admin';
console.log(`🔓 Attempting to unblock user: ${username}`);

unblockUser(username);
