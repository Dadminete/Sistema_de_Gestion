const { CuentaContableService } = require('./services/cuentaContableService');
const prisma = require('./prismaClient');

async function checkServiceGetAll() {
    try {
        console.log('Running CuentaContableService.getAll()...');
        const cuentas = await CuentaContableService.getAll();

        console.log(`Total cuentas: ${cuentas.length}`);
        const banco = cuentas.find(c => c.codigo === '002' || c.nombre.includes('Bancos'));

        if (banco) {
            console.log('===== CUENTA BANCOS (002) =====');
            console.log(`ID: ${banco.id}`);
            console.log(`Nombre: ${banco.nombre}`);
            console.log(`SaldoCalculado (Service): RD$${banco.saldoActual}`);
        } else {
            console.log('❌ No se encontró la cuenta Bancos (002)');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkServiceGetAll();
