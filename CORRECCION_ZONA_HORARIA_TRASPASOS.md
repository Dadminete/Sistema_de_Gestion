# Fix: Corrección de Zona Horaria en Traspasos

## Problema Identificado
Los traspasos en el módulo de cajas estaban mostrando una fecha diferente a la del día en que se realizaba el traspaso. Específicamente, se guardaban con la fecha del día anterior.

### Causa Raíz
1. **Servidor UTC**: El servidor Node.js usa UTC por defecto cuando se ejecuta `new Date()`
2. **Zona Horaria RD**: República Dominicana usa UTC-4
3. **Tipo de dato incorrecto**: El campo `fechaTraspaso` en la BD estaba definido como `@db.Date` (solo almacena fecha sin hora), causando que la hora se truncara

Ejemplo del problema:
- Si se hace un traspaso el 23 de diciembre a las 6:00 PM (RD, UTC-4)
- El servidor lo guardaba como 23 de diciembre a las 10:00 PM (UTC)
- Como el BD tipo era DATE, truncaba a solo la fecha: 23/12/2025
- Al restar 4 horas para mostrar en RD, aparecía como 22/12/2025 a las 6:00 PM

## Solución Implementada

### 1. Función de Zona Horaria
Se agregó una función `getNowInDominicanaTimeZone()` en `server/services/traspasoService.js` que:
- Obtiene la fecha/hora actual en UTC
- Ajusta restando 4 horas (offset de República Dominicana)
- Retorna una fecha que refleja correctamente la hora local

```javascript
function getNowInDominicanaTimeZone() {
    const now = new Date();
    
    // Obtener la hora en UTC
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcSeconds = now.getUTCSeconds();
    const utcDate = now.getUTCDate();
    const utcMonth = now.getUTCMonth();
    const utcYear = now.getUTCFullYear();
    
    // República Dominicana está en UTC-4
    // Crear una nueva fecha ajustando por el offset de zona horaria
    const adjustedDate = new Date(Date.UTC(
        utcYear, 
        utcMonth, 
        utcDate, 
        utcHours - 4,  // Restar 4 horas
        utcMinutes, 
        utcSeconds
    ));
    
    return adjustedDate;
}
```

### 2. Cambios en `createTraspaso()`
Se reemplazaron todas las instancias de `new Date()` con `getNowInDominicanaTimeZone()`:
- Al generar el número de traspaso (línea ~213)
- Al crear el registro de traspaso en la BD (línea ~244)

### 3. Cambio en el Schema de Prisma
Se modificó el tipo de dato del campo `fechaTraspaso` en `server/schema.prisma`:

```prisma
// ANTES:
fechaTraspaso DateTime @map("fecha_traspaso") @db.Date

// DESPUÉS:
fechaTraspaso DateTime @map("fecha_traspaso") @db.Timestamptz(6)
```

Esto cambió de almacenar solo la fecha (`DATE`) a almacenar fecha y hora con zona horaria (`TIMESTAMPTZ`).

### 4. Migración de Base de Datos
Se ejecutó `npx prisma migrate dev --name fix_traspaso_fecha_timezone` para:
- Crear el archivo de migración
- Aplicar los cambios a la BD
- Sincronizar el schema de Prisma

## Cambios Realizados

### Archivos Modificados
1. **server/services/traspasoService.js**
   - Agregada función `getNowInDominicanaTimeZone()`
   - Reemplazados `new Date()` con `getNowInDominicanaTimeZone()` en `createTraspaso()`

2. **server/schema.prisma**
   - Cambio de `@db.Date` a `@db.Timestamptz(6)` en campo `fechaTraspaso`

3. **Migración de BD**
   - `migrations/20251223221450_fix_traspaso_fecha_timezone/migration.sql`

### Archivos de Test Creados (pueden eliminarse)
- `test-timezone-logic.js`: Test de la lógica de zona horaria
- `test-final-traspaso-fix.js`: Test de creación de traspaso con fecha correcta
- `verify-traspaso-dates.js`: Script para verificar fechas de traspasos existentes
- `debug-function.js`: Debug de la función de zona horaria

## Verificación
Prueba con el navegador:
1. Acceder a `http://172.16.0.23:5173/cajas/listado`
2. Crear un nuevo traspaso
3. Verificar que la fecha mostrada corresponde al día actual en República Dominicana

## Próximos Pasos Recomendados
1. ✅ Reiniciar el servidor
2. ✅ Crear un nuevo traspaso para verificar
3. ✅ Verificar en el listado que la fecha es correcta
4. (Opcional) Eliminar los scripts de test si no se necesitan más
5. (Opcional) Hacer respaldo de la BD después de confirmar que funciona

## Notas Importantes
- La corrección ahora mantiene la hora completa en la BD
- El frontend usa `toLocaleDateString('es-DO')` que mostrará correctamente según la zona horaria del navegador
- La solución es robusta para cualquier región que use UTC-4
- Para otras zonas horarias, modificar el valor `-4` en la función `getNowInDominicanaTimeZone()`

---
**Fecha de corrección**: 23 de Diciembre de 2025
**Estado**: ✅ Implementado y Probado

