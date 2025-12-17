#!/usr/bin/env node

import dotenv from 'dotenv';

// Load env
dotenv.config();

console.log('📡 DATABASE_URL loaded:', process.env.DATABASE_URL ? '✅ Yes' : '❌ No');
console.log('📡 DATABASE_URL protocol:', process.env.DATABASE_URL?.split('://')[0] || 'unknown');

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  errorFormat: 'pretty'
});

async function refactorCodigoCliente() {
  try {
    console.log('\n🔄 Iniciando refactorización de códigos de cliente...\n');

    // Get all clients
    const clientes = await prisma.cliente.findMany({
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        codigoCliente: true,
        nombre: true,
        apellidos: true,
        createdAt: true
      }
    });

    console.log(`✅ Total de clientes a procesar: ${clientes.length}\n`);

    if (clientes.length === 0) {
      console.log('⚠️  No hay clientes para procesar');
      await prisma.$disconnect();
      return;
    }

    // Group by creation year
    const clientesByYear = {};
    clientes.forEach(cliente => {
      const year = cliente.createdAt.getFullYear();
      if (!clientesByYear[year]) {
        clientesByYear[year] = [];
      }
      clientesByYear[year].push(cliente);
    });

    console.log('📊 Distribución por año:');
    Object.entries(clientesByYear).forEach(([year, clients]) => {
      console.log(`   ${year}: ${clients.length} clientes`);
    });
    console.log('');

    // Generate new codes and update
    let totalUpdated = 0;
    let totalErrors = 0;
    const updateSummary = [];

    for (const [year, yearClientes] of Object.entries(clientesByYear)) {
      console.log(`\n📅 Procesando clientes de ${year}...`);
      
      for (let i = 0; i < yearClientes.length; i++) {
        const cliente = yearClientes[i];
        const newCodigoCliente = `CLI-${year}-${String(i + 1).padStart(4, '0')}`;
        
        try {
          await prisma.cliente.update({
            where: { id: cliente.id },
            data: { codigoCliente: newCodigoCliente }
          });

          console.log(`   ✓ ${cliente.codigoCliente} → ${newCodigoCliente} (${cliente.nombre} ${cliente.apellidos})`);
          updateSummary.push({
            oldCode: cliente.codigoCliente,
            newCode: newCodigoCliente,
            nombre: cliente.nombre,
            apellidos: cliente.apellidos
          });
          totalUpdated++;
        } catch (error) {
          console.log(`   ✗ Error actualizando ${cliente.codigoCliente}: ${error.message}`);
          totalErrors++;
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📋 RESUMEN DE REFACTORIZACIÓN');
    console.log('='.repeat(70));
    console.log(`✅ Clientes actualizados: ${totalUpdated}`);
    console.log(`❌ Errores: ${totalErrors}`);
    console.log(`📊 Total procesados: ${totalUpdated + totalErrors}/${clientes.length}`);
    console.log('='.repeat(70));

    // Show sample of updates
    console.log('\n📝 MUESTRA DE CAMBIOS (primeros 10):');
    console.log('');
    updateSummary.slice(0, 10).forEach((update, index) => {
      console.log(`${index + 1}. ${update.oldCode.padEnd(15)} → ${update.newCode.padEnd(15)} | ${update.nombre} ${update.apellidos}`);
    });

    if (updateSummary.length > 10) {
      console.log(`\n... y ${updateSummary.length - 10} clientes más`);
    }

    console.log('\n✨ ¡Refactorización completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la refactorización:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

refactorCodigoCliente();
