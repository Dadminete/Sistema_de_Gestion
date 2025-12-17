# 🚀 Guía de Inicio - Real-Time Updates del DataTable

## Requisitos Previos
- Node.js 18+
- PostgreSQL/Neon DB conectada
- Navegador moderno con soporte para EventSource (SSE)

---

## 📋 Pasos para Iniciar

### 1️⃣ Instalar Dependencias
```bash
npm install
```

### 2️⃣ Configurar Variables de Entorno
Asegurate de que `.env` o `.env.local` contenga:
```
DATABASE_URL=your_neon_db_url
JWT_SECRET=your_secret_key
VITE_API_BASE_URL=http://localhost:3001/api
```

### 3️⃣ Iniciar el Servidor Backend
```bash
node server/index.js
```
Deberías ver algo como:
```
🚀 Server running on port 3001
📡 API available at: http://localhost:3001/api
```

### 4️⃣ Iniciar el Cliente Frontend (en otra terminal)
```bash
npm run dev
```
Accede a: `http://localhost:5173/clients/list`

---

## ✅ Validar que Todo Funciona

### En el Browser Console (F12)
1. Abre DevTools (`F12` o `Cmd+Shift+I`)
2. Vé a la pestaña **Console**
3. Deberías ver logs como:
```
✓ SSE connection established
✓ Real-time event received: {entityType: 'cliente', action: 'create', ...}
```

### Prueba Manual

#### Test 1: Crear un nuevo cliente
1. En la página de clientes, haz clic en "Agregar Cliente"
2. Completa el formulario y guarda
3. **Resultado esperado:** El DataTable se actualiza automáticamente sin recargar la página

#### Test 2: Editar un cliente existente
1. Edita datos de un cliente existente
2. Guarda cambios
3. **Resultado esperado:** El DataTable muestra los cambios inmediatamente

#### Test 3: Cambiar suscripción
1. Ve a "Clientes > Equipos y Servicios"
2. Cambia el plan o servicio de un cliente
3. **Resultado esperado:** La columna "Precio Mensual" se actualiza automáticamente

---

## 🔍 Debugging

### Ver logs del SSE en el servidor
Busca en la consola del servidor:
```
[SSE] Client 123456789 connected
[SSE] Broadcast event: entity-change to 1 clients
[SSE] Client 123456789 disconnected
```

### Ver eventos en el browser
En la consola del browser:
```javascript
// Conectar manualmente para debug
const token = localStorage.getItem('authToken') || sessionStorage.getItem('auth_token');
const es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);

es.addEventListener('entity-change', (e) => {
  console.log('🎯 Raw Event:', e.data);
  console.log('📊 Parsed:', JSON.parse(e.data));
});

es.onerror = (err) => {
  console.error('❌ SSE Error:', err);
  console.error('Estado:', es.readyState); // 0=connecting, 1=open, 2=closed
};

// Para desconectar:
es.close();
```

### Verificar que el endpoint está activo
```bash
# Terminal
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/events" \
  -v
```

Deberías ver headers SSE:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

---

## 🔐 Solución de Problemas

### ❌ "Connection refused" (No puede conectar al servidor)
- [ ] Verificar que el servidor está corriendo en puerto 3001
- [ ] Verificar firewall (abrir puerto 3001 si es necesario)

### ❌ "401 Unauthorized"
- [ ] Token no está siendo enviado correctamente
- [ ] Verificar que el token existe en `localStorage` o `sessionStorage`
- [ ] En DevTools → Application → Local Storage → buscar 'authToken' o 'auth_token'

### ❌ DataTable no se actualiza
- [ ] Verificar que `useRealTimeUpdates` está siendo llamado en `ClientesListado.tsx`
- [ ] Abre DevTools → Network → WS (WebSockets) o "Fetch/XHR" para ver conexión SSE
- [ ] Busca logs de "Real-time event received" en console
- [ ] Verifica que el evento es del tipo 'cliente' o 'suscripcion'

### ❌ Conexión SSE se cierra después de unos segundos
- [ ] Verificar que el cliente recibe heartbeats (líneas vacías cada 30 segundos)
- [ ] Revisar `server/index.js` para que el heartbeat esté activo
- [ ] Algunos proxies pueden bloquear SSE; intenta acceder directamente al servidor

### ❌ Errores de CORS
- [ ] Agregar headers CORS en `server/index.js` si es necesario:
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
```

---

## 📊 Estructura de Eventos

### Evento de Creación
```json
{
  "type": "entity-change",
  "entityType": "cliente",
  "action": "create",
  "entityId": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Juan",
  "apellidos": "Perez",
  "codigoCliente": "CLI-001"
}
```

### Evento de Actualización
```json
{
  "type": "entity-change",
  "entityType": "cliente",
  "action": "update",
  "entityId": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Juan",
  "apellidos": "Perez",
  "codigoCliente": "CLI-001"
}
```

### Evento de Eliminación
```json
{
  "type": "entity-change",
  "entityType": "cliente",
  "action": "delete",
  "entityId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 📈 Monitorear Conexiones SSE

### Agregar endpoint de estadísticas (opcional)
```javascript
// En server/index.js
app.get('/api/events/stats', (req, res) => {
  res.json({
    connectedClients: eventSystem.clients.size,
    timestamp: new Date()
  });
});
```

Luego en browser:
```javascript
setInterval(async () => {
  const res = await fetch('/api/events/stats');
  const data = await res.json();
  console.log(`📊 Connected clients: ${data.connectedClients}`);
}, 5000);
```

---

## ✨ Características Avanzadas

### Reconexión automática con backoff exponencial
El hook ya implementa reconexión, pero puedes mejorarla:
```typescript
// Modificar useRealTimeUpdates para backoff exponencial
let retryCount = 0;
const maxRetries = 5;
const baseDelay = 1000; // 1 segundo

const delay = baseDelay * Math.pow(2, retryCount); // 1s, 2s, 4s, 8s, 16s
```

### Indicador visual de conexión SSE
```tsx
// En ClientesListado.tsx
const { isConnected } = useRealTimeUpdates(...);

return (
  <div className="connection-status">
    {isConnected ? (
      <span className="status-connected">🟢 En vivo</span>
    ) : (
      <span className="status-disconnected">⚪ Reconectando...</span>
    )}
  </div>
);
```

---

## 🎯 Próximos Pasos

1. Integrar real-time updates en otros DataTables:
   - Suscripciones
   - Equipos
   - Servicios
   - Planes
   - Facturas
   - Tickets

2. Optimizar recargas:
   - En lugar de recargar todo, recargar solo las filas modificadas
   - Usar diffing para detectar qué cambió

3. Agregar más eventos:
   - Movimientos contables
   - Cambios en cajas
   - Cambios en planes

4. Agregar persistencia:
   - Guardar eventos en BD para auditoría
   - Reproducción de eventos para debugging

---

## 📞 Contacto / Soporte

Si hay problemas, verifica:
1. Logs en `server/index.js` - busca `[SSE]` messages
2. DevTools Console - busca `Real-time event` messages
3. DevTools Network - verifica que SSE está activo (streaming)

**Test rápido en terminal:**
```bash
# Iniciar servidor
node server/index.js

# En otra terminal, conectar a SSE (requiere token válido)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/events"
```

