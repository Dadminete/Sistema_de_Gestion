require('dotenv').config({ path: './.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDbConnection() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to the database.');

    // Optional: Perform a simple query to ensure full connectivity
    const userCount = await prisma.usuario.count();
    console.log(`Number of users in the database: ${userCount}`);

    await prisma.$disconnect();
    console.log('Disconnected from the database.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    process.exit(1);
  }
}

testDbConnection();
