require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAuthSystem() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Check if users exist
    const userCount = await prisma.usuario.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      // Get first user and unblock all accounts
      const users = await prisma.usuario.findMany({
        select: {
          username: true,
          intentosFallidos: true,
          bloqueadoHasta: true,
          activo: true
        }
      });
      
      console.log('\n👥 Users found:');
      users.forEach(user => {
        const blocked = user.bloqueadoHasta && new Date(user.bloqueadoHasta) > new Date();
        console.log(`- ${user.username}: ${blocked ? '🔒 BLOCKED' : '✅ ACTIVE'} (Failed attempts: ${user.intentosFallidos})`);
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
    } else {
      console.log('⚠️  No users found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthSystem();
