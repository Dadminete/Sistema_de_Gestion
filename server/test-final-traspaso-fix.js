/**
 * Script para verificar que los traspasos se crean con la fecha correcta
 * después de la corrección de zona horaria
 */
const prisma = require('./prismaClient');
const traspasoService = require('./services/traspasoService');

async function testTraspasoCreationWithCorrectDate() {
    console.log('🧪 Test: Crear traspaso y verificar fecha correcta\n');
    
    try {
        // 1. Obtener cajas disponibles
        const cajas = await prisma.caja.findMany({
            where: { activa: true },
            take: 2
        });

        if (cajas.length < 2) {
            console.log('⚠️  No hay suficientes cajas activas para hacer prueba (necesita 2)');
            console.log(`Cajas activas encontradas: ${cajas.length}`);
            return;
        }

        console.log('📍 Cajas encontradas:');
        console.log(`  1. ${cajas[0].nombre} (ID: ${cajas[0].id})`);
        console.log(`  2. ${cajas[1].nombre} (ID: ${cajas[1].id})\n`);

        // 2. Obtener un usuario autorizado
        const usuario = await prisma.usuario.findFirst({
            where: { activo: true }
        });

        if (!usuario) {
            console.log('⚠️  No se encontró usuario admin para la prueba');
            return;
        }

        console.log(`👤 Usuario: ${usuario.nombre || usuario.username}\n`);

        // 3. Crear un traspaso de prueba (pequeño monto para no afectar saldos)
        const traspasoData = {
            monto: 1.00, // Un peso para prueba
            conceptoTraspaso: 'Test de Corrección de Zona Horaria',
            tipoOrigen: 'caja',
            tipoDestino: 'caja',
            cajaOrigenId: cajas[0].id,
            cajaDestinoId: cajas[1].id,
            autorizadoPorId: usuario.id
        };

        console.log('🔄 Creando traspaso de prueba...');
        const traspaso = await traspasoService.createTraspaso(traspasoData);

        console.log('✅ Traspaso creado exitosamente!\n');

        // 4. Verificar la fecha
        const dbDate = new Date(traspaso.fechaTraspaso);
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

        console.log('📊 Información del traspaso creado:');
        console.log(`   Número: ${traspaso.numeroTraspaso}`);
        console.log(`   Monto: RD$${traspaso.monto.toFixed(2)}`);
        console.log(`   Concepto: ${traspaso.conceptoTraspaso}`);
        console.log(`   Estado: ${traspaso.estado}`);
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
        const traspasoDay = new Date(traspaso.fechaTraspaso).toLocaleDateString('es-DO', { timeZone: 'America/Santo_Domingo' });
        const todayDay = now.toLocaleDateString('es-DO', { timeZone: 'America/Santo_Domingo' });
        
        console.log(`\n✅ VERIFICACIÓN FINAL:`);
        console.log(`   Fecha del traspaso (RD): ${traspasoDay}`);
        console.log(`   Fecha de hoy (RD): ${todayDay}`);
        
        if (traspasoDay === todayDay) {
            console.log(`   ✅ ¡CORRECCIÓN EXITOSA! Las fechas coinciden correctamente`);
        } else {
            console.log(`   ❌ Las fechas no coinciden. Aún hay un problema.`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testTraspasoCreationWithCorrectDate();
