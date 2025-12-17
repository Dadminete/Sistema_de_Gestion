require('dotenv').config();
const prisma = require('./prismaClient');

async function quickFix() {
  try {
    // Check existing users
    const users = await prisma.usuario.findMany({
      select: { username: true, nombre: true, apellido: true }
    });
    
    console.log('Usuarios existentes:', users.map(u => u.username));
    
    // Create or update admin user
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    const adminUser = await prisma.usuario.upsert({
      where: { username: 'admin' },
      update: {
        password: hashedPassword,
        intentosFallidos: 0,
        bloqueadoHasta: null,
        activo: true
      },
      create: {
        username: 'admin',
        password: hashedPassword,
        nombre: 'Admin',
        apellido: 'Sistema',
        activo: true,
        intentosFallidos: 0
      }
    });
    
    console.log('✅ Usuario admin configurado:');
    console.log('Username: admin');
    console.log('Password: 123456');
    
    // Unblock all users
    await prisma.usuario.updateMany({
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null
      }
    });
    
    console.log('✅ Todos los usuarios desbloqueados');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickFix();
