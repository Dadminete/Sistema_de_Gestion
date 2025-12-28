const prisma = require('./prismaClient');

async function testNewTraspasoDate() {
    console.log('🧪 Prueba de fecha en traspasos con timezone correcta\n');
    
    try {
        // Obtener el último traspaso creado
        const ultimoTraspaso = await prisma.traspaso.findFirst({
            orderBy: { id: 'desc' },
            include: {
                cajaOrigen: { select: { nombre: true } },
                cajaDestino: { select: { nombre: true } },
            },
        });

        if (!ultimoTraspaso) {
            console.log('❌ No hay traspasos en la base de datos');
            return;
        }

        const dbDate = new Date(ultimoTraspaso.fechaTraspaso);
        const utcTime = dbDate.toISOString();
        
        // Convertir a zona horaria de República Dominicana
        const formatter = new Intl.DateTimeFormat('es-DO', {
            timeZone: 'America/Santo_Domingo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        const localTime = formatter.format(dbDate);

        console.log(`✅ Último traspaso creado:`);
        console.log(`   Número: ${ultimoTraspaso.numeroTraspaso}`);
        console.log(`   De: ${ultimoTraspaso.cajaOrigen?.nombre || 'N/A'} → A: ${ultimoTraspaso.cajaDestino?.nombre || 'N/A'}`);
        console.log(`   Monto: RD$${ultimoTraspaso.monto.toFixed(2)}`);
        console.log(`   📅 Hora UTC en BD: ${utcTime}`);
        console.log(`   📅 Hora Local (RD): ${localTime}`);
        
        // Comparar con la hora actual
        const now = new Date();
        const nowFormatter = new Intl.DateTimeFormat('es-DO', {
            timeZone: 'America/Santo_Domingo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        const nowLocal = nowFormatter.format(now);
        
        console.log(`\n⏰ Hora actual (RD): ${nowLocal}`);
        
        // Verificar si están en el mismo día
        const traspasoDate = new Date(ultimoTraspaso.fechaTraspaso);
        const traspasoDay = traspasoDate.toLocaleDateString('es-DO', { timeZone: 'America/Santo_Domingo' });
        const todayDay = now.toLocaleDateString('es-DO', { timeZone: 'America/Santo_Domingo' });
        
        console.log(`\n📊 Verificación de fecha:`);
        console.log(`   Fecha del traspaso (RD): ${traspasoDay}`);
        console.log(`   Fecha de hoy (RD): ${todayDay}`);
        console.log(`   ¿Mismo día?: ${traspasoDay === todayDay ? '✅ SÍ' : '❌ NO'}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testNewTraspasoDate();
