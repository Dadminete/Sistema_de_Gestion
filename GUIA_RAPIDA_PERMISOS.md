# 🚀 Guía Rápida - Sistema de Permisos

## 📌 ¿Qué es?

Un sistema de permisos reorganizado que permite controlar el acceso a cada sección del menú lateral. Cada menú y submenú tiene un permiso específico que se puede asignar a roles y usuarios.

**Formato:** `menu.submenu`  
**Ejemplo:** `clientes.crear`, `averias.listado`, `usuarios.permisos`

---

## 🎯 Casos de Uso

### Caso 1: Solo dar acceso a "Ver Clientes" a un usuario

1. Ir a: **http://172.16.0.23:5173/permissions**
2. Seleccionar el **Rol** del usuario
3. Buscar y marcar solo: `clientes.listado`
4. Hacer click en "💾 Guardar Permisos"

**Resultado:** El usuario verá en el menú lateral solo la opción "Listado Clientes"

---

### Caso 2: Crear un nuevo Rol "Vendedor" con permisos limitados

#### Desde Backend:
```bash
curl -X POST http://172.16.0.23:54116/api/roles \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "nombreRol": "Vendedor",
    "descripcion": "Vendedor de servicios"
  }
```

#### Desde Frontend:
1. Ir a **Usuarios → Roles** (próximamente)
2. Crear rol "Vendedor"
3. Ir a **Permisos** y seleccionar el nuevo rol
4. Marcar permisos:
   - `clientes.listado`
   - `clientes.crear`
   - `clientes.suscripciones`
5. Guardar

---

### Caso 3: Verificar si usuario tiene permiso en código

```tsx
import { usePermission } from '../hooks/usePermission';

function MiComponente() {
  // Un solo permiso
  const puedeCrear = usePermission('clientes.crear');
  
  // Múltiples permisos (OR - al menos uno)
  const puedeGestionar = usePermission(['clientes.crear', 'clientes.listado']);
  
  // Todos los permisos (AND)
  const esAdmin = useAllPermissions(['sistema.permisos', 'usuarios.usuarios']);
  
  return puedeCrear ? <button>Crear Cliente</button> : null;
}
```

---

### Caso 4: Mostrar elemento solo si tiene permiso

```tsx
import { PermissionGate } from '../components/PermissionGate';

function Dashboard() {
  return (
    <>
      <h1>Dashboard</h1>
      
      {/* Botón solo visible si tiene permiso */}
      <PermissionGate permission="clientes.crear">
        <button>➕ Nuevo Cliente</button>
      </PermissionGate>
      
      {/* Con fallback (mensaje alternativo) */}
      <PermissionGate 
        permission="usuarios.permisos"
        fallback={<p>No tienes permisos para gestionar permisos</p>}
      >
        <button>⚙️ Gestionar Permisos</button>
      </PermissionGate>
    </>
  );
}
```

---

### Caso 5: Proteger una ruta en Backend

```javascript
// En server/routes/clientRoutes.js

router.get('/', requirePermission('clientes.listado'), async (req, res) => {
  // Solo usuarios con permiso 'clientes.listado' pueden ver esto
  const clientes = await prisma.cliente.findMany();
  res.json(clientes);
});

router.post('/', requirePermission('clientes.crear'), async (req, res) => {
  // Solo usuarios con permiso 'clientes.crear' pueden crear
  // ...
});
```

---

## 📊 Lista Completa de Permisos

### Clientes (6 permisos)
```
✓ clientes.dashboard       - Ver dashboard de clientes
✓ clientes.crear           - Crear nuevos clientes
✓ clientes.equipos_servicios - Gestionar equipos & servicios
✓ clientes.listado         - Ver listado de clientes activos
✓ clientes.inactivos       - Ver listado de clientes inactivos
✓ clientes.suscripciones   - Gestionar suscripciones
```

### Averías (4 permisos)
```
✓ averias.dashboard        - Dashboard de averías
✓ averias.crear            - Crear averías
✓ averias.listado          - Listar averías
✓ averias.cerrar           - Cerrar averías
```

### Facturas (7 permisos)
```
✓ facturas.dashboard       - Dashboard de facturas
✓ facturas.crear           - Crear facturas
✓ facturas.anuladas        - Ver facturas anuladas
✓ facturas.pendientes      - Ver facturas pendientes
✓ facturas.pagar           - Procesar pagos
✓ facturas.pagas           - Ver facturas pagadas
✓ facturas.pagos_mes       - Pagos por mes
```

### Usuarios (4 permisos)
```
✓ usuarios.usuarios        - Gestionar usuarios
✓ usuarios.roles           - Gestionar roles
✓ usuarios.permisos        - Gestionar permisos
✓ usuarios.bitacora        - Ver bitácora
```

### Sistema (2 permisos)
```
✓ sistema.permisos         - Gestionar permisos del sistema
✓ sistema.info             - Ver información del sistema
```

### Más módulos...
```
✓ cajas.*, banco.*, contabilidad.*, papeleria.*
✓ rrhh.*, servicios.*, base_datos.*
✓ chat.acceso, calendario.acceso
```

**Total: 55 permisos del sistema**

---

## 🔧 Operaciones Comunes

### Asignar permiso a rol existente

```bash
curl -X PUT http://172.16.0.23:54116/api/roles/{roleId}/permisos \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "permisoIds": [
      "permiso-id-1",
      "permiso-id-2",
      "permiso-id-3"
    ]
  }
```

### Obtener todos los permisos

```bash
curl http://172.16.0.23:54116/api/permisos \
  -H "Authorization: Bearer {token}"
```

### Obtener permisos por categoría

```bash
curl http://172.16.0.23:54116/api/permisos/categoria/clientes \
  -H "Authorization: Bearer {token}"
```

### Obtener rol con sus permisos

```bash
curl http://172.16.0.23:54116/api/roles/{roleId} \
  -H "Authorization: Bearer {token}"
```

---

## 🎨 Interfaz de Gestión

**URL:** `http://172.16.0.23:5173/permissions`

### Funciones:
1. **Seleccionar Rol** - Panel izquierdo con lista de roles
2. **Ver Permisos** - Agrupados por categoría
3. **Expandir Categoría** - Click en categoría para ver permisos
4. **Marcar/Desmarcar** - Checkbox para incluir/excluir permiso
5. **Guardar** - Botón "💾 Guardar Permisos"

---

## ⚠️ Notas Importantes

1. **Rol Administrador:** No puede ser eliminado y siempre tiene todos los permisos
2. **Validación en Backend:** Los permisos siempre se validan en servidor, nunca confiar en frontend
3. **Token Vigente:** Necesitas token JWT válido (próximos pasos incluirán permisos en token)
4. **Permiso `sistema.permisos`:** Requerido para crear/editar/eliminar permisos

---

## 🔐 Próximos Pasos

- [ ] Incluir permisos en token JWT
- [ ] Filtrar menú sidebar según permisos
- [ ] Proteger rutas en frontend
- [ ] Asignar permisos directamente a usuarios
- [ ] Crear interfaz para gestionar roles

---

## 📞 Ayuda

¿No encuentras un permiso?
- Ver `SISTEMA_PERMISOS_ESTRUCTURA.md` para lista completa
- Ejecutar: `curl http://172.16.0.23:54116/api/permisos`

¿Problemas técnicos?
- Verificar logs del backend: `server/index.js`
- Token válido: `localStorage.getItem('auth_token')`
- Rol tiene permiso: Ir a `/permissions` y verificar

---

**Versión:** 2.0  
**Actualizado:** 2025-11-28
