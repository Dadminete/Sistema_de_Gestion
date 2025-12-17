import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test a simple query
    const userCount = await prisma.usuario.count();
    console.log(`✅ Current user count: ${userCount}`);

    const empresaCount = await prisma.empresa.count();
    console.log(`✅ Current empresa count: ${empresaCount}`);

  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
