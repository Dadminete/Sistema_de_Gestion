import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupCajasWithLinks() {
  try {
    console.log('🔧 Setting up cajas with proper cuenta contable links...\n');
    
    // Define the caja-cuenta mappings
    const cajaMappings = [
      { tipo: 'general', cuentaCodigo: '001', nombre: 'Caja General' },
      { tipo: 'papeleria', cuentaCodigo: '003', nombre: 'Caja Papelería' }
    ];
    
    for (const mapping of cajaMappings) {
      console.log(`📁 Processing ${mapping.tipo} caja...`);
      
      // Check if caja exists
      let caja = await prisma.caja.findFirst({
        where: { tipo: mapping.tipo, activa: true }
      });
      
      if (!caja) {
        console.log(`  📝 Creating ${mapping.tipo} caja...`);
        caja = await prisma.caja.create({
          data: {
            nombre: mapping.nombre,
            descripcion: `Caja para ${mapping.tipo}`,
            tipo: mapping.tipo,
            saldoInicial: 0,
            saldoActual: 0,
            activa: true
          }
        });
        console.log(`  ✅ Created ${mapping.tipo} caja with ID: ${caja.id}`);
      } else {
        console.log(`  ✅ Found existing ${mapping.tipo} caja with ID: ${caja.id}`);
      }
      
      // Find the corresponding cuenta contable
      const cuenta = await prisma.cuentaContable.findFirst({
        where: { codigo: mapping.cuentaCodigo, activa: true }
      });
      
      if (!cuenta) {
        console.log(`  ⚠️  No cuenta contable with code ${mapping.cuentaCodigo} found!`);
        continue;
      }
      
      console.log(`  📄 Found cuenta contable: ${cuenta.codigo} - ${cuenta.nombre}`);
      
      // Check if they're already linked
      if (caja.cuentaContableId === cuenta.id) {
        console.log(`  ✅ ${mapping.tipo} caja is already linked to cuenta contable ${cuenta.codigo}`);
        continue;
      }
      
      // Link the caja to the cuenta contable
      console.log(`  🔗 Linking ${mapping.tipo} caja to cuenta contable ${cuenta.codigo}...`);
      const updatedCaja = await prisma.caja.update({
        where: { id: caja.id },
        data: { cuentaContableId: cuenta.id }
      });
      
      console.log(`  ✅ Successfully linked ${mapping.tipo} caja to cuenta contable ${cuenta.codigo}`);
      console.log(`     New cuentaContableId: ${updatedCaja.cuentaContableId}`);
    }
    
    // Verify all links
    console.log('\n🔍 Verifying all caja-cuenta links...');
    const allCajas = await prisma.caja.findMany({
      where: { activa: true },
      include: { cuentaContable: true }
    });
    
    allCajas.forEach(caja => {
      console.log(`  ${caja.nombre} (${caja.tipo}):`);
      console.log(`    Caja balance: $${caja.saldoActual}`);
      if (caja.cuentaContable) {
        console.log(`    Linked to: ${caja.cuentaContable.codigo} - ${caja.cuentaContable.nombre}`);
        console.log(`    Cuenta balance: $${caja.cuentaContable.saldoActual}`);
      } else {
        console.log(`    ⚠️  Not linked to any cuenta contable`);
      }
    });
    
    console.log('\n✅ Setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart your server to ensure all changes are loaded');
    console.log('   2. Test making an expense using the papeleria payment method');
    console.log('   3. Verify that the balance updates correctly');
    
  } catch (error) {
    console.error('❌ Error during setup:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupCajasWithLinks();