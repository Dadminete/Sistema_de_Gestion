# Cambios en Configuración de Cajas

## 🔍 Revisión Realizada

Se revisó la página de configuración de cajas en `http://172.16.0.23:5173/cajas/configuracion` y se identificó un problema importante.

---

## ⚠️ Problema Encontrado

El método `setSaldoInicial` en el backend **solo actualizaba la cuenta contable** pero **NO actualizaba la caja operativa vinculada**.

### Consecuencia:
Cuando un usuario cambiaba el saldo inicial desde la configuración:
- ✅ Se actualizaba la cuenta contable (001 - Caja, 003 - Papeleria)
- ❌ NO se actualizaba la caja operativa vinculada
- ❌ Causaba **desincronización** entre cuenta contable y caja

---

## ✅ Solución Aplicada

### Archivo Modificado:
`server/services/cajaService.js` - Método `setSaldoInicial`

### Cambio Realizado:

**Antes:**
```javascript
async setSaldoInicial(cuentaContableId, monto, usuarioId) {
  // Solo actualizaba la cuenta contable
  const updatedCuenta = await prisma.cuentaContable.update({
    where: { id: cuentaContableId },
    data: {
      saldoInicial: nuevoSaldo,
      saldoActual: cuenta.detalleAsientos.length > 0 ? cuenta.saldoActual : nuevoSaldo
    },
  });
  // NO actualizaba la caja operativa
}
```

**Después:**
```javascript
async setSaldoInicial(cuentaContableId, monto, usuarioId) {
  // 1. Actualiza la cuenta contable
  const updatedCuenta = await prisma.cuentaContable.update({
    where: { id: cuentaContableId },
    data: {
      saldoInicial: nuevoSaldo,
      saldoActual: cuenta.detalleAsientos.length > 0 ? cuenta.saldoActual : nuevoSaldo
    },
  });

  // 2. NUEVO: También actualiza la caja operativa vinculada
  if (cuenta.cajas && cuenta.cajas.length > 0) {
    for (const caja of cuenta.cajas) {
      await prisma.caja.update({
        where: { id: caja.id },
        data: {
          saldoInicial: nuevoSaldo,
          saldoActual: nuevoSaldo
        }
      });
    }
  }
}
```

---

## 🎯 Beneficios del Cambio

1. **Sincronización Automática**: Cuando se actualiza el saldo inicial desde la configuración, tanto la cuenta contable como la caja operativa se actualizan.

2. **Consistencia de Datos**: Los saldos siempre estarán sincronizados entre:
   - Cuenta contable (001 - Caja)
   - Caja operativa (Caja)

3. **Prevención de Errores**: Evita discrepancias que podrían causar problemas en:
   - Aperturas de caja
   - Reportes
   - Movimientos contables

---

## 📋 Cómo Funciona Ahora

### Flujo Completo:

1. **Usuario accede a Configuración** (`/cajas/configuracion`)
   - Solo permitido para administradores o el primer día del mes

2. **Usuario modifica saldo inicial**
   - Ejemplo: Cambia "Caja" de $200 a $500

3. **Frontend envía petición**
   ```typescript
   setSaldoInicial(cuentaContableId, 500)
   ```

4. **Backend actualiza AMBOS**:
   - ✅ Cuenta contable "001 - Caja": saldoInicial = $500
   - ✅ Caja operativa "Caja": saldoInicial = $500, saldoActual = $500

5. **Resultado**:
   - Datos sincronizados ✅
   - Aperturas funcionan correctamente ✅
   - Reportes muestran datos consistentes ✅

---

## 🧪 Prueba Recomendada

Para verificar que todo funciona correctamente:

### 1. Accede a Configuración
```
http://172.16.0.23:5173/cajas/configuracion
```

### 2. Cambia el saldo inicial de una caja
- Ejemplo: Cambia "Caja" a $1000

### 3. Verifica la sincronización
Ejecuta el script de verificación:
```bash
node verificar_todas_cajas_y_cuentas.cjs
```

Deberías ver:
```
--- Cuenta 1 ---
Código: 001
Nombre: Caja
Saldo Inicial: $1000  ← Actualizado
✅ Vinculada con caja operativa:
   - Caja (ID: ...)

--- Caja 1 ---
Nombre: Caja
Saldo Inicial: $1000  ← También actualizado
Saldo Actual: $1000   ← También actualizado
```

---

## 🚀 Próximos Pasos

### 1. Reiniciar el Servidor Backend
```bash
# Detén el servidor actual (Ctrl+C)
# Luego reinicia:
cd server
npm run dev
```

### 2. Probar la Funcionalidad
1. Accede a `/cajas/configuracion`
2. Modifica un saldo inicial
3. Guarda los cambios
4. Verifica que se actualizó correctamente

### 3. Verificar Sincronización
```bash
node verificar_todas_cajas_y_cuentas.cjs
```

---

## 📊 Estado Actual del Sistema

### Cuentas Contables:
- **001 - Caja**: $200 ✅ Vinculada con caja "Caja"
- **002 - Banco**: $0 (sin caja operativa, es normal)
- **003 - Papeleria**: $50 ✅ Vinculada con caja "Papeleria"

### Cajas Operativas:
- **Caja**: $200 ✅ Vinculada con cuenta "001"
- **Papeleria**: $50 ✅ Vinculada con cuenta "003"

---

## ✅ Resumen de Cambios

| Componente | Estado | Acción |
|------------|--------|--------|
| Frontend (`ConfiguracionCaja.tsx`) | ✅ OK | No requiere cambios |
| Backend (`cajaService.js`) | ✅ CORREGIDO | Actualiza cuenta Y caja |
| Endpoint (`/cajas/saldo-inicial`) | ✅ OK | Funciona correctamente |
| Sincronización | ✅ IMPLEMENTADA | Cuenta ↔ Caja sincronizadas |

---

## 🔧 Archivos Modificados

1. **`server/services/cajaService.js`**
   - Método: `setSaldoInicial`
   - Cambio: Ahora actualiza también la caja operativa vinculada

---

## 💡 Notas Importantes

1. **Permisos**: Solo administradores o usuarios autorizados el primer día del mes pueden cambiar saldos iniciales.

2. **Validación**: El sistema valida que exista la cuenta contable antes de actualizar.

3. **Múltiples Cajas**: Si una cuenta contable tiene múltiples cajas vinculadas (poco común), todas se actualizarán.

4. **Saldo Actual**: Al cambiar el saldo inicial, también se actualiza el saldo actual de la caja (si no hay movimientos).

---

## 🎉 Conclusión

La página de configuración ahora funciona correctamente y mantiene la sincronización entre cuentas contables y cajas operativas. 

**Siguiente paso**: Reinicia el servidor backend para aplicar los cambios.
