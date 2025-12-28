const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFondesa() {
    console.log('--- CHECKING FONDESA AND FILTERS ---');

    const bankRestriction = {
        OR: [
            { nombre: { contains: 'popular', mode: 'insensitive' } },
            { nombre: { contains: 'reserva', mode: 'insensitive' } },
            { nombre: { contains: 'qik', mode: 'insensitive' } },
            { nombre: { contains: 'bhd', mode: 'insensitive' } },
        ]
    };

    const accounts = await prisma.cuentaBancaria.findMany({
        where: { activo: true },
        include: { bank: true }
    });

    accounts.forEach(a => {
        const bankName = a.bank ? a.bank.nombre : 'NO BANK';
        const isFondesa = bankName.toLowerCase().includes('fondesa');
        const matchesFilter = a.bank && (
            bankName.toLowerCase().includes('popular') ||
            bankName.toLowerCase().includes('reserva') ||
            bankName.toLowerCase().includes('qik') ||
            bankName.toLowerCase().includes('bhd')
        );

        // Log ALL to be safe
        console.log(`- ${bankName} (${a.numeroCuenta}) | Fondesa: ${isFondesa} | Matches Filter: ${matchesFilter}`);
    });

    process.exit(0);
}

checkFondesa().catch(e => {
    console.error(e);
    process.exit(1);
});
