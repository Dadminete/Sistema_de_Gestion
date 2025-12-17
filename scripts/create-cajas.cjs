const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCajas() {
  try {
    console.log('=== CREACIÓN DE CAJAS ===');
    
    // Verificar si ya existen cajas
    const existingCajas = await prisma.caja.findMany();
    console.log('Cajas existentes:', existingCajas.length);
    
    if (existingCajas.length > 0) {
      console.log('Ya existen cajas, no se crearán nuevas');
      return;
    }
    
    // Crear caja general
    const cajaGeneral = await prisma.caja.create({
      data: {
        nombre: 'Caja General',
        tipo: 'general',
        descripcion: 'Caja principal del sistema',
        saldoInicial: '0',
        saldoActual: '0',
        activa: true
      }
    });
    
    console.log('Caja general creada:', cajaGeneral.nombre);
    
    // Crear caja de papelería
    const cajaPapeleria = await prisma.caja.create({
      data: {
        nombre: 'Caja Papelería',
        tipo: 'papeleria',
        descripcion: 'Caja para operaciones de papelería',
        saldoInicial: '0',
        saldoActual: '0',
        activa: true
      }
    });
    
    console.log('Caja de papelería creada:', cajaPapeleria.nombre);
    
    console.log('Cajas creadas exitosamente');
    
  } catch (error) {
    console.error('Error al crear cajas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se corre directamente
if (require.main === module) {
  createCajas()
    .then(() => console.log('Proceso completado'))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = createCajas;