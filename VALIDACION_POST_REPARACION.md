# 🧪 GUÍA DE VALIDACIÓN POST-REPARACIÓN

**Última Actualización:** 28 de Noviembre, 2025

---

## 🔍 CHECKLIST DE VALIDACIÓN

### 1️⃣ Validar Datos del Usuario Dadmin

#### Vía Terminal SQL:
```bash
cd server
node -e "
  require('dotenv').config();
  const prisma = require('./prismaClient');
  
  (async () => {
    const user = await prisma.usuario.findUnique({
      where: { username: 'Dadmin' }
    });
    console.log('Usuario Dadmin:', {
      username: user.username,
      nombre: user.nombre,
      apellido: user.apellido,
      activo: user.activo
    });
    await prisma.\$disconnect();
  })();
"
```

**Resultado Esperado:**
```
Usuario Dadmin: {
  username: 'Dadmin',
  nombre: 'Director',
  apellido: 'Administrador',
  activo: true
}
```

#### Vía API REST:
```bash
# 1. Obtener token de login
curl -X POST http://localhost:54116/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Dadmin","password":"Didadmin123"}'

# 2. Usar el token en la siguiente petición (reemplazar TOKEN)
curl http://localhost:54116/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

**Respuesta Esperada:**
```json
{
  "id": "...",
  "username": "Dadmin",
  "nombre": "Director",
  "apellido": "Administrador",
  "roles": ["Gerente"],
  "permissions": [...]
}
```

---

### 2️⃣ Validar SSE - Conexión y Estabilidad

#### A. Conectarse manualmente a SSE:
```bash
# Terminal 1: Obtener token
TOKEN=$(curl -s -X POST http://localhost:54116/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Dadmin","password":"Didadmin123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Terminal 2: Conectarse a SSE y monitorear
curl -N "http://localhost:54116/api/events?token=$TOKEN" \
  -H "Accept: text/event-stream" \
  --verbose
```

**Comportamiento Esperado:**
```
> GET /api/events?token=... HTTP/1.1
< HTTP/1.1 200 OK
< Content-Type: text/event-stream
< Cache-Control: no-cache
< Connection: keep-alive

event: connected
data: {"type":"connected","id":1764358391221.824,"connectedUsers":[...]}

: heartbeat    # Cada 30 segundos
```

#### B. Verificar en Navegador - Console Logs:
```javascript
// Los logs deberían mostrar:
✅ SSE: Connection opened successfully
[SSE] Token verified for user: Dadmin (ID: ..., Role: Gerente)
[SSE] Client ... connected for user Dadmin
[SSE] Sending initial connected users to client ...: [...]
```

#### C. Monitorear Reconexiones:
```bash
# Ver en logs del servidor:
# - Sin reconexiones inesperadas
# - Solo reconexiones si hay error real (timeout, conexión perdida, etc.)
# - Intervalo de reconexión: 5 segundos (si ocurre)
```

---

### 3️⃣ Validar CORS Headers

#### A. Verificar Headers de Respuesta:
```bash
curl -v http://localhost:54116/api/events \
  -H "Origin: http://localhost:5173" 2>&1 | grep -i "access-control"
```

**Esperado:**
```
< Access-Control-Allow-Origin: http://localhost:5173
< Access-Control-Allow-Credentials: true
< Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
< Access-Control-Allow-Headers: Content-Type, Authorization, Accept, Cache-Control
```

#### B. Verificar Endpoint SSE CORS:
```bash
curl -v http://localhost:54116/api/events \
  -H "Origin: http://172.16.0.23:5173" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS 2>&1 | grep -i "access-control"
```

---

### 4️⃣ Validar Estado General del Sistema

#### A. Health Check:
```bash
curl http://localhost:54116/health
```

**Respuesta Esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-28T..."
}
```

#### B. Estado de Conexiones SSE:
```bash
curl http://localhost:54116/api/debug/sse-status
```

**Respuesta Esperada:**
```json
{
  "totalClients": 1,
  "totalUsers": 1,
  "connectedUsers": [
    {
      "id": "...",
      "username": "Dadmin",
      "nombre": "Director",
      "apellido": "Administrador",
      "role": "Gerente",
      "connectedAt": "2025-11-28T...",
      "sessionCount": 1
    }
  ],
  "clients": [...]
}
```

---

## 📊 MÉTRICAS ESPERADAS POST-REPARACIÓN

| Métrica | Antes | Después | ✅/❌ |
|---------|-------|---------|------|
| Reconexiones por 10 min | 5-10 | 0-1 | ✅ |
| Tiempo respuesta SSE | >500ms | <100ms | ✅ |
| Errores SSE | Frecuentes | Ninguno | ✅ |
| Usuarios conectados visibles | undefined | "Director Administrador" | ✅ |
| Headers CORS | Incompletos | Completos | ✅ |

---

## 🐛 Troubleshooting

### Problema: Aún hay reconexiones frecuentes
**Solución:**
1. Verificar logs del servidor: `grep "[SSE]" server.log`
2. Revisar que JWT_SECRET esté presente en `.env`
3. Reiniciar servidor

### Problema: CORS Error en console
**Solución:**
1. Verificar origen en CORS whitelist
2. Agregar origen a `server/index.js` línea ~97
3. Reiniciar servidor

### Problema: SSE No se conecta
**Solución:**
1. Verificar token es válido: `curl /api/auth/me -H "Authorization: Bearer TOKEN"`
2. Verificar servidor escucha en puerto 54116
3. Verificar firewall no bloquea conexiones

### Problema: Nombre/Apellido aún undefined
**Solución:**
1. Ejecutar script: `node server/fix-dadmin-user.js`
2. Hacer logout y login nuevamente
3. Limpiar cache del navegador

---

## 📋 Test Completo (5 minutos)

```bash
#!/bin/bash

echo "🔍 Test 1: Conectar manualmente..."
curl -N "http://localhost:54116/api/events?token=test" &
sleep 5

echo "🔍 Test 2: Verificar Health..."
curl http://localhost:54116/health

echo "🔍 Test 3: Verificar SSE Status..."
curl http://localhost:54116/api/debug/sse-status

echo "🔍 Test 4: Verificar CORS..."
curl -i http://localhost:54116/api/events -H "Origin: http://localhost:5173"

echo "✅ Tests completados!"
```

---

## 🚀 Verificación Final

**Todos los items deben estar ✅:**

- [ ] Usuario Dadmin tiene nombre y apellido
- [ ] SSE se conecta sin errores
- [ ] Heartbeat se envía cada 30 segundos
- [ ] No hay reconexiones inesperadas
- [ ] CORS headers presentes en todas las respuestas
- [ ] Health check retorna 200
- [ ] SSE Status muestra usuarios conectados

**Si todo está ✅ → ¡Sistema listo para producción!**

---

