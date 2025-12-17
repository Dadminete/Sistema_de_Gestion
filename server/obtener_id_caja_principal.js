const prisma = require('./prismaClient');

async function obtenerIdCajaPrincipal() {
    try {
        console.log('🔍 BUSCANDO CAJA PRINCIPAL\n');

        const cajas = await prisma.caja.findMany({
            where: { activa: true }
        });

        console.log('📋 CAJAS ACTIVAS ENCONTRADAS:\n');
        
        cajas.forEach((caja, index) => {
            console.log(`${index + 1}. ${caja.nombre}`);
            console.log(`   ID: ${caja.id}`);
            console.log(`   Tipo: ${caja.tipo}`);
            console.log('');
        });

        const cajaPrincipal = cajas.find(c => c.nombre.toLowerCase().includes('principal'));
        
        if (cajaPrincipal) {
            console.log(`🎯 CAJA PRINCIPAL ENCONTRADA:`);
            console.log(`   Nombre: ${cajaPrincipal.nombre}`);
            console.log(`   ID: ${cajaPrincipal.id}`);
        } else {
            console.log('❌ No se encontró caja principal');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

obtenerIdCajaPrincipal();