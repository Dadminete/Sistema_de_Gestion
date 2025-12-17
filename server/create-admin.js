require('dotenv').config();
const prisma = require('./prismaClient');

async function createAdminUser() {
  try {
    console.log('🔍 Checking existing users...');
    
    // Check existing users
    const users = await prisma.usuario.findMany({
      select: {
        username: true,
        nombre: true,
        apellido: true,
        activo: true
      }
    });

    console.log(`📊 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.nombre} ${user.apellido}) - ${user.activo ? 'Active' : 'Inactive'}`);
    });

    // Check if admin user exists
    const adminExists = await prisma.usuario.findUnique({
      where: { username: 'admin' }
    });

    if (adminExists) {
      console.log('\n✅ Admin user already exists');
      
      // Unblock the admin user
      await prisma.usuario.update({
        where: { username: 'admin' },
        data: {
          intentosFallidos: 0,
          bloqueadoHasta: null
        }
      });
      console.log('🔓 Admin account unblocked');
      
    } else {
      console.log('\n🔨 Creating admin user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      // Create admin user
      const adminUser = await prisma.usuario.create({
        data: {
          id: crypto.randomUUID(),
          username: 'admin',
          passwordHash: hashedPassword,
          nombre: 'Administrador',
          apellido: 'Sistema',
          activo: true,
          intentosFallidos: 0
        }
      });

      console.log('✅ Admin user created successfully');
      console.log(`Username: admin`);
      console.log(`Password: admin123`);
      console.log(`User ID: ${adminUser.id}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
