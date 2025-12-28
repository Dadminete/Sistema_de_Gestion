/**
 * Test directo de la función
 */

function getNowInDominicanaTimeZone() {
    const now = new Date();
    console.log('now (UTC):', now.toISOString());
    console.log('now components:', {
        utcYear: now.getUTCFullYear(),
        utcMonth: now.getUTCMonth(),
        utcDate: now.getUTCDate(),
        utcHours: now.getUTCHours(),
        utcMinutes: now.getUTCMinutes(),
        utcSeconds: now.getUTCSeconds(),
    });
    
    // Obtener la hora en UTC
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcSeconds = now.getUTCSeconds();
    const utcDate = now.getUTCDate();
    const utcMonth = now.getUTCMonth();
    const utcYear = now.getUTCFullYear();
    
    console.log('Before adjustment:', { utcHours, utcMinutes, utcSeconds, utcDate, utcMonth, utcYear });
    
    // República Dominicana está en UTC-4 (UTC offset -4 horas)
    // Crear una nueva fecha ajustando por el offset de zona horaria
    // Si estamos en UTC y queremos RD (UTC-4), restamos 4 horas
    const adjustedDate = new Date(Date.UTC(utcYear, utcMonth, utcDate, utcHours - 4, utcMinutes, utcSeconds));
    
    console.log('adjustedDate:', adjustedDate.toISOString());
    console.log('adjustedDate components:', {
        year: adjustedDate.getUTCFullYear(),
        month: adjustedDate.getUTCMonth(),
        date: adjustedDate.getUTCDate(),
        hours: adjustedDate.getUTCHours(),
    });
    
    return adjustedDate;
}

console.log('\n🧪 Testing function directly\n');
const result = getNowInDominicanaTimeZone();
console.log('\nFinal result:', result.toISOString());
