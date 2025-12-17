const prisma = require('./server/prismaClient');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    console.log('🔍 Verificando usuario Admin...');
    
    const adminUser = await prisma.usuario.findUnique({
      where: { username: 'Admin' }
    });
    
    if (!adminUser) {
      console.log('❌ Usuario Admin no encontrado');
      return;
    }
    
    console.log('✅ Usuario Admin encontrado:');
    console.log('  - Username:', adminUser.username);
    console.log('  - Activo:', adminUser.activo);
    
    // Probar diferentes contraseñas comunes
    const possiblePasswords = ['admin123', 'Admin123', 'admin', 'Admin', '123456'];
    
    for (const password of possiblePasswords) {
      try {
        const isMatch = await bcrypt.compare(password, adminUser.passwordHash);
        if (isMatch) {
          console.log(`✅ Contraseña correcta: "${password}"`);
          break;
        } else {
          console.log(`❌ Contraseña incorrecta: "${password}"`);
        }
      } catch (error) {
        console.log(`❌ Error verificando "${password}":`, error.message);
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
})();