const prisma = require('../prismaClient');

async function inspectAccounts() {
    console.log("--- Inspecting Categories ---");
    const categories = await prisma.categoriaCuenta.findMany({
        orderBy: { codigo: 'asc' }
    });
    console.log(categories.map(c => `${c.id} | ${c.codigo} | ${c.nombre} | Tipo: ${c.tipo}`).join('\n'));

    console.log("\n--- Inspecting Accounts (Cuentas Contables) ---");
    const accounts = await prisma.cuentaContable.findMany({
        include: {
            categoria: true,
            cajas: true,
            cuentasBancarias: true
        },
        orderBy: { codigo: 'asc' }
    });

    accounts.forEach(a => {
        console.log(`ID: ${a.id} | Code: ${a.codigo} | Name: ${a.nombre}`);
        console.log(`  Balance: ${a.saldoActual} (Initial: ${a.saldoInicial})`);
        console.log(`  Category: ${a.categoria ? a.categoria.nombre : 'NONE'}`);
        if (a.cajas.length > 0) console.log(`  Linked Cajas: ${a.cajas.map(c => c.nombre).join(', ')}`);
        if (a.cuentasBancarias.length > 0) console.log(`  Linked Bank Accounts: ${a.cuentasBancarias.map(b => b.numeroCuenta).join(', ')}`);
        console.log('------------------------------------------------');
    });
}

inspectAccounts()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
