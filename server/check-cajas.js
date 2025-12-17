const prisma = require('./prismaClient');

async function checkCajas() {
    try {
        const cajas = await prisma.caja.findMany();
        console.log('===== CAJAS EN LA BASE DE DATOS =====');
        console.log(JSON.stringify(cajas, null, 2));

        console.log('\n===== RESUMEN =====');
        cajas.forEach(caja => {
            console.log(`${caja.nombre}: activa=${caja.activa}, tipo=${caja.tipo}`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCajas();
