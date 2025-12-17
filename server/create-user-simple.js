const prisma = require('./prismaClient');

async function main() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Delete existing admin user if exists
    await prisma.usuario.deleteMany({
      where: { username: 'admin' }
    });
    
    // Create new admin user
    const user = await prisma.usuario.create({
      data: {
        username: 'admin',
        passwordHash: hashedPassword,
        nombre: 'Admin',
        apellido: 'User',
        activo: true,
        esEmpleado: true,
        intentosFallidos: 0
      }
    });
    
    console.log('User created:', user.username);
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
