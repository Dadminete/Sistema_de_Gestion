const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function limpiarClientes() {
  const deleted = await prisma.cliente.deleteMany({});
  console.log(`✅ ${deleted.count} clientes eliminados`);
  await prisma.$disconnect();
}

limpiarClientes();
