# Sistema de Permisos Reorganizado por Menú

## 📋 Estructura General

El sistema de permisos está ahora organizado según la estructura del menú lateral. Cada menú principal tiene submenús que corresponden a permisos específicos.

**Formato de permiso:** `menu.submenu`
- Ejemplo: `clientes.dashboard`, `clientes.crear`, `averias.listado`

---

## 🗂️ Permisos por Módulo

### 1. **AVERIAS** (4 permisos)
- `averias.dashboard` - Acceso al Dashboard de Averias
- `averias.crear` - Crear nuevas averías
- `averias.listado` - Ver listado de averías
- `averias.cerrar` - Cerrar averías registradas

### 2. **BANCO** (2 permisos)
- `banco.dashboard` - Dashboard de Banco
- `banco.gestion` - Gestión de Bancos

### 3. **CAJAS CHICAS** (4 permisos)
- `cajas.dashboard` - Dashboard de Cajas Chicas
- `cajas.apertura_cierre` - Abrir y cerrar cajas
- `cajas.listado` - Listado de cajas
- `cajas.configuracion` - Configuración (solo admin)

### 4. **CLIENTES** (6 permisos)
- `clientes.dashboard` - Dashboard de Clientes
- `clientes.crear` - Crear nuevos clientes
- `clientes.equipos_servicios` - Gestionar Equipos & Servicios
- `clientes.listado` - Listado de clientes activos
- `clientes.inactivos` - Listado de clientes inactivos/suspendidos
- `clientes.suscripciones` - Gestionar suscripciones

### 5. **CONTABILIDAD** (7 permisos)
- `contabilidad.dashboard` - Dashboard de Contabilidad
- `contabilidad.categorias_cuentas` - Categorías de cuentas
- `contabilidad.cuentas_contables` - Cuentas contables
- `contabilidad.cxp` - Cuentas por Pagar
- `contabilidad.ingresos_gastos` - Ingresos y gastos
- `contabilidad.pagos_mes` - Pagos por mes
- `contabilidad.traspasos` - Traspasos contables

### 6. **FACTURAS** (7 permisos)
- `facturas.dashboard` - Dashboard de Facturas
- `facturas.crear` - Crear facturas
- `facturas.anuladas` - Facturas anuladas
- `facturas.pendientes` - Facturas pendientes
- `facturas.pagar` - Pagar facturas
- `facturas.pagas` - Facturas pagadas
- `facturas.pagos_mes` - Pagos por mes

### 7. **LISTADOS** (2 permisos)
- `listados.ingresos` - Listado de ingresos
- `listados.gastos` - Listado de gastos

### 8. **PAPELERÍA** (6 permisos)
- `papeleria.dashboard` - Dashboard de Papelería
- `papeleria.papeleria` - Gestionar papelería
- `papeleria.clientes` - Clientes de papelería
- `papeleria.productos` - Productos
- `papeleria.categorias` - Categorías
- `papeleria.listado` - Listado de papelería

### 9. **BASE DE DATOS** (2 permisos)
- `base_datos.backup_crear` - Crear backup
- `base_datos.backup_listado` - Listado de backups

### 10. **CHAT** (1 permiso)
- `chat.acceso` - Acceso al chat

### 11. **CALENDARIO** (1 permiso)
- `calendario.acceso` - Acceso al calendario

### 12. **RRHH** (4 permisos)
- `rrhh.empleados` - Gestionar empleados
- `rrhh.nomina` - Gestionar nómina
- `rrhh.prestamos` - Gestionar préstamos
- `rrhh.comisiones` - Gestionar comisiones

### 13. **SERVICIOS** (3 permisos)
- `servicios.categorias` - Categorías de servicios
- `servicios.servicios` - Gestionar servicios
- `servicios.planes` - Gestionar planes

### 14. **SISTEMA** (2 permisos)
- `sistema.permisos` - Gestionar permisos
- `sistema.info` - Ver información del sistema

### 15. **USUARIOS** (4 permisos)
- `usuarios.usuarios` - Gestionar usuarios
- `usuarios.roles` - Gestionar roles
- `usuarios.permisos` - Gestionar permisos de usuarios
- `usuarios.bitacora` - Ver bitácora de auditoría

---

## 🔧 Uso en Backend

### Verificar permiso en rutas:
```javascript
router.get('/clientes', requirePermission('clientes.listado'), async (req, res) => {
  // Código aquí solo se ejecuta si el usuario tiene el permiso
});
```

### Verificar múltiples permisos:
```javascript
router.post('/clientes', requirePermission(['clientes.crear', 'clientes.dashboard']), async (req, res) => {
  // Usuario necesita al menos uno de estos permisos
});
```

---

## 🎨 Uso en Frontend

### Mostrar elemento solo si tiene permiso:
```tsx
{userHasPermission('clientes.crear') && (
  <button onClick={() => navigate('/clients/new')}>Crear Cliente</button>
)}
```

### Ocultar menú item sin permiso:
```tsx
const visibleMenuItems = menuItems.filter(item => {
  const requiredPermission = getPermissionForMenuItem(item.name);
  return userHasPermission(requiredPermission);
});
```

---

## 📊 Total de Permisos

- **Total:** 55 permisos del sistema
- **Rol Admin:** Tiene todos los permisos asignados

---

## ✅ Próximos Pasos

1. ✅ Crear seed de permisos (HECHO)
2. ⏳ Crear componente UI para gestionar permisos por rol
3. ⏳ Crear componente UI para asignar permisos a usuarios
4. ⏳ Implementar validación de permisos en menú lateral
5. ⏳ Documentar en API cómo usar los permisos
