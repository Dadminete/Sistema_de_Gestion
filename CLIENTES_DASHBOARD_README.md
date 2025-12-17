# Clientes Dashboard - Documentación

## 📊 Descripción General

El **Clientes Dashboard** es una interfaz moderna y premium diseñada para gestionar y monitorear clientes, suscripciones, facturas y tickets. Está optimizado para proporcionar una visión integral del negocio con gráficos en tiempo real y análisis detallados.

## 🎨 Características Principales

### 1. **Dashboard Ejecutivo**
- 📈 Estadísticas en tiempo real (Total de clientes, ingresos, suscripciones, tickets)
- 💳 Tarjetas de estadísticas con animaciones suaves
- 📊 Indicadores de tendencia (arriba/abajo)
- 🎯 Diseño responsivo y adaptable

### 2. **Gráficos Avanzados**
- 📉 **Gráfico de Área**: Crecimiento de clientes a lo largo del tiempo
- 🥧 **Gráfico Pastel**: Distribución de ingresos por categoría
- 📊 **Gráfico de Barras**: Ingresos mensuales
- 🔄 Datos actualizables por período (6 meses, 12 meses, anual)

### 3. **Gestión de Clientes**
- 👥 Tabla de clientes TOP
- 💰 Ingresos por cliente
- 🏷️ Categorización (VIP, Premium, Estándar, Nuevo)
- ⚡ Acciones rápidas (ver, más opciones)

### 4. **Transacciones**
- 📝 Historial de transacciones recientes
- 🔄 Tipos de transacción (Suscripción, Servicio, Papelería, Equipo)
- 📅 Fechas y estados
- 💾 Opción de descarga en PDF/Excel

### 5. **Panel Lateral Derecho**
- 🔔 Notificaciones en tiempo real
- 🚀 Acciones rápidas (Nuevo cliente, Generar reporte, Contactar)
- 📌 Interfaz minimalista y limpia

### 6. **Navegación**
- 🔘 Sidebar colapsable
- 🔍 Búsqueda de clientes
- ⚙️ Opciones de configuración
- 🔐 Cierre de sesión

## 🛠️ Estructura Técnica

### Archivos Principales

```
src/
├── pages/
│   └── ClientsDashboard.tsx          # Componente principal
├── styles/
│   └── ClientsDashboard.css          # Estilos premium
├── api/
│   └── clientsDashboardAPI.ts        # Servicios API
└── types/
    └── dashboard.ts                   # Tipos TypeScript
```

### Rutas

```
GET  /clients/dashboard              # Vista principal del dashboard
POST /clients/stats                   # Obtener estadísticas
GET  /clients/growth                  # Datos de crecimiento
GET  /clients/top                     # Clientes TOP
GET  /suscripciones                   # Suscripciones activas
GET  /tickets                         # Tickets abiertos
GET  /transactions/recent             # Transacciones recientes
```

## 🔌 Integración con API

### Conectar con tu Backend

El componente utiliza `clientsDashboardAPI.ts` para comunicarse con el backend. Aquí hay cómo habilitar los datos reales:

```typescript
// En ClientsDashboard.tsx
const loadDashboardData = async () => {
  try {
    setLoading(true);
    // Descomenta esta línea:
    const data = await clientsDashboardAPI.getFullDashboard();
    setDashboardData(data);
  } catch (err) {
    console.error('Error loading dashboard:', err);
    setError('Error al cargar los datos del dashboard');
  } finally {
    setLoading(false);
  }
};
```

### Métodos Disponibles en la API

```typescript
// Obtener estadísticas
await clientsDashboardAPI.getDashboardStats()

// Obtener crecimiento de clientes
await clientsDashboardAPI.getClientGrowth('monthly')

// Obtener clientes TOP
await clientsDashboardAPI.getTopClients(5)

// Obtener suscripciones activas
await clientsDashboardAPI.getActiveSuscripciones()

// Obtener tickets abiertos
await clientsDashboardAPI.getOpenTickets()

// Obtener transacciones recientes
await clientsDashboardAPI.getRecentTransactions(10)

// Obtener datos de distribución de ingresos
await clientsDashboardAPI.getRevenueDistribution()

// Obtener clientes por categoría
await clientsDashboardAPI.getClientsByCategory()

// Obtener servicios más vendidos
await clientsDashboardAPI.getTopServices(5)

// Obtener dashboard completo (todas las llamadas)
await clientsDashboardAPI.getFullDashboard()
```

### Métodos CRUD de Clientes

```typescript
// Crear cliente
await clientsDashboardAPI.createClient({
  nombre: 'Juan Pérez',
  email: 'juan@example.com',
  // ... otros campos
})

// Actualizar cliente
await clientsDashboardAPI.updateClient(clientId, {...})

// Obtener cliente por ID
await clientsDashboardAPI.getClientById(clientId)

// Obtener facturas del cliente
await clientsDashboardAPI.getClientFacturas(clientId)

// Obtener suscripciones del cliente
await clientsDashboardAPI.getClientSuscripciones(clientId)

// Obtener tickets del cliente
await clientsDashboardAPI.getClientTickets(clientId)
```

### Exportar Reportes

```typescript
// Exportar a PDF
const pdfBlob = await clientsDashboardAPI.exportToPDF({
  type: 'clientes',
  dateRange: 'month'
})

// Exportar a Excel
const excelBlob = await clientsDashboardAPI.exportToExcel({
  type: 'clientes',
  dateRange: 'month'
})
```

## 🎨 Personalización de Estilos

### Variables de Colores (CSS Variables)

```css
--primary-color: #3b82f6;          /* Azul principal */
--primary-dark: #1e40af;           /* Azul oscuro */
--primary-light: #dbeafe;          /* Azul claro */
--secondary-color: #8b5cf6;        /* Púrpura */
--success-color: #10b981;          /* Verde */
--warning-color: #f59e0b;          /* Naranja */
--danger-color: #ef4444;           /* Rojo */
```

### Modificar Colores Globales

```css
/* En ClientsDashboard.css, modifica :root */
:root {
  --primary-color: #tu-color;
  --secondary-color: #otro-color;
  /* ... */
}
```

### Temas Personalizados

Para crear un tema personalizado, copia el CSS y modifica:

```css
.stat-card {
  background: linear-gradient(135deg, tu-color-inicio, tu-color-fin);
}

.dashboard-header {
  background: tu-color;
}

/* Etc. */
```

## 📱 Responsividad

El dashboard se adapta automáticamente a diferentes pantallas:

- **Desktop** (1400px+): Layout completo con sidebar y panel derecho
- **Tablet** (1024px-1399px): Ajustes de espaciado y grid
- **Mobile** (768px-1023px): Sidebar colapsable, panel derecho horizontal
- **Small Mobile** (480px-767px): Optimizado para pantallas pequeñas

## 🔐 Seguridad

- ✅ Autenticación por token JWT
- ✅ Protección de rutas con `ProtectedRoute`
- ✅ Permisos requeridos: `gestionar_clientes`
- ✅ Headers de seguridad configurados

## 📦 Dependencias

```json
{
  "recharts": "^3.1.2",           // Gráficos
  "lucide-react": "^0.542.0",     // Iconos
  "axios": "^1.11.0",              // HTTP client
  "react": "^19.1.1",              // Framework
  "react-router-dom": "^7.8.2"     // Routing
}
```

## 🚀 Uso Rápido

1. **Importar el componente**:
```tsx
import ClientsDashboard from './pages/ClientsDashboard';
```

2. **Usar en rutas**:
```tsx
<Route
  path="/clients/dashboard"
  element={
    <ProtectedRoute requiredPermission="gestionar_clientes">
      <Layout><ClientsDashboard /></Layout>
    </ProtectedRoute>
  }
/>
```

3. **Acceder**: `http://localhost:5173/clients/dashboard`

## 🐛 Troubleshooting

### Los gráficos no se muestran
- Verifica que `recharts` esté instalado: `npm install recharts`
- Comprueba que el contenedor tenga altura definida

### Los datos no cargan
- Verifica la URL de API en `clientsDashboardAPI.ts`
- Asegúrate de que el token de autenticación está presente
- Revisa la consola para errores CORS

### Los estilos no se aplican
- Verifica que `ClientsDashboard.css` esté importado
- Comprueba que no hay conflicto con otros CSS globales
- Usa las variables CSS del sistema

## 📞 Soporte

Para problemas o sugerencias, revisa:
- Consola del navegador (F12)
- Network tab para errores API
- Documentación del schema.prisma para campos disponibles

## 📝 Notas

- El dashboard usa datos de ejemplo inicialmente
- Para conectar API real, descomenta la línea en `loadDashboardData()`
- Los métodos de API están completamente documentados
- Compatible con TypeScript

---

**Versión**: 1.0.0  
**Última actualización**: Noviembre 2025  
**Estado**: ✅ Producción
