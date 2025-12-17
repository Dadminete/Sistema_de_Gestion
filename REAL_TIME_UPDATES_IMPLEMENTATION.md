# 🔄 Real-Time Updates Implementation Summary

## Objetivo
Implementar actualizaciones en tiempo real del DataTable de clientes cuando la base de datos reciba nuevas entradas o cambios.

## Cambios Realizados

### 1. **Servidor - Sistema de Eventos en Tiempo Real (SSE)**

#### Archivo: `server/eventSystem.js` (NUEVO)
```javascript
// Módulo centralizado para gestionar eventos en tiempo real
class EventSystem extends EventEmitter {
  registerClient(clientId, res)      // Registra un cliente SSE
  unregisterClient(clientObj)        // Desconecta un cliente
  broadcast(eventType, data)         // Emite evento a todos los clientes
  emitEntityChange(entityType, action, entityId, data) // Wrapper para cambios de entidades
}
```

**Características:**
- Uso de `EventEmitter` de Node.js para manejar eventos
- Mantiene un `Set` de clientes conectados
- Soporte para desconexiones y limpieza de recursos
- Sistema de eventos genérico para cualquier tipo de entidad

#### Archivo: `server/index.js` (MODIFICADO)
**Cambios:**
1. **Línea ~30:** Agregado import del módulo `eventSystem`
```javascript
const eventSystem = require('./eventSystem');
```

2. **Línea ~2996:** Endpoint SSE mejorado (`/api/events`)
```javascript
app.get('/api/events', (req, res, next) => {
  // Soporta autenticación por token en query param o header
  let token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  // Verifica token JWT
  // Registra cliente en eventSystem
  // Envía heartbeat cada 30 segundos
});
```

3. **Línea ~3040:** Export global del eventSystem
```javascript
global.eventSystem = eventSystem;
```

**Características del Endpoint SSE:**
- Autenticación por JWT (query param o header)
- Headers SSE correctos (`Content-Type: text/event-stream`)
- Heartbeat cada 30 segundos (previene timeout de conexión)
- Desconexión automática al cerrar cliente

---

### 2. **Servidor - Emisión de Eventos en CRUD**

#### Archivo: `server/routes/clientRoutes.js` (MODIFICADO)

**POST /api/clientes** - Crear cliente
```javascript
// Después de crear el cliente:
if (global.eventSystem) {
  global.eventSystem.emitEntityChange('cliente', 'create', newClient.id, {
    nombre: newClient.nombre,
    apellidos: newClient.apellidos,
    codigoCliente: newClient.codigoCliente
  });
}
```

**PUT /api/clientes/:id** - Actualizar cliente
```javascript
// Después de actualizar:
if (global.eventSystem) {
  global.eventSystem.emitEntityChange('cliente', 'update', updatedClient.id, {...});
}
```

**DELETE /api/clientes/:id** - Eliminar cliente
```javascript
// Después de eliminar:
if (global.eventSystem) {
  global.eventSystem.emitEntityChange('cliente', 'delete', id);
}
```

#### Archivo: `server/index.js` (MODIFICADO) - Suscripciones

**POST /api/suscripciones** - Crear suscripción
```javascript
if (global.eventSystem) {
  global.eventSystem.emitEntityChange('suscripcion', 'create', suscripcion.id, {...});
}
```

**PUT /api/suscripciones/:id** - Actualizar suscripción
```javascript
if (global.eventSystem) {
  global.eventSystem.emitEntityChange('suscripcion', 'update', updatedSuscripcion.id, {...});
}
```

**DELETE /api/suscripciones/:id** - Eliminar suscripción
```javascript
if (global.eventSystem) {
  global.eventSystem.emitEntityChange('suscripcion', 'delete', id, {clienteId: subscription.clienteId});
}
```

**Estructura del evento emitido:**
```json
{
  "type": "entity-change",
  "entityType": "cliente|suscripcion",
  "action": "create|update|delete",
  "entityId": "uuid-del-entity",
  "nombre": "..."  // Datos adicionales según el tipo
}
```

---

### 3. **Frontend - Hook para Escuchar Eventos**

#### Archivo: `src/hooks/useRealTimeUpdates.ts` (NUEVO)

```typescript
export const useRealTimeUpdates = (
  onEntityChange: (event: EntityChangeEvent) => void,
  entityTypes?: string[]
) => {
  // Se conecta a /api/events vía SSE
  // Filtra eventos por tipos de entidad
  // Reconecta automáticamente si falla
  // Retorna: { isConnected, disconnect }
}
```

**Características:**
- Conexión SSE automática con autenticación
- Filtrado de eventos por tipo de entidad
- Reconexión automática con timeout de 3 segundos
- Limpieza automática al desmontar componente
- Evento 'entity-change' para cambios genéricos
- Logs en console para debugging

**Uso básico:**
```typescript
useRealTimeUpdates(
  (event) => {
    console.log('Cambio detectado:', event);
    // Actualizar estado
  },
  ['cliente', 'suscripcion']  // Filtrar por estos tipos
);
```

---

### 4. **Frontend - Integración en DataTable de Clientes**

#### Archivo: `src/pages/ClientesListado.tsx` (MODIFICADO)

**Cambios:**
1. **Import del hook:**
```typescript
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
```

2. **Nueva función `reloadClients()`:**
```typescript
const reloadClients = async () => {
  // Recarga clientes de la API
  // Recarga suscripciones
  // Actualiza estado local
};
```

3. **Uso del hook:**
```typescript
useRealTimeUpdates(
  (event) => {
    console.log('Real-time event received:', event);
    if (event.entityType === 'cliente' || event.entityType === 'suscripcion') {
      reloadClients();  // Recarga todo cuando hay cambios
    }
  },
  ['cliente', 'suscripcion']
);
```

**Flujo:**
1. Usuario abre `/clients/list`
2. Hook se conecta a `/api/events` vía SSE
3. Cuando se crea/actualiza/elimina un cliente o suscripción en la BD...
4. Servidor emite evento a todos los clientes conectados
5. Frontend recibe evento
6. DataTable se recarga automáticamente

---

## 📊 Flujo Completo de Actualización en Tiempo Real

```
Operación en BD
      ↓
Endpoint CRUD detecta cambio
      ↓
global.eventSystem.emitEntityChange() emitido
      ↓
Evento SSE enviado a todos los clientes conectados
      ↓
Frontend recibe evento SSE
      ↓
Hook ejecuta onEntityChange callback
      ↓
reloadClients() recarga datos
      ↓
Estado actualizado
      ↓
DataTable se refresca automáticamente
```

---

## 🧪 Testing

### Verificar SSE en Browser Console:
```javascript
// Conectar manualmente a SSE
const token = localStorage.getItem('authToken');
const es = new EventSource(`/api/events?token=${token}`);

es.addEventListener('entity-change', (e) => {
  console.log('Evento recibido:', JSON.parse(e.data));
});

es.onerror = (err) => console.error('SSE error:', err);
```

### Script de prueba:
```bash
node test-sse.mjs
```

---

## 🔐 Seguridad

- ✅ Autenticación JWT requerida en `/api/events`
- ✅ Soporta token por header o query parameter
- ✅ Token verificado antes de registrar cliente SSE
- ✅ Eventos solo recibidos por clientes autenticados
- ✅ Desconexión automática si token inválido

---

## 📈 Próximos Pasos

### Inmediatos:
1. ✅ Agregar emisión de eventos a clientes CRUD
2. ✅ Agregar emisión de eventos a suscripciones CRUD
3. ✅ Crear hook frontend useRealTimeUpdates
4. ✅ Integrar en ClientesListado

### A considerar:
1. Agregar emisión de eventos a otros endpoints (equipos, servicios, planes, etc.)
2. Integrar hook en otros DataTables del aplicación
3. Optimizar recargas (recargar solo lo necesario, no todo)
4. Agregar indicadores visuales de conexión SSE
5. Implementar retry automático con backoff exponencial
6. Agregar heartbeat del cliente (ping hacia servidor)
7. Persistencia de eventos (logs) para debugging

---

## 📝 Notas

- **Performance:** Cada evento dispara un reload completo. En producción, considerar recargar solo las filas modificadas.
- **Concurrencia:** Múltiples clientes pueden estar conectados; cada uno recibe los mismos eventos.
- **Heartbeat:** SSE envía un ping cada 30 segundos para mantener viva la conexión.
- **Token:** Se puede pasar por query param (`?token=...`) o header (`Authorization: Bearer ...`).
- **Reconexión:** Si la conexión falla, el cliente intenta reconectar automáticamente cada 3 segundos.

---

## ✅ Validación de Cambios

- ✅ `server/eventSystem.js` - Creado correctamente
- ✅ `server/index.js` - Endpoint SSE y export global
- ✅ `server/routes/clientRoutes.js` - Eventos en POST/PUT/DELETE
- ✅ `server/index.js` - Eventos en suscripciones
- ✅ `src/hooks/useRealTimeUpdates.ts` - Hook completo
- ✅ `src/pages/ClientesListado.tsx` - Integración del hook
- ✅ TypeScript compilation - Sin errores relacionados al nuevo código

