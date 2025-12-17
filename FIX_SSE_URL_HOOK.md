# 🔧 SSE Hook Fix: Conexión Dynamic URL para Real-Time Updates

## Problema Identificado

Aunque `authService.ts` y `apiClient.ts` fueron actualizados para usar URLs dinámicas, el hook `useRealTimeUpdates.ts` seguía teniendo hardcoded `localhost:3001` en la configuración del fallback, lo que causaba:

```
net::ERR_CONNECTION_REFUSED on localhost:3001/api/events
```

A pesar de que el frontend se accedía desde `172.16.0.23:54116`.

## ✅ Solución Aplicada

### Cambio en `src/hooks/useRealTimeUpdates.ts` (líneas 92-108)

**ANTES:**
```typescript
const API_BASE_URL = (() => {
  const raw = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) || 'http://localhost:3001/api';
  const trimmed = raw.replace(/\/$/, '');
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
})();
```

**DESPUÉS:**
```typescript
const API_BASE_URL = (() => {
  // First, try to use the environment variable if it's set
  const envUrl = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined);
  if (envUrl && envUrl.trim()) {
    const trimmed = envUrl.replace(/\/$/, '');
    return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
  }

  // Fallback to dynamic detection based on current browser location
  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  const protocol = window.location.protocol.replace(':', '');
  
  // Construct the base URL dynamically
  const baseURL = `${protocol}://${hostname}${port}/api`;
  console.log('🔧 SSE: Using dynamic API_BASE_URL:', baseURL, '(hostname:', hostname, ', port:', port, ')');
  return baseURL;
})();
```

## 🔄 Cómo Funciona

1. **Primero** intenta usar `VITE_API_BASE_URL` si está configurada en `.env.local`
2. **Si no** hay variable de entorno o está vacía, usa detección dinámica:
   - Obtiene hostname del navegador (ej: `172.16.0.23`)
   - Obtiene puerto del navegador (ej: `54116`)
   - Construye URL: `http://172.16.0.23:54116/api`
   - Registra log en consola con información de debug

## 📍 Páginas Afectadas (que usan este hook)

El fix se aplica automáticamente a todas las páginas que usan `useRealTimeUpdates`:

1. ✅ `src/pages/ClientesListado.tsx` - Real-time updates de clientes y suscripciones
2. ✅ `src/pages/ClientesInactivos.tsx` - Real-time updates de clientes inactivos
3. ✅ `src/pages/ClientesEquiposServicios.tsx` - Real-time updates de equipos/servicios
4. ✅ `src/pages/Chat/Chat.tsx` - Mensajes en tiempo real

## 🧪 Verificación

### Paso 1: Limpiar caché completo
```
Chrome: Ctrl+Shift+Delete → Eliminar todo
Firefox: Ctrl+Shift+Delete → Eliminar todo  
Safari: Cmd+Y → Borrar todo
```

### Paso 2: Abrir consola (F12) y buscar estos logs

Después de cargar la página, deberías ver:

```
🔧 SSE: Using dynamic API_BASE_URL: http://172.16.0.23:54116/api (hostname: 172.16.0.23, port: :54116)
✅ SSE: Connection opened successfully
```

### Paso 3: Verificar conexión SSE exitosa

En **DevTools → Network**:
1. Busca un request a `/api/events`
2. El tipo debe ser `eventsource` 
3. El status debe ser `200` (no `101 Switching Protocols`)
4. Debe estar activo (flecha verde/azul)

### Paso 4: Validar con cambios en tiempo real

1. Abre dos pestañas del dashboard desde `172.16.0.23:54116`
2. En una pestaña, crea un nuevo cliente
3. La otra pestaña debe actualizar automáticamente (sin recarga manual)
4. En consola debe aparecer:
```
SSE: Received entity-change event
```

## 🔍 Logs Disponibles en Consola

El hook emite varios logs útiles para debugging:

- `🔧 SSE: Using dynamic API_BASE_URL` - Muestra la URL calculada
- `✅ SSE: Connection opened successfully` - Conexión SSE establecida
- `SSE: Received entity-change event` - Evento de cambio de entidad
- `📬 SSE: Received new-message event` - Nuevo mensaje en chat
- `❌ SSE connection error` - Error de conexión (intenta reconectar)
- `🔄 SSE: Attempting to reconnect` - Reconexión en progreso

## 📋 Testing Checklist

- [ ] Limpiar caché del navegador
- [ ] Acceder desde `172.16.0.23:54116`
- [ ] Verificar logs "Connection opened successfully" en consola
- [ ] Ver request `/api/events` como `eventsource` con status `200` en Network tab
- [ ] Crear cliente en una pestaña y ver actualización en otra
- [ ] Verificar que mensajes en chat llegan en tiempo real
- [ ] Comprobar que cambios de estado de clientes se ven instantáneamente

## 🚀 Solución Completa de URL Dinámica

Ahora todos los servicios usan URLs dinámicas:

| Servicio | Archivo | Método |
|----------|---------|--------|
| ✅ Autenticación | `authService.ts` | `getAPIBaseURL()` |
| ✅ HTTP Client | `apiClient.ts` | Dynamic config |
| ✅ SSE Hook | `useRealTimeUpdates.ts` | Window.location detection |
| ✅ Vite Proxy | `vite.config.ts` | `BACKEND_TARGET` variable |

## 💡 Arquitectura Final

```
Cliente en 172.16.0.23:54116
    ↓
useRealTimeUpdates.ts calcula:
    hostname = 172.16.0.23
    port = 54116
    → URL: http://172.16.0.23:54116/api/events
    ↓
EventSource crea conexión SSE
    ↓
Backend recibe en puerto 54116
    ↓
Envía eventos en tiempo real
```

## ⚠️ Si aún no funciona

1. **Verifica que backend está corriendo:**
   ```powershell
   netstat -ano | findstr 54116
   ```

2. **Prueba conectar al health check:**
   ```
   http://172.16.0.23:54116/health
   ```

3. **Abre DevTools y busca errores:**
   - F12 → Console → Busca `❌` o `Error`
   - F12 → Network → Busca `/api/events` y revisa headers

4. **Si hay error CORS:** Backend debe tener configurado:
   ```
   Access-Control-Allow-Origin: http://172.16.0.23:54116
   ```

## 📝 Resumen de Cambios

- **Archivo:** `src/hooks/useRealTimeUpdates.ts`
- **Líneas:** 92-108 (API_BASE_URL calculation)
- **Cambio:** Removido hardcoded `localhost:3001`, agregada detección dinámica basada en `window.location`
- **Impacto:** Todas las conexiones SSE ahora usan la URL correcta del navegador
- **Fallback:** Si URL dinámica falla, todavía intenta usar `VITE_API_BASE_URL`
