const cuentaBancariaService = require('./services/cuentaBancariaService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    console.log('--- Testing getAccountsByBankId ---');
    try {
        // Get a bank first
        const bank = await prisma.bank.findFirst({ where: { activo: true } });
        if (!bank) {
            console.log('No active banks found');
            return;
        }
        console.log(`Testing with Bank: ${bank.nombre} (${bank.id})`);
        const accounts = await cuentaBancariaService.getAccountsByBankId(bank.id);
        console.log('Accounts count:', accounts.length);
        if (accounts.length > 0) {
            console.log('First account sample:', {
                id: accounts[0].id,
                nombre: accounts[0].nombre,
                saldo: accounts[0].saldo
            });
        }
    } catch (error) {
        console.error('FAILED with error:', error);
    }
}

test().finally(() => prisma.$disconnect());
