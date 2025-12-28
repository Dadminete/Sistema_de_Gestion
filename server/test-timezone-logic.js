/**
 * Script que replica la función de zona horaria
 */

// Nueva función con lógica correcta
function getNowInDominicanaTimeZone() {
    const now = new Date();
    
    // Obtener la hora en UTC
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcSeconds = now.getUTCSeconds();
    const utcDate = now.getUTCDate();
    const utcMonth = now.getUTCMonth();
    const utcYear = now.getUTCFullYear();
    
    // República Dominicana está en UTC-4 (UTC offset -4 horas)
    // Crear una nueva fecha ajustando por el offset de zona horaria
    // Si estamos en UTC y queremos RD (UTC-4), restamos 4 horas
    const adjustedDate = new Date(Date.UTC(utcYear, utcMonth, utcDate, utcHours - 4, utcMinutes, utcSeconds));
    
    return adjustedDate;
}

console.log('🧪 Test de zona horaria (versión mejorada)\n');
console.log('Hora del servidor (UTC):');
const utcNow = new Date();
console.log(`  ${utcNow.toISOString()}`);
console.log(`  Componentes UTC: ${utcNow.getUTCFullYear()}-${String(utcNow.getUTCMonth()+1).padStart(2,'0')}-${String(utcNow.getUTCDate()).padStart(2,'0')} ${String(utcNow.getUTCHours()).padStart(2,'0')}:${String(utcNow.getUTCMinutes()).padStart(2,'0')}:${String(utcNow.getUTCSeconds()).padStart(2,'0')}`);

console.log('\nHora en República Dominicana (función mejorada):');
const localNow = getNowInDominicanaTimeZone();
console.log(`  ${localNow.toISOString()}`);
console.log(`  Año: ${localNow.getUTCFullYear()}`);
console.log(`  Mes: ${String(localNow.getUTCMonth() + 1).padStart(2, '0')}`);
console.log(`  Día: ${String(localNow.getUTCDate()).padStart(2, '0')}`);
console.log(`  Hora: ${String(localNow.getUTCHours()).padStart(2, '0')}:${String(localNow.getUTCMinutes()).padStart(2, '0')}:${String(localNow.getUTCSeconds()).padStart(2, '0')}`);

// Verificar con formatter
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

console.log('\nVerificación con Intl (para comparar):');
console.log(`  Tiempo local formateado: ${formatter.format(utcNow)}`);

console.log('\nComparación:');
console.log(`  La fecha ajustada en UTC: ${localNow.toISOString()}`);
console.log(`  Cuando se envía a BD, PostgreSQL lo interpreta como: ${localNow.toISOString()}`);
console.log(`  Y cuando se muestra al cliente (RD), aparecerá como: ${formatter.format(localNow)}`);

