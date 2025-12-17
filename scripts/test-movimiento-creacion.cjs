const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const movimientoContableService = require('../server/services/movimientoContableService');

async function testMovimientoCreacion() {
  try {
    console.log('=== TEST DE CREACIÓN DE MOVIMIENTO ===');
    
    // Verificar categoría existente
    const categoria = await prisma.categoriaCuenta.findFirst({
      where: { nombre: 'Ventas Papelería' }
    });
    
    if (!categoria) {
      console.log('No se encontró categoría para ventas de papelería');
      return;
    }
    
    console.log('Categoría encontrada:', categoria.nombre, categoria.id);
    
    // Obtener un usuario válido
    const usuario = await prisma.usuario.findFirst({
      where: { activo: true }
    });
    
    if (!usuario) {
      console.log('No se encontró usuario activo');
      return;
    }
    
    console.log('Usuario encontrado:', usuario.nombre, usuario.id);
    
    // Crear un movimiento de prueba
    const movimientoData = {
      tipo: 'ingreso',
      monto: '100.00',
      categoriaId: categoria.id,
      metodo: 'papeleria',
      descripcion: 'Test de movimiento',
      usuarioId: usuario.id
    };
    
    console.log('Creando movimiento con datos:', movimientoData);
    
    // Crear el movimiento
    const movimiento = await movimientoContableService.createMovimiento(movimientoData);
    console.log('Movimiento creado:', movimiento);
    
    // Verificar saldos después de crear el movimiento
    console.log('\n=== SALDOS DESPUÉS DE CREAR MOVIMIENTO ===');
    
    // Obtener cajas
    const cajas = await prisma.caja.findMany({
      where: { activa: true }
    });
    
    cajas.forEach(caja => {
      console.log(`${caja.nombre} (${caja.tipo}): ${caja.saldoActual}`);
    });
    
    // Obtener cuentas contables
    const cuentas = await prisma.cuentaContable.findMany({
      where: { activa: true }
    });
    
    cuentas.forEach(cuenta => {
      console.log(`${cuenta.codigo} - ${cuenta.nombre}: ${cuenta.saldoActual}`);
    });
    
  } catch (error) {
    console.error('Error en el test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el test si se corre directamente
if (require.main === module) {
  testMovimientoCreacion()
    .then(() => console.log('Test completado'))
    .catch(error => {
      console.error('Error en el test:', error);
      process.exit(1);
    });
}

module.exports = testMovimientoCreacion;