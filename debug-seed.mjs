import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

console.log('🚀 Starting debug seed script...');
console.log('📦 Dependencies loaded successfully');

async function main() {
  console.log('🌱 Iniciando el proceso de seeding completo...');

  try {
    // Simple test first
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test creating a simple empresa record
    console.log('Creating empresa record...');
    const empresa = await prisma.empresa.create({
      data: {
        nombre: 'Sistema ISP 2.0 - DEBUG',
        razonSocial: 'Sistema ISP 2.0 S.R.L.',
        rnc: '123456789',
        telefono: '809-123-4567',
        email: 'info@sistemaisp.com',
        direccion: 'Av. Principal #123, Santo Domingo',
        ciudad: 'Santo Domingo',
        provincia: 'Distrito Nacional',
        codigoPostal: '10101',
        monedaPrincipal: 'DOP',
      },
    });
    console.log('✅ Empresa creada:', empresa.nombre);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
