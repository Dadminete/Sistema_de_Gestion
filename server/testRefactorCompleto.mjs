#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('🔍 Probando conexión a la base de datos...\n');

    // Test 1: Get total clients
    const totalClientes = await prisma.cliente.count();
    console.log(`✅ Total de clientes: ${totalClientes}`);

    // Test 2: Get first client with new format
    const firstClient = await prisma.cliente.findFirst({
      select: {
        codigoCliente: true,
        nombre: true,
        apellidos: true,
        telefono: true,
        sexo: true
      }
    });

    if (firstClient) {
      console.log(`✅ Primer cliente: ${firstClient.codigoCliente} - ${firstClient.nombre} ${firstClient.apellidos}`);
    }

    // Test 3: Check format consistency
    const allCodes = await prisma.cliente.findMany({
      select: { codigoCliente: true }
    });

    const formatRegex = /^CLI-\d{4}-\d{4}$/;
    const validCount = allCodes.filter(c => formatRegex.test(c.codigoCliente)).length;
    console.log(`✅ Códigos con formato correcto: ${validCount}/${allCodes.length}`);

    // Test 4: Try to create a new client
    console.log('\n🧪 Intentando crear un cliente de prueba...');
    const randomCode = `CLI-2025-${String(Math.floor(Math.random() * 8000) + 1000).padStart(4, '0')}`;
    const testClient = await prisma.cliente.create({
      data: {
        codigoCliente: randomCode,
        nombre: 'Cliente Prueba',
        apellidos: 'Sistema',
        telefono: '123-456-7890',
        sexo: 'MASCULINO',
        tipoCliente: 'residencial',
        estado: 'activo'
      }
    });
    
    console.log(`✅ Cliente de prueba creado: ${testClient.codigoCliente}`);

    // Clean up test client
    await prisma.cliente.delete({ where: { codigoCliente: testClient.codigoCliente } });
    console.log(`✅ Cliente de prueba eliminado`);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!');
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
