# Configuración de Neon Database

## Información del Proyecto

### Base de Datos Neon
- **Connection String (Pooled)**: `postgresql://neondb_owner:npg_vLaSikx5Ioy7@ep-long-bread-a49wf2dl-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **Passwordless Auth**: `psql -h pg.neon.tech`
- **API REST Endpoint**: `https://ep-long-bread-a49wf2dl.apirest.us-east-1.aws.neon.tech/neondb/rest/v1`

### Stack Auth Integration
- **Project ID**: `de85685c-5581-447c-90a3-aacc4c7ded25`
- **JWKS URL**: `https://api.stack-auth.com/api/v1/projects/de85685c-5581-447c-90a3-aacc4c7ded25/.well-known/jwk`

## Variables de Entorno Configuradas

### Archivo `.env` (Raíz del proyecto)
```env
VITE_API_BASE_URL=http://172.16.0.23:54116/api
JWT_SECRET=super-secret-key-for-db-sistema-2.0-change-in-production-please
DATABASE_URL="postgresql://neondb_owner:npg_vLaSikx5Ioy7@ep-long-bread-a49wf2dl-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Stack Auth Configuration
NEXT_PUBLIC_STACK_PROJECT_ID=de85685c-5581-447c-90a3-aacc4c7ded25
STACK_JWKS_URL=https://api.stack-auth.com/api/v1/projects/de85685c-5581-447c-90a3-aacc4c7ded25/.well-known/jwk

# Neon API Configuration
NEON_API_ENDPOINT=https://ep-long-bread-a49wf2dl.apirest.us-east-1.aws.neon.tech/neondb/rest/v1
```

### Archivo `server/.env` 
```env
# Pooled Neon connection string
DATABASE_URL="postgresql://neondb_owner:npg_vLaSikx5Ioy7@ep-long-bread-a49wf2dl-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# JWT Secret for authentication
JWT_SECRET="super-secret-jwt-key-change-in-production-2025"
# Logging level (error, warn, info, debug)
LOG_LEVEL="info"

# Reduce verbose logging
NODE_ENV="development"

# Stack Auth Configuration
STACK_PROJECT_ID=de85685c-5581-447c-90a3-aacc4c7ded25
STACK_JWKS_URL=https://api.stack-auth.com/api/v1/projects/de85685c-5581-447c-90a3-aacc4c7ded25/.well-known/jwk

# Neon API Configuration
NEON_API_ENDPOINT=https://ep-long-bread-a49wf2dl.apirest.us-east-1.aws.neon.tech/neondb/rest/v1
```

## Estado Actual del Sistema

### ✅ Funcionalidades Implementadas y Funcionando
1. **Conexión a Base de Datos Neon**: ✅ Configurada y funcionando
2. **Creación de Facturas**: ✅ Método `crearFactura` implementado en `facturaService.js`
3. **Dashboard Mejorado**: ✅ 
   - Reemplazado chart de ventas por "Top Clientes Cumplidos" (clientes que pagan temprano)
   - Reemplazada card "My Wallet" por "Últimas Transacciones"
4. **Corrección Prisma**: ✅ Campo `apellidos` vs `apellido` corregido en `cajaService.js`
5. **Stack Auth**: ✅ Variables de entorno configuradas (pendiente implementación frontend)

### 🔧 Próximos Pasos Recomendados
1. **Implementar Stack Auth en Frontend**: Instalar `@stackframe/stack` y configurar autenticación
2. **Optimizar Queries de Dashboard**: Mejorar performance de consultas de clientes cumplidos
3. **Implementar Cache**: Agregar cache para datos del dashboard
4. **Testing**: Crear tests para las nuevas funcionalidades

## Comandos Útiles

### Desarrollo
```bash
# Iniciar el proyecto completo
npm run dev

# Solo frontend (Puerto 5173/5174)
npm run start:frontend

# Solo backend (Puerto 54116/54117)  
npm run start:backend
```

### Base de Datos
```bash
# Conectar directo a Neon
psql 'postgresql://neondb_owner:npg_vLaSikx5Ioy7@ep-long-bread-a49wf2dl-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

# Generar migraciones Prisma
npx prisma generate

# Aplicar migraciones
npx prisma db push
```

### URLs Importantes
- **Frontend**: http://localhost:5173/ o http://localhost:5174/
- **Backend API**: http://localhost:54116/api o http://localhost:54117/api
- **Health Check**: http://localhost:54116/health o http://localhost:54117/health

---
**Fecha de Configuración**: 5 de Diciembre, 2025
**Estado**: ✅ Funcionando Correctamente