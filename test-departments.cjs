const prisma = require('./server/prismaClient');

async function test() {
    try {
        console.log('Testing departamentos...');
        const departments = await prisma.departamento.findMany();
        console.log('Departments found:', departments.length);
        console.log('Sample:', departments[0]);

        console.log('\nTesting cargos...');
        const cargos = await prisma.cargo.findMany();
        console.log('Cargos found:', cargos.length);
        console.log('Sample:', cargos[0]);
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

test();
