import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupPapeleriaCaja() {
  try {
    console.log('🔍 Checking existing cajas...');

    // Check existing cajas
    const existingCajas = await prisma.caja.findMany();
    console.log(`Found ${existingCajas.length} existing cajas:`);
    existingCajas.forEach(caja => {
      console.log(`  - ${caja.nombre} (tipo: ${caja.tipo}, saldo: ${caja.saldoActual})`);
    });

    // Check if papeleria caja already exists
    const existingPapeleriaCaja = await prisma.caja.findFirst({
      where: { tipo: 'papeleria', activa: true }
    });

    if (existingPapeleriaCaja) {
      console.log(`\n✅ Papeleria caja already exists: ${existingPapeleriaCaja.nombre}`);
      console.log(`   Current balance: ${existingPapeleriaCaja.saldoActual}`);
      return;
    }

    console.log('\n📝 Creating papeleria caja...');

    // Create papeleria caja
    const papeleriaCaja = await prisma.caja.create({
      data: {
        nombre: 'Caja Papelería',
        descripcion: 'Caja principal para operaciones de papelería',
        tipo: 'papeleria',
        saldoInicial: 0,
        saldoActual: 0,
        activa: true
      }
    });

    console.log(`✅ Papeleria caja created successfully!`);
    console.log(`   ID: ${papeleriaCaja.id}`);
    console.log(`   Name: ${papeleriaCaja.nombre}`);
    console.log(`   Balance: ${papeleriaCaja.saldoActual}`);

    // Also create a general caja if it doesn't exist
    const existingGeneralCaja = await prisma.caja.findFirst({
      where: { tipo: 'general', activa: true }
    });
    
    if (!existingGeneralCaja) {
      console.log('\n📝 Creating general caja...');
      const generalCaja = await prisma.caja.create({
        data: {
          nombre: 'Caja General',
          descripcion: 'Caja principal para operaciones generales',
          tipo: 'general',
          saldoInicial: 0,
          saldoActual: 0,
          activa: true
        }
      });
      console.log(`✅ General caja created successfully!`);
      console.log(`   ID: ${generalCaja.id}`);
      console.log(`   Name: ${generalCaja.nombre}`);
      console.log(`   Balance: ${generalCaja.saldoActual}`);
    } else {
      console.log(`\n✅ General caja already exists: ${existingGeneralCaja.nombre}`);
    }
    
  } catch (error) {
    console.error('❌ Error setting up cajas:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupPapeleriaCaja();