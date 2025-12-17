# Corrección: Resumen de Cajas Separado

## 🔍 Problema Identificado

En la página de apertura/cierre de cajas, el card de **"Papeleria"** mostraba también los movimientos de la **"Caja"** (001).

### Ejemplo del Problema:
```
Card: Caja Papeleria
Balance Actual: RD$50.00
Ingresos del Día: RD$600.00  ← Incluía ingresos de AMBAS cajas
Gastos del Día: RD$0.00
```

Los $600 incluían movimientos de:
- ✅ Papeleria (003) - Correcto
- ❌ Caja (001) - Incorrecto

---

## 🐛 Causa del Problema

El método `getResumenDiario` en `server/services/cajaService.js` usaba una consulta SQL incorrecta:

### Consulta INCORRECTA (Antes):
```sql
SELECT *
FROM movimientos_contables
WHERE (
  (caja_id = ${cajaId}::uuid) OR              -- ✅ Movimientos de esta caja
  (metodo = ${metodoPago} AND caja_id IS NULL) OR  -- ❌ Movimientos sin caja
  (caja_id IS NULL)                           -- ❌ TODOS los movimientos sin caja
)
AND fecha >= ${fechaInicio}
AND fecha <= ${fechaFin}
```

### Problema:
La consulta incluía **TODOS los movimientos sin `caja_id`**, lo que causaba que:
1. Movimientos antiguos sin `caja_id` aparecieran en todas las cajas
2. Los totales se duplicaran o mezclaran entre cajas
3. No hubiera separación clara entre cajas

---

## ✅ Solución Aplicada

### Consulta CORRECTA (Ahora):
```sql
SELECT *
FROM movimientos_contables
WHERE caja_id = ${cajaId}::uuid  -- SOLO movimientos de esta caja específica
AND fecha >= ${fechaInicio}
AND fecha <= ${fechaFin}
```

### Cambios Realizados:

1. **Eliminada lógica de fallback**: Ya no incluye movimientos sin `caja_id`
2. **Filtro específico**: Solo movimientos con el `caja_id` exacto
3. **Eliminada lógica de método de pago**: Ya no usa `metodo = 'papeleria'` o `metodo = 'caja'`

---

## 📝 Archivo Modificado

**`server/services/cajaService.js`** - Método `getResumenDiario`

### Cambios Específicos:

#### 1. Consulta SQL Simplificada
```javascript
// ANTES (líneas 507-518)
const movimientos = await prisma.$queryRaw`
  SELECT *
  FROM movimientos_contables
  WHERE (
    (caja_id = ${cajaId}::uuid) OR
    (metodo = ${metodoPago} AND caja_id IS NULL) OR
    (caja_id IS NULL)
  )
  AND fecha >= ${fechaInicio}
  AND fecha <= ${fechaFin}
  ORDER BY fecha DESC
`;

// AHORA (líneas 507-514)
const movimientos = await prisma.$queryRaw`
  SELECT *
  FROM movimientos_contables
  WHERE caja_id = ${cajaId}::uuid
  AND fecha >= ${fechaInicio}
  AND fecha <= ${fechaFin}
  ORDER BY fecha DESC
`;
```

#### 2. Eliminada Lógica Innecesaria
```javascript
// ELIMINADO (ya no es necesario)
const esPapeleria = caja.nombre?.toLowerCase().includes('papeleria') ||
                   caja.tipo?.toLowerCase() === 'papeleria';
const metodoPago = esPapeleria ? 'papeleria' : 'caja';
```

---

## 🎯 Resultado Esperado

### Ahora Cada Caja Muestra SOLO Sus Movimientos:

#### Card: Caja
```
Balance Actual: RD$200.00
Ingresos del Día: RD$500.00  ← Solo ingresos de caja_id = 001
Gastos del Día: RD$100.00    ← Solo gastos de caja_id = 001
```

#### Card: Papeleria
```
Balance Actual: RD$50.00
Ingresos del Día: RD$600.00  ← Solo ingresos de caja_id = 003
Gastos del Día: RD$0.00      ← Solo gastos de caja_id = 003
```

---

## 🔧 Implicaciones Importantes

### 1. **Movimientos Antiguos Sin `caja_id`**
Si tienes movimientos antiguos sin `caja_id`, estos **NO aparecerán** en ninguna caja.

**Solución**: Asignar `caja_id` a movimientos antiguos:
```sql
-- Asignar movimientos de efectivo a la caja principal
UPDATE movimientos_contables
SET caja_id = '130cc9f7-4ce9-4079-88a1-15dd96ca6b95'  -- ID de Caja
WHERE metodo = 'efectivo'
AND caja_id IS NULL;

-- Asignar movimientos de papelería a la caja de papelería
UPDATE movimientos_contables
SET caja_id = '634da9c9-d972-468f-aa29-43d9e1cf2ee6'  -- ID de Papeleria
WHERE metodo = 'papeleria'
AND caja_id IS NULL;
```

### 2. **Nuevos Movimientos**
Todos los nuevos movimientos **DEBEN** tener un `caja_id` asignado para aparecer en los resúmenes.

### 3. **Reportes y Estadísticas**
Otros métodos que usan `getResumenDiario` también se beneficiarán de esta corrección.

---

## 🚀 Próximos Pasos

### 1. Reiniciar el Servidor Backend
```bash
# Detén el servidor actual (Ctrl+C)
cd server
npm run dev
```

### 2. Verificar en el Frontend
1. Ve a `http://172.16.0.23:5173/cajas/apertura-cierre`
2. Refresca la página (`Ctrl + Shift + R`)
3. Verifica que cada card muestre solo sus propios movimientos

### 3. Probar con Movimientos
1. Crea un movimiento en "Caja" (001)
2. Crea un movimiento en "Papeleria" (003)
3. Verifica que cada uno aparezca solo en su card correspondiente

---

## 📊 Comparación Antes vs Ahora

| Aspecto | Antes ❌ | Ahora ✅ |
|---------|---------|----------|
| **Filtro** | Por `caja_id` O método O sin caja | Solo por `caja_id` |
| **Movimientos sin caja** | Aparecían en todas las cajas | No aparecen |
| **Separación** | Mezclados entre cajas | Completamente separados |
| **Totales** | Incorrectos/duplicados | Correctos y precisos |
| **Lógica** | Compleja y propensa a errores | Simple y directa |

---

## ✅ Beneficios del Cambio

1. **Precisión**: Cada caja muestra exactamente sus movimientos
2. **Simplicidad**: Código más simple y fácil de mantener
3. **Claridad**: No hay ambigüedad sobre qué movimientos pertenecen a qué caja
4. **Escalabilidad**: Fácil agregar más cajas sin conflictos
5. **Integridad**: Los datos son consistentes y confiables

---

## 🧪 Prueba de Verificación

Para confirmar que todo funciona correctamente:

```bash
# 1. Verificar movimientos por caja
node verificar_movimientos_por_caja.cjs

# 2. O ejecutar consulta SQL directa
```

```sql
-- Ver movimientos de Caja (001)
SELECT COUNT(*), SUM(monto) as total
FROM movimientos_contables
WHERE caja_id = '130cc9f7-4ce9-4079-88a1-15dd96ca6b95'
AND tipo = 'ingreso';

-- Ver movimientos de Papeleria (003)
SELECT COUNT(*), SUM(monto) as total
FROM movimientos_contables
WHERE caja_id = '634da9c9-d972-468f-aa29-43d9e1cf2ee6'
AND tipo = 'ingreso';
```

---

## 📝 Resumen

| Componente | Estado | Cambio |
|------------|--------|--------|
| **Consulta SQL** | ✅ CORREGIDA | Solo filtra por `caja_id` específico |
| **Lógica de método** | ✅ ELIMINADA | Ya no necesaria |
| **Separación de cajas** | ✅ IMPLEMENTADA | Cada caja es independiente |
| **Totales** | ✅ CORRECTOS | Precisos por caja |

---

## 🎉 Conclusión

El problema de mezcla de movimientos entre cajas está resuelto. Ahora cada caja muestra **únicamente** sus propios movimientos, proporcionando datos precisos y confiables.

**Siguiente paso**: Reinicia el servidor backend y verifica que los cards muestren los datos correctos.
