# 🌐 Acceso a la App desde otra PC en la Red

## Problema
Cuando intentas acceder a la app desde otra PC en la misma red, recibías el error:
```
net::ERR_CONNECTION_REFUSED
API_BASE_URL: http://localhost:54116/api
```

Esto ocurría porque `localhost` solo funciona en la misma máquina.

## ✅ Solución Implementada

### 1. **Auto-detección de IP**
El `apiClient.ts` ahora detecta automáticamente:
- La IP del host actual desde `window.location.hostname`
- El puerto del backend (54116)
- El protocolo (http o https)

### 2. **Configuración Backend**
El servidor Express ya escucha en `0.0.0.0` (todas las interfaces de red)

### 3. **Configuración Frontend**
- Vite escucha en `0.0.0.0:5173`
- El `apiClient` usa la IP del navegador automáticamente

## 📋 Cómo acceder desde otra PC

### Opción 1: Desde el navegador (Recomendado)
1. Obtén la IP de la máquina host. En Windows PowerShell:
```powershell
ipconfig
```
Busca la dirección IPv4 (ej: `192.168.1.100` o `172.16.0.23`)

2. En otra PC, abre el navegador y ve a:
```
http://192.168.1.100:5173
```
(Reemplaza con tu IP real)

### Opción 2: Acceso por hostname
Si está en la misma red local:
```
http://NOMBRE-PC:5173
```

### Opción 3: En Linux/Mac desde terminal
```bash
# Encontrar la IP
hostname -I

# O en Mac:
ifconfig | grep inet
```

## 🔧 Configuración Manual (si es necesario)

Si quieres una URL específica, edita `.env.local`:
```dotenv
VITE_API_BASE_URL=http://192.168.1.100:54116/api
```

## ✨ Características implementadas

- ✅ Auto-detección de IP automática
- ✅ Backend escucha en todas las interfaces (`0.0.0.0`)
- ✅ Frontend escucha en todas las interfaces (`0.0.0.0:5173`)
- ✅ Proxy de Vite funciona correctamente
- ✅ Mantiene fallback a `localhost` para desarrollo local

## 🧪 Prueba

Desde otra PC:
```
http://<IP-DE-TU-PC>:5173
```

Deberías ver en la consola:
```
✅ API_BASE_URL (auto-detected): http://192.168.1.100:54116/api
```

## ⚠️ Si no funciona aún

1. **Verifica firewall**: Asegúrate que los puertos 5173 y 54116 están permitidos
2. **Misma red**: Ambas PCs deben estar en la misma red
3. **Backend corriendo**: Verifica que ves en terminal:
   ```
   🚀 Server running on port 54116
   📊 Network health check: http://172.16.0.23:54116/health
   ```
4. **Prueba ping**: 
   ```powershell
   ping <IP-del-host>
   ```

## 💾 Archivos modificados

- `src/utils/apiClient.ts` - Auto-detección de IP
- `vite.config.ts` - Listen en `0.0.0.0`
- `.env.local` - Dejado vacío para auto-detección
