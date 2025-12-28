const prisma = require('./prismaClient');

async function verifyTraspasosDates() {
    console.log('🔍 Verificando fechas de traspasos...\n');
    
    try {
        // Obtener los últimos traspasos
        const traspasos = await prisma.traspaso.findMany({
            take: 10,
            orderBy: { fechaTraspaso: 'desc' },
            include: {
                cajaOrigen: { select: { nombre: true } },
                cajaDestino: { select: { nombre: true } },
                cuentaBancariaOrigen: { select: { numeroCuenta: true } },
                cuentaBancariaDestino: { select: { numeroCuenta: true } },
            },
        });

        console.log(`Total de traspasos encontrados: ${traspasos.length}\n`);

        traspasos.forEach((t, index) => {
            const origen = t.cajaOrigen?.nombre || t.cuentaBancariaOrigen?.numeroCuenta || 'N/A';
            const destino = t.cajaDestino?.nombre || t.cuentaBancariaDestino?.numeroCuenta || 'N/A';
            
            const dbDate = new Date(t.fechaTraspaso);
            const localDateStr = dbDate.toLocaleString('es-DO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZone: 'America/Santo_Domingo'
            });
            
            const utcDateStr = dbDate.toISOString();
            
            console.log(`${index + 1}. Traspaso #${t.numeroTraspaso}`);
            console.log(`   De: ${origen} → A: ${destino}`);
            console.log(`   Monto: RD$${t.monto.toFixed(2)}`);
            console.log(`   📅 Fecha en BD (UTC): ${utcDateStr}`);
            console.log(`   📅 Fecha Local (RD): ${localDateStr}`);
            console.log(`   ⏱️  Diferencia: ${new Date().getHours() - dbDate.getUTCHours()} horas\n`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verifyTraspasosDates();
