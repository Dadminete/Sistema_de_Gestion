const prisma = require('./server/prismaClient');

async function test() {
    try {
        console.log('Testing employee data...');
        const employee = await prisma.empleado.findFirst({
            where: { id: BigInt(2) },
            include: {
                cargo: true,
                departamento: true,
                usuario: true,
            }
        });
        
        console.log('\nEmployee data:');
        console.log('salarioBase:', employee.salarioBase, 'type:', typeof employee.salarioBase);
        console.log('montoAfp:', employee.montoAfp, 'type:', typeof employee.montoAfp);
        console.log('montoSfs:', employee.montoSfs, 'type:', typeof employee.montoSfs);
        
        // Try to convert to JSON
        console.log('\nTrying JSON.stringify...');
        try {
            const json = JSON.stringify(employee);
            console.log('SUCCESS - but BigInt might fail');
        } catch (err) {
            console.error('FAILED:', err.message);
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
