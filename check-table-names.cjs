const PrismaRetry = require('./server/prismaRetry');
const prisma = new PrismaRetry();

async function checkTableNames() {
  try {
    console.log('🔍 Verificando nombres reales de tablas en PostgreSQL...\n');

    const tables = await prisma.$queryRaw`
      SELECT tablename, schemaname 
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
      LIMIT 20;
    `;

    console.log(`📋 Primeras 20 tablas encontradas:\n`);
    tables.forEach((t, i) => {
      console.log(`${i + 1}. ${t.tablename} (schema: ${t.schemaname})`);
    });

    // Buscar específicamente Cliente
    const clienteTable = tables.find(t => 
      t.tablename.toLowerCase().includes('cliente')
    );

    if (clienteTable) {
      console.log(`\n✅ Tabla de Cliente encontrada: "${clienteTable.tablename}"`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableNames();
