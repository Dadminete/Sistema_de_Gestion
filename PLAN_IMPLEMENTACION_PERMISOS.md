# 📋 Plan de Implementación - Sistema de Permisos Reorganizado

## ✅ Lo que se ha completado

### 1. **Seed de Permisos** ✅
- Creado seed que genera **55 permisos** del sistema
- Estructura: `menu.submenu` (ej: `clientes.crear`)
- Asigna automáticamente todos los permisos al rol "Administrador"
- Ejecutado exitosamente: `node server/seed-permisos-menu.cjs`

**Permisos creados por módulo:**
- Averias: 4 permisos
- Banco: 2 permisos
- Cajas Chicas: 4 permisos
- Clientes: 6 permisos
- Contabilidad: 7 permisos
- Facturas: 7 permisos
- Listados: 2 permisos
- Papelería: 6 permisos
- Base de Datos: 2 permisos
- Chat: 1 permiso
- Calendario: 1 permiso
- RRHH: 4 permisos
- Servicios: 3 permisos
- Sistema: 2 permisos
- Usuarios: 4 permisos

### 2. **Hooks de Permisos** ✅
Archivo: `src/hooks/usePermission.ts`

```typescript
// Verificar un permiso
const hasPermission = usePermission('clientes.crear');

// Verificar múltiples (OR)
const canAccess = usePermission(['clientes.crear', 'clientes.listado']);

// Verificar todos (AND)
const fullAccess = useAllPermissions(['clientes.crear', 'clientes.listado']);
```

### 3. **Componente PermissionGate** ✅
Archivo: `src/components/PermissionGate.tsx`

```tsx
<PermissionGate permission="clientes.crear">
  <button>Crear Cliente</button>
</PermissionGate>

// Con fallback
<PermissionGate permission="clientes.crear" fallback={<p>Sin acceso</p>}>
  <button>Crear Cliente</button>
</PermissionGate>
```

### 4. **Página de Gestión de Permisos** ✅
Archivo: `src/pages/PermisosGestion.tsx`
- Interfaz UI para asignar permisos a roles
- Visualización por categorías
- Búsqueda y filtrado
- Guardar cambios en el backend

### 5. **Documentación** ✅
Archivo: `SISTEMA_PERMISOS_ESTRUCTURA.md`
- Listado completo de permisos
- Uso en backend y frontend
- Ejemplos prácticos

---

## 📋 Pasos Siguientes (TODO)

### Paso 1: Conectar Endpoint de Roles y Permisos
**Archivos a crear/modificar en backend:**

```javascript
// server/routes/roleRoutes.js - Agregar endpoint para asignar permisos

router.put('/:roleId/permisos', requirePermission('usuarios.permisos'), async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permisoIds } = req.body;

    // Eliminar permisos actuales
    await prisma.rolePermiso.deleteMany({
      where: { rolId: roleId }
    });

    // Asignar nuevos permisos
    await prisma.rolePermiso.createMany({
      data: permisoIds.map((permisoId: string) => ({
        rolId: roleId,
        permisoId: permisoId,
        activo: true
      }))
    });

    res.json({ message: 'Permisos actualizados' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Paso 2: Crear Endpoint para Listar Permisos
```javascript
// server/routes/permisoRoutes.js

router.get('/', async (req, res) => {
  try {
    const permisos = await prisma.permiso.findMany({
      where: { activo: true },
      orderBy: { categoria: 'asc' }
    });
    res.json(permisos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Paso 3: Incluir Permisos en Token JWT
**Modificar `server/services/authService.js`:**

```javascript
// Al generar el JWT, incluir los permisos del usuario
const payload = {
  id: usuario.id,
  username: usuario.nombre_usuario,
  roles: usuario.roles.map(r => r.nombreRol),
  permisos: usuario.roles.flatMap(r => 
    r.rolePermisos
      .filter(rp => rp.activo)
      .map(rp => ({
        id: rp.permiso.id,
        nombrePermiso: rp.permiso.nombrePermiso
      }))
  )
};
```

### Paso 4: Modificar Sidebar para Filtrar por Permisos
**Archivo: `src/components/layout/Sidebar.tsx`**

```tsx
import { usePermission } from '../hooks/usePermission';

const renderMenuItem = (item: MenuItem) => {
  const permission = getPermissionForMenuItem(item.name);
  
  // Si no tiene permiso, no renderizar
  if (permission && !usePermission(permission)) {
    return null;
  }

  return (
    // renderizar item
  );
};
```

### Paso 5: Proteger Rutas Principales
**Archivo: `src/App.tsx` o `router.tsx`:**

```tsx
const protectedRoutes = [
  { path: '/clients', permission: 'clientes.dashboard' },
  { path: '/clients/new', permission: 'clientes.crear' },
  { path: '/clients/list', permission: 'clientes.listado' },
  { path: '/clients/inactivos', permission: 'clientes.inactivos' },
  { path: '/clients/suscripciones', permission: 'clientes.suscripciones' },
  // ... más rutas
];

// Validar permiso antes de renderizar
const ProtectedRoute = ({ path, permission, element }: any) => {
  const hasPermission = usePermission(permission);
  return hasPermission ? element : <Navigate to="/unauthorized" />;
};
```

---

## 🔐 Flujo de Validación de Permisos

```
┌─────────────────┐
│   Login User    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Backend genera JWT con permisos     │
│ (roles → rolePermisos → permisos)   │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Frontend almacena token + datos │
│ en AuthContext/localStorage     │
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Usuario navega por Sidebar           │
│ Solo ve items para los que tiene     │
│ permisos (filtrado con hooks)        │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Al acceder a ruta, validar permiso   │
│ ProtectedRoute o PermissionGate      │
│ Redirigir si no tiene acceso         │
└──────────────────────────────────────┘
```

---

## 📁 Archivos Creados/Modificados

✅ **Creados:**
- `server/seed-permisos-menu.cjs` - Actualizado con 55 permisos
- `src/hooks/usePermission.ts` - Hooks para validar permisos
- `src/components/PermissionGate.tsx` - Componente para renderizar condicionalmente
- `src/pages/PermisosGestion.tsx` - UI para gestionar permisos
- `src/pages/PermisosGestion.css` - Estilos de la UI
- `SISTEMA_PERMISOS_ESTRUCTURA.md` - Documentación completa

⏳ **Por crear/modificar:**
- `server/routes/permisoRoutes.js` - Endpoint para listar permisos
- `server/routes/roleRoutes.js` - Endpoint para asignar permisos
- `server/services/authService.js` - Incluir permisos en JWT
- `src/components/layout/Sidebar.tsx` - Filtrar items por permisos
- `src/App.tsx` - Rutas protegidas
- `src/pages/Usuarios.tsx` - Asignar permisos a usuarios directamente

---

## 🎯 Checklist de Implementación

- [ ] Ejecutar seed de permisos (✅ HECHO)
- [ ] Crear endpoints backend para permisos
- [ ] Incluir permisos en token JWT
- [ ] Implementar hooks usePermission
- [ ] Filtrar Sidebar por permisos
- [ ] Crear rutas protegidas
- [ ] Página de gestión de permisos (UI lista)
- [ ] Probar flujo completo
- [ ] Asignar permisos a roles no-admin
- [ ] Documentar para equipo

---

## 💡 Uso Inmediato

### En Backend:
```javascript
router.get('/clientes', requirePermission('clientes.listado'), handler);
```

### En Frontend:
```tsx
const hasAccess = usePermission('clientes.crear');

if (hasAccess) {
  // Mostrar botón
}

// O con componente
<PermissionGate permission="clientes.crear">
  <CreateClientButton />
</PermissionGate>
```

---

## 📊 Estadísticas

- **Total de permisos:** 55
- **Total de módulos:** 15
- **Promedio de permisos por módulo:** 3.7
- **Rol Administrador:** Tiene todos los permisos ✅

---

Hecho por: Sistema de Permisos v2.0
Fecha: 2025-11-28
