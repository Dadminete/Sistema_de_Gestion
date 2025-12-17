# Solución al Error de Apertura de Cajas

## 🔍 Problema Identificado

El error **"Caja no encontrada o inactiva"** ocurría porque:

1. **No había cajas en la base de datos** - La tabla `cajas` estaba vacía
2. **El backend consultaba datos incorrectos** - El método `getAll()` buscaba cuentas contables con códigos específicos ('001' y '003') en lugar de consultar la tabla `cajas`

## ✅ Soluciones Aplicadas

### 1. Creación de Cajas Iniciales

Se crearon 2 cajas operativas en la base de datos:

**Caja Principal:**
- ID: `130cc9f7-4ce9-4079-88a1-15dd96ca6b95`
- Nombre: Caja
- Tipo: efectivo
- Cuenta Contable: 1101-001 (Caja Principal)
- Responsable: Daniel Beras Sánchez

**Caja Papelería:**
- ID: `634da9c9-d972-468f-aa29-43d9e1cf2ee6`
- Nombre: Papeleria
- Tipo: efectivo
- Cuenta Contable: 1101-002 (Caja Papelería)
- Responsable: Daniel Beras Sánchez

### 2. Corrección del Backend

Se corrigió el archivo `server/services/cajaService.js`:

**Antes:**
```javascript
async getAll() {
  // Buscaba cuentas contables con códigos específicos
  const cuentasEspecificas = await prisma.cuentaContable.findMany({
    where: {
      OR: [
        { codigo: '001' },
        { codigo: '003' }
      ]
    }
  });
  // ...
}
```

**Después:**
```javascript
async getAll() {
  // Ahora consulta la tabla cajas correctamente
  const cajas = await prisma.caja.findMany({
    include: {
      cuentaContable: true,
      responsable: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
        },
      },
    },
    orderBy: {
      nombre: 'asc'
    }
  });
  // ...
}
```

## 🚀 Pasos para Aplicar la Solución

### 1. Reiniciar el Servidor Backend

El backend necesita reiniciarse para cargar los cambios:

```bash
# Detener el servidor actual
# Presiona Ctrl+C en la terminal donde corre el servidor

# O mata los procesos de Node:
taskkill /F /IM node.exe

# Luego reinicia el servidor
cd server
npm run dev
# o
node server.js
```

### 2. Refrescar el Frontend

En tu navegador:
1. Ve a `http://172.16.0.23:5173/cajas/apertura-cierre`
2. Presiona `Ctrl + Shift + R` para hacer un hard refresh
3. Abre las DevTools (F12) y limpia el cache si es necesario

### 3. Probar la Apertura de Caja

1. Deberías ver las 2 cajas: "Caja" y "Papeleria"
2. Ingresa un monto inicial para cada caja
3. Haz clic en "Realizar Apertura"
4. Debería funcionar correctamente ✅

## 📊 Verificación

Para verificar que todo está correcto, ejecuta:

```bash
node verificar_cajas.cjs
```

Deberías ver:
```
📦 Total de cajas en la base de datos: 2

--- Caja 1 ---
ID: 130cc9f7-4ce9-4079-88a1-15dd96ca6b95
Nombre: Caja
Tipo: efectivo
Activa: ✅ SÍ
...

--- Caja 2 ---
ID: 634da9c9-d972-468f-aa29-43d9e1cf2ee6
Nombre: Papeleria
Tipo: efectivo
Activa: ✅ SÍ
...
```

## 🔧 Scripts Útiles Creados

1. **`verificar_cajas.cjs`** - Verifica el estado de las cajas en la base de datos
2. **`crear_cajas_iniciales.cjs`** - Crea las cajas iniciales (ya ejecutado)
3. **`verificar_cambios.cjs`** - Verifica que el campo `cajaId` esté en `movimientos_contables`

## 📝 Cambios en el Código

### Archivos Modificados:
- ✅ `server/services/cajaService.js` - Corregido método `getAll()`

### Archivos Creados:
- ✅ `verificar_cajas.cjs`
- ✅ `crear_cajas_iniciales.cjs`
- ✅ `SOLUCION_APERTURA_CAJAS.md` (este archivo)

## 🎯 Resultado Esperado

Después de aplicar estos cambios:

1. ✅ El frontend mostrará las cajas correctas desde la base de datos
2. ✅ Podrás hacer aperturas de caja sin errores
3. ✅ Los movimientos contables se vincularán correctamente con las cajas
4. ✅ Podrás ver los movimientos por caja en los datatables

## ⚠️ Notas Importantes

1. **Arquitectura Correcta**: Ahora las cajas están correctamente vinculadas:
   ```
   cuentas_contables (1101-001, 1101-002)
           ↓ (cuentaContableId)
         cajas (Caja, Papeleria)
           ↓ (cajaId)
   movimientos_contables
   ```

2. **Responsable Asignado**: Las cajas tienen un responsable asignado (Daniel Beras Sánchez)

3. **Estado Activo**: Ambas cajas están marcadas como activas

4. **Saldos Iniciales**: Ambas cajas comienzan con saldo 0

## 🐛 Troubleshooting

### Si el error persiste:

1. **Verifica que el servidor se reinició:**
   ```bash
   # Verifica los procesos de Node
   Get-Process node
   ```

2. **Limpia el cache del navegador:**
   - Presiona F12
   - Ve a Network
   - Marca "Disable cache"
   - Recarga la página

3. **Verifica las cajas en la base de datos:**
   ```bash
   node verificar_cajas.cjs
   ```

4. **Revisa los logs del servidor:**
   - Busca errores en la consola del servidor
   - Verifica que no haya errores de Prisma

### Si necesitas recrear las cajas:

```bash
# Eliminar cajas existentes (opcional)
# Luego ejecutar:
node crear_cajas_iniciales.cjs
```

## 📞 Resumen

- ✅ Problema: Backend consultaba datos incorrectos
- ✅ Solución: Corregido método `getAll()` en `cajaService.js`
- ✅ Cajas creadas: 2 cajas operativas con cuentas contables vinculadas
- ⏳ Pendiente: Reiniciar servidor backend

**Siguiente paso:** Reinicia el servidor backend y prueba la apertura de cajas.
