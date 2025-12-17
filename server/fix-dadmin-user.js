require('dotenv').config();
const prisma = require('./prismaClient');

async function fixDadminUser() {
  try {
    console.log('🔍 Buscando usuario Dadmin...');
    
    const dadminUser = await prisma.usuario.findUnique({
      where: { username: 'Dadmin' }
    });

    if (!dadminUser) {
      console.log('❌ Usuario Dadmin no encontrado');
      return;
    }

    console.log('📋 Usuario actual:', {
      username: dadminUser.username,
      nombre: dadminUser.nombre,
      apellido: dadminUser.apellido,
      activo: dadminUser.activo
    });

    // Actualizar con nombre y apellido
    const updatedUser = await prisma.usuario.update({
      where: { username: 'Dadmin' },
      data: {
        nombre: 'Director',
        apellido: 'Administrador'
      }
    });

    console.log('✅ Usuario Dadmin actualizado exitosamente');
    console.log('📋 Datos nuevos:', {
      username: updatedUser.username,
      nombre: updatedUser.nombre,
      apellido: updatedUser.apellido,
      activo: updatedUser.activo
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixDadminUser();
