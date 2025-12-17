const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    const metodos = await prisma.pagoCliente.groupBy({
        by: ['metodoPago'],
        _count: {
            metodoPago: true
        }
    });
    const fs = require('fs');
    fs.writeFileSync('metodos.json', JSON.stringify(metodos, null, 2));
    console.log('Resultados guardados en metodos.json');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
