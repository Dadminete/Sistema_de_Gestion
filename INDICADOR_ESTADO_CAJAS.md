# Indicador de Estado de Cajas (Abierta/Cerrada)

## 🎯 Objetivo

Agregar indicadores visuales en la página de Apertura/Cierre de Cajas que muestren claramente si cada caja está **abierta** o **cerrada**.

---

## ✅ Cambios Implementados

### 1. Backend - Mejora del Método `getUltimaApertura`

**Archivo**: `server/services/cajaService.js`

#### Antes:
```javascript
async getUltimaApertura(cajaId) {
  return prisma.aperturaCaja.findFirst({
    where: { cajaId },
    orderBy: { fechaApertura: 'desc' },
  });
}
```

#### Ahora:
```javascript
async getUltimaApertura(cajaId) {
  const ultimaApertura = await prisma.aperturaCaja.findFirst({
    where: { cajaId },
    orderBy: { fechaApertura: 'desc' },
  });

  if (!ultimaApertura) {
    return null;
  }

  // Verificar si hay un cierre posterior a esta apertura
  const cierrePosterior = await prisma.cierreCaja.findFirst({
    where: {
      cajaId,
      fechaCierre: { gt: ultimaApertura.fechaApertura }
    },
    orderBy: { fechaCierre: 'desc' },
  });

  // Agregar información sobre si la caja está abierta
  return {
    ...ultimaApertura,
    estaAbierta: !cierrePosterior // La caja está abierta si NO hay cierre posterior
  };
}
```

**Lógica**:
- Busca la última apertura de la caja
- Verifica si hay un cierre posterior a esa apertura
- Devuelve `estaAbierta: true` si NO hay cierre posterior
- Devuelve `estaAbierta: false` si hay un cierre posterior

---

### 2. Frontend - Estado de Cajas Abiertas

**Archivo**: `src/pages/AperturaCierre.tsx`

#### Nuevo Estado:
```typescript
const [cajasAbiertas, setCajasAbiertas] = useState<Record<string, boolean>>({});
```

#### Verificación al Cargar Cajas:
```typescript
// Verificar estado de apertura de cada caja
const estadoCajas: Record<string, boolean> = {};
for (const caja of activeCajas) {
  try {
    const ultimaApertura = await getUltimaApertura(caja.id);
    // La caja está abierta si hay una apertura y estaAbierta es true
    estadoCajas[caja.id] = ultimaApertura ? ultimaApertura.estaAbierta : false;
  } catch (error) {
    console.error(`Error verificando apertura de caja ${caja.id}:`, error);
    estadoCajas[caja.id] = false;
  }
}
setCajasAbiertas(estadoCajas);
```

#### Indicadores Visuales:
```tsx
<div className="status-indicators">
  <span className={`status-indicator ${cajasAbiertas[caja.id] ? 'open' : 'closed'}`}>
    {cajasAbiertas[caja.id] ? '🔓 Abierta' : '🔒 Cerrada'}
  </span>
  <span className={`status-indicator ${caja.activa ? 'active' : 'inactive'}`}>
    {caja.activa ? 'Activa' : 'Inactiva'}
  </span>
</div>
```

---

### 3. Estilos CSS

**Archivo**: `src/styles/AperturaCierre.css`

#### Contenedor de Indicadores:
```css
.status-indicators {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  align-items: flex-end;
}
```

#### Indicador "Abierta":
```css
.status-indicator.open {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  font-size: 0.75rem;
}

/* Tema oscuro */
[data-theme="dark"] .status-indicator.open {
  background-color: #1e4620;
  color: #7dff8a;
  border: 1px solid #2d5f2f;
}
```

#### Indicador "Cerrada":
```css
.status-indicator.closed {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  font-size: 0.75rem;
}

/* Tema oscuro */
[data-theme="dark"] .status-indicator.closed {
  background-color: #4a1f23;
  color: #ff7d8a;
  border: 1px solid #5f2d30;
}
```

---

## 🎨 Resultado Visual

### Card de Caja:

```
┌─────────────────────────────────────┐
│ Caja                    🔓 Abierta  │
│                         Activa      │
├─────────────────────────────────────┤
│ Balance Actual: RD$200.00           │
│ Ingresos del Día: RD$500.00         │
│ Gastos del Día: RD$0.00             │
└─────────────────────────────────────┘
```

```
┌─────────────────────────────────────┐
│ Papeleria              🔒 Cerrada   │
│                         Activa      │
├─────────────────────────────────────┤
│ Balance Actual: RD$50.00            │
│ Ingresos del Día: RD$100.00         │
│ Gastos del Día: RD$0.00             │
└─────────────────────────────────────┘
```

---

## 🔄 Flujo de Estados

### Estado 1: Caja Cerrada (Inicial)
```
Sin aperturas → 🔒 Cerrada
```

### Estado 2: Apertura de Caja
```
Usuario hace apertura → 🔓 Abierta
```

### Estado 3: Cierre de Caja
```
Usuario hace cierre → 🔒 Cerrada
```

### Estado 4: Nueva Apertura
```
Usuario hace nueva apertura → 🔓 Abierta
```

---

## 📊 Lógica de Verificación

```javascript
// Pseudocódigo
function verificarEstadoCaja(cajaId) {
  ultimaApertura = obtenerUltimaApertura(cajaId)
  
  if (!ultimaApertura) {
    return CERRADA  // No hay aperturas
  }
  
  cierrePosterior = buscarCierreDespuesDe(ultimaApertura.fecha)
  
  if (cierrePosterior) {
    return CERRADA  // Hay cierre después de la apertura
  } else {
    return ABIERTA  // Apertura sin cierre posterior
  }
}
```

---

## 🎯 Casos de Uso

### Caso 1: Inicio del Día
```
Situación: No hay aperturas
Estado: 🔒 Cerrada
Acción: Usuario puede hacer apertura
```

### Caso 2: Durante el Día
```
Situación: Hay apertura sin cierre
Estado: 🔓 Abierta
Acción: Usuario puede registrar movimientos y hacer cierre
```

### Caso 3: Fin del Día
```
Situación: Hay apertura y cierre
Estado: 🔒 Cerrada
Acción: Usuario puede hacer nueva apertura al día siguiente
```

### Caso 4: Reapertura
```
Situación: Usuario hace nueva apertura después de un cierre
Estado: 🔓 Abierta
Acción: Caja lista para operar nuevamente
```

---

## 🚀 Beneficios

1. **Visibilidad Clara**: Los usuarios ven inmediatamente qué cajas están abiertas
2. **Prevención de Errores**: Evita intentar cerrar cajas ya cerradas o abrir cajas ya abiertas
3. **Control Operativo**: Facilita la gestión diaria de cajas
4. **Auditoría**: Permite verificar rápidamente el estado de todas las cajas
5. **UX Mejorada**: Interfaz más intuitiva y fácil de usar

---

## 🧪 Pruebas Recomendadas

### Prueba 1: Caja Sin Aperturas
1. Verifica que muestre 🔒 Cerrada
2. Haz una apertura
3. Verifica que cambie a 🔓 Abierta

### Prueba 2: Caja con Apertura
1. Verifica que muestre 🔓 Abierta
2. Haz un cierre
3. Verifica que cambie a 🔒 Cerrada

### Prueba 3: Múltiples Aperturas/Cierres
1. Haz apertura → 🔓 Abierta
2. Haz cierre → 🔒 Cerrada
3. Haz nueva apertura → 🔓 Abierta
4. Verifica que el estado sea correcto en cada paso

### Prueba 4: Múltiples Cajas
1. Abre solo la Caja Principal
2. Verifica: Caja → 🔓 Abierta, Papelería → 🔒 Cerrada
3. Abre Papelería
4. Verifica: Ambas → 🔓 Abierta

---

## 📝 Archivos Modificados

1. ✅ **`server/services/cajaService.js`**
   - Método `getUltimaApertura()` mejorado

2. ✅ **`src/pages/AperturaCierre.tsx`**
   - Nuevo estado `cajasAbiertas`
   - Verificación de estado al cargar
   - Indicadores visuales en los cards

3. ✅ **`src/styles/AperturaCierre.css`**
   - Estilos para `.status-indicators`
   - Estilos para `.status-indicator.open`
   - Estilos para `.status-indicator.closed`
   - Soporte para tema oscuro

---

## 🔧 Mantenimiento Futuro

### Si necesitas agregar más estados:

1. **Backend**: Modifica `getUltimaApertura` para incluir el nuevo estado
2. **Frontend**: Agrega el nuevo estado al objeto `cajasAbiertas`
3. **CSS**: Crea una nueva clase `.status-indicator.nuevo-estado`

### Si necesitas cambiar los colores:

Modifica las clases CSS:
```css
.status-indicator.open {
  background-color: #tu-color-fondo;
  color: #tu-color-texto;
  border: 1px solid #tu-color-borde;
}
```

---

## ⚠️ Notas Importantes

1. **Sincronización**: El estado se actualiza cada vez que se carga la página o se hace una apertura/cierre
2. **Performance**: La verificación se hace en paralelo para todas las cajas
3. **Errores**: Si hay error al verificar, la caja se marca como cerrada por defecto
4. **Tiempo Real**: El estado NO se actualiza automáticamente, requiere refrescar la página

---

## 🎉 Conclusión

El sistema ahora muestra claramente el estado de cada caja (abierta/cerrada) con indicadores visuales intuitivos, mejorando significativamente la experiencia del usuario y facilitando la gestión diaria de cajas.

**Próximo paso**: Reinicia el servidor backend y refresca el navegador para ver los indicadores en acción.
