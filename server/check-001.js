const prisma = require('./prismaClient');

async function checkCuentaContable() {
    try {
        const cuentaCajaPrincipal = await prisma.cuentaContable.findFirst({
            where: {
                codigo: '001'
            }
        });

        console.log('===== CUENTA CONTABLE CÓDIGO 001 =====');
        console.log(JSON.stringify(cuentaCajaPrincipal, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCuentaContable();
