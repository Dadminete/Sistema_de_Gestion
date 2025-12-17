import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
  console.log('🔍 Verificando datos importados...\n');

  try {
    // Count records in each table
    const empresaCount = await prisma.empresa.count();
    const usuarioCount = await prisma.usuario.count();
    const empleadoCount = await prisma.empleado.count();
    const roleCount = await prisma.role.count();
    const permisoCount = await prisma.permiso.count();
    const departamentoCount = await prisma.departamento.count();
    const cargoCount = await prisma.cargo.count();
    const categoriaCount = await prisma.categoria.count();
    const servicioCount = await prisma.servicio.count();
    const planCount = await prisma.plan.count();
    const bankCount = await prisma.bank.count();
    const categoriaCuentaCount = await prisma.categoriaCuenta.count();
    const cuentaContableCount = await prisma.cuentaContable.count();
    const categoriaPapeleriaCount = await prisma.categoriaPapeleria.count();
    const configuracionCount = await prisma.configuracion.count();

    console.log('📊 Resumen de datos importados:');
    console.log(`   Empresas: ${empresaCount}`);
    console.log(`   Usuarios: ${usuarioCount}`);
    console.log(`   Empleados: ${empleadoCount}`);
    console.log(`   Roles: ${roleCount}`);
    console.log(`   Permisos: ${permisoCount}`);
    console.log(`   Departamentos: ${departamentoCount}`);
    console.log(`   Cargos: ${cargoCount}`);
    console.log(`   Categorías de servicios: ${categoriaCount}`);
    console.log(`   Servicios: ${servicioCount}`);
    console.log(`   Planes: ${planCount}`);
    console.log(`   Bancos: ${bankCount}`);
    console.log(`   Categorías de cuentas: ${categoriaCuentaCount}`);
    console.log(`   Cuentas contables: ${cuentaContableCount}`);
    console.log(`   Categorías de papelería: ${categoriaPapeleriaCount}`);
    console.log(`   Configuraciones: ${configuracionCount}`);

    console.log('\n👥 Usuarios creados:');
    const usuarios = await prisma.usuario.findMany({
      include: { empleado: true }
    });
    usuarios.forEach(usuario => {
      console.log(`   - ${usuario.username} (${usuario.nombre} ${usuario.apellido}) - Empleado: ${usuario.empleado ? 'Sí' : 'No'}`);
    });

    console.log('\n🎯 ¡Verificación completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
