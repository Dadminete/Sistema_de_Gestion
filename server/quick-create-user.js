require('dotenv').config();
const prisma = require('./prismaClient');

async function createTestUser() {
  try {
    console.log('🔍 Creating test user...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create test user
    const testUser = await prisma.usuario.create({
      data: {
        id: uuidv4(),
        username: 'admin',
        passwordHash: hashedPassword,
        nombre: 'Administrador',
        apellido: 'Sistema',
        activo: true,
        esEmpleado: true,
        intentosFallidos: 0,
        bloqueadoHasta: null
      }
    });

    console.log('✅ Test user created successfully');
    console.log(`Username: admin`);
    console.log(`Password: admin123`);
    console.log(`User ID: ${testUser.id}`);

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️ User already exists, updating password...');
      
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await prisma.usuario.update({
        where: { username: 'admin' },
        data: {
          passwordHash: hashedPassword,
          intentosFallidos: 0,
          bloqueadoHasta: null,
          activo: true
        }
      });
      
      console.log('✅ User updated successfully');
      console.log(`Username: admin`);
      console.log(`Password: admin123`);
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
