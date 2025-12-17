const prisma = require('./prismaClient');

async function testCorrectionMontoTraspaso() {
    try {
        console.log('🔧 PROBANDO CORRECCIÓN DE MONTO TRASPASO\n');

        const cajaFuerteId = '35165dfc-a499-430f-bcae-7722af0c92bb';
        
        // Simular el mapeo con parseFloat
        const traspasos = await prisma.traspaso.findMany({
            where: {
                OR: [
                    { cajaOrigenId: cajaFuerteId },
                    { cajaDestinoId: cajaFuerteId }
                ]
            },
            include: {
                autorizadoPor: { select: { nombre: true, apellido: true } },
                cajaOrigen: { select: { nombre: true } },
                cajaDestino: { select: { nombre: true } }
            },
            orderBy: { fechaTraspaso: 'desc' },
            take: 3 // Solo los últimos 3 para probar
        });

        console.log('🔍 PROBANDO CONVERSIÓN DE MONTO:\n');

        traspasos.forEach((t, index) => {
            const montoOriginal = t.monto;
            const montoParseFloat = parseFloat(t.monto);
            
            console.log(`${index + 1}. Traspaso #${t.numeroTraspaso}`);
            console.log(`   📊 Monto original: ${montoOriginal} (tipo: ${typeof montoOriginal})`);
            console.log(`   🔢 Monto parseFloat: ${montoParseFloat} (tipo: ${typeof montoParseFloat})`);
            console.log(`   ✅ Conversión exitosa: ${Number.isFinite(montoParseFloat) ? 'SÍ' : 'NO'}`);
            console.log('');
        });

        // Simular el mapeo completo con la corrección
        const traspasosMapeados = traspasos.map(t => {
            const esOrigen = t.cajaOrigenId === cajaFuerteId;
            const esDestino = t.cajaDestinoId === cajaFuerteId;
            
            return {
                id: t.id,
                tipo: 'traspaso',
                fecha: t.fechaTraspaso,
                monto: parseFloat(t.monto), // CORRECCIÓN APLICADA
                numeroTraspaso: t.numeroTraspaso,
                tipoTraspaso: esOrigen ? 'Salida a Caja' : 'Entrada de Caja',
                origen: t.cajaOrigen?.nombre,
                destino: t.cajaDestino?.nombre,
                esOrigen,
                esDestino,
                usuario: `${t.autorizadoPor.nombre} ${t.autorizadoPor.apellido}`
            };
        });

        console.log('🎯 OBJETOS FINALES MAPEADOS (CON CORRECCIÓN):\n');
        
        traspasosMapeados.forEach((mapped, index) => {
            console.log(`${index + 1}. Objeto Final:`);
            console.log(`   💰 monto: ${mapped.monto} (${typeof mapped.monto})`);
            console.log(`   ✅ Es número: ${Number.isFinite(mapped.monto) ? 'SÍ' : 'NO'}`);
            console.log(`   🔄 ${mapped.origen} → ${mapped.destino}`);
            console.log(`   📅 ${mapped.fecha.toISOString()}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testCorrectionMontoTraspaso();