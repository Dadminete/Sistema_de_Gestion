#!/usr/bin/env node

import dotenv from 'dotenv';

// Load env
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificarRefactorizacion() {
  try {
    console.log('\n📊 VERIFICACIÓN DE REFACTORIZACIÓN\n');
    console.log('='.repeat(70));

    // Get sample of refactored clients
    const clientes = await prisma.cliente.findMany({
      orderBy: { createdAt: 'asc' },
      take: 15,
      select: {
        codigoCliente: true,
        nombre: true,
        apellidos: true,
        createdAt: true
      }
    });

    console.log('\n📋 MUESTRA DE CLIENTES CON NUEVO FORMATO:\n');
    clientes.forEach((cliente, index) => {
      const fecha = cliente.createdAt.toLocaleDateString('es-DO');
      console.log(`${index + 1}. ${cliente.codigoCliente.padEnd(15)} | ${cliente.nombre.padEnd(20)} ${cliente.apellidos.padEnd(20)} | Importado: ${fecha}`);
    });

    // Count by year prefix
    const allClientes = await prisma.cliente.findMany({
      select: { codigoCliente: true }
    });

    const countByYear = {};
    allClientes.forEach(c => {
      const year = c.codigoCliente.split('-')[1];
      countByYear[year] = (countByYear[year] || 0) + 1;
    });

    console.log('\n\n📊 ESTADÍSTICAS:\n');
    console.log(`Total de clientes: ${allClientes.length}`);
    console.log('\nDistribución por año:');
    Object.entries(countByYear).sort().forEach(([year, count]) => {
      console.log(`  ${year}: ${count} clientes`);
    });

    // Check format consistency
    console.log('\n\n✅ VALIDACIÓN DE FORMATO:\n');
    const formatRegex = /^CLI-\d{4}-\d{4}$/;
    const validFormats = allClientes.filter(c => formatRegex.test(c.codigoCliente)).length;
    const invalidFormats = allClientes.length - validFormats;

    console.log(`Códigos válidos (CLI-YYYY-NNNN): ${validFormats}/${allClientes.length}`);
    if (invalidFormats > 0) {
      console.log(`⚠️  Códigos inválidos: ${invalidFormats}`);
      const invalid = allClientes.filter(c => !formatRegex.test(c.codigoCliente));
      invalid.forEach(c => console.log(`   - ${c.codigoCliente}`));
    } else {
      console.log('✨ ¡Todos los códigos están en el formato correcto!');
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verificarRefactorizacion();
