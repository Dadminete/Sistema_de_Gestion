# 🎨 Guía de Personalización Avanzada - Clientes Dashboard

## Índice
1. [Temas Personalizados](#temas-personalizados)
2. [Agregar Nuevos Gráficos](#agregar-nuevos-gráficos)
3. [Personalizar Colores](#personalizar-colores)
4. [Agregar Notificaciones en Tiempo Real](#agregar-notificaciones-en-tiempo-real)
5. [Integrar WebSockets](#integrar-websockets)
6. [Crear Reportes Descargables](#crear-reportes-descargables)
7. [Optimizar Rendimiento](#optimizar-rendimiento)
8. [Agregar Filtros Avanzados](#agregar-filtros-avanzados)

---

## Temas Personalizados

### Crear Tema Oscuro

Agrega este código al archivo `ClientsDashboard.css`:

```css
/* Dark Theme */
[data-theme="dark"] {
  --gray-50: #1a1a1a;
  --gray-100: #2d2d2d;
  --gray-200: #404040;
  --gray-800: #f0f0f0;
  --gray-900: #ffffff;
  --primary-light: #1e3a5f;
}

[data-theme="dark"] .dashboard-header {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

[data-theme="dark"] .dashboard-sidebar {
  background-color: #1a1a2e;
  color: #ffffff;
}

[data-theme="dark"] .table-container {
  background-color: #1a1a2e;
  color: #ffffff;
}

[data-theme="dark"] .search-box {
  background-color: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}
```

### Implementar Selector de Tema

```tsx
// En ClientsDashboard.tsx

const [theme, setTheme] = useState('light');

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
}, [theme]);

const toggleTheme = () => {
  setTheme(theme === 'light' ? 'dark' : 'light');
};

// En JSX:
<button onClick={toggleTheme} className="theme-toggle-button">
  {theme === 'light' ? '🌙' : '☀️'}
</button>
```

---

## Agregar Nuevos Gráficos

### Gráfico de Línea Temporal

```tsx
import { LineChart, Line } from 'recharts';

<div className="chart-container large">
  <div className="chart-header">
    <h3 className="chart-title">Evolución de Suscripciones</h3>
  </div>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={dashboardData.clientGrowth}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
      <XAxis dataKey="month" stroke="#6B7280" />
      <YAxis stroke="#6B7280" />
      <Tooltip />
      <Legend />
      <Line 
        type="monotone" 
        dataKey="total" 
        stroke="#3B82F6" 
        strokeWidth={2}
        dot={{ fill: '#3B82F6', r: 5 }}
      />
    </LineChart>
  </ResponsiveContainer>
</div>
```

### Gráfico Radar

```tsx
import { RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

const radarData = [
  { category: 'Servicios', value: 85 },
  { category: 'Papelería', value: 72 },
  { category: 'Equipos', value: 65 },
  { category: 'Suscripciones', value: 90 },
];

<ResponsiveContainer width="100%" height={300}>
  <RadarChart data={radarData}>
    <PolarGrid />
    <PolarAngleAxis dataKey="category" />
    <Radar 
      name="Desempeño" 
      dataKey="value" 
      stroke="#3B82F6" 
      fill="#3B82F6" 
      fillOpacity={0.6}
    />
  </RadarChart>
</ResponsiveContainer>
```

### Heatmap de Actividad

```tsx
// Crea un heatmap de actividad por horas/días

const ActivityHeatmap = ({ data }) => {
  return (
    <div className="heatmap-container">
      {data.map((row, idx) => (
        <div key={idx} className="heatmap-row">
          {row.map((cell, jdx) => (
            <div
              key={jdx}
              className="heatmap-cell"
              style={{
                backgroundColor: `rgba(59, 130, 246, ${cell.value / 100})`
              }}
              title={`${cell.value} clientes`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
```

---

## Personalizar Colores

### Paleta de Colores Premium

```css
:root {
  /* Colores primarios */
  --primary-color: #2563eb;        /* Azul profesional */
  --primary-dark: #1e40af;
  --primary-light: #dbeafe;

  /* Colores secundarios */
  --secondary-color: #9333ea;      /* Púrpura moderno */
  --accent-color: #f59e0b;         /* Naranja cálido */

  /* Estados */
  --success-color: #059669;        /* Verde natural */
  --warning-color: #d97706;        /* Naranja fuerte */
  --danger-color: #dc2626;         /* Rojo vibrante */
  --info-color: #0891b2;           /* Cyan */

  /* Grises */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}
```

### Aplicar Gradientes Personalizados

```css
.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Efecto glass morphism */
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.chart-container {
  background: linear-gradient(to right, #fafafa 0%, #ffffff 100%);
}
```

---

## Agregar Notificaciones en Tiempo Real

### Usar React Query para Datos en Tiempo Real

```tsx
import { useQuery } from '@tanstack/react-query';

const ClientsDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => clientsDashboardAPI.getDashboardStats(),
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });

  return (
    <div>
      {isLoading ? <Loader /> : <StatCard {...stats} />}
    </div>
  );
};
```

### Agregar Toast Notifications

```tsx
import toast from 'react-hot-toast';

const handleCreateClient = async (data) => {
  try {
    await clientsDashboardAPI.createClient(data);
    toast.success('Cliente creado exitosamente');
  } catch (error) {
    toast.error('Error al crear cliente');
  }
};

// En JSX:
<button onClick={handleCreateClient} className="quick-action-button primary">
  + Nuevo Cliente
</button>
```

---

## Integrar WebSockets

### Configurar Socket.IO para Actualizaciones en Tiempo Real

```typescript
import io from 'socket.io-client';

class WebSocketService {
  private socket: any;

  connect() {
    this.socket = io('http://localhost:3000', {
      auth: {
        token: localStorage.getItem('authToken')
      }
    });

    // Escuchar eventos
    this.socket.on('client-created', (data) => {
      console.log('Nuevo cliente:', data);
      // Actualizar estado
    });

    this.socket.on('subscription-updated', (data) => {
      console.log('Suscripción actualizada:', data);
    });

    this.socket.on('payment-received', (data) => {
      console.log('Pago recibido:', data);
      toast.success(`Pago de $${data.amount} recibido`);
    });
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const wsService = new WebSocketService();
```

### Usar WebSocket en el Dashboard

```tsx
useEffect(() => {
  wsService.connect();
  return () => wsService.disconnect();
}, []);
```

---

## Crear Reportes Descargables

### Generar PDF

```tsx
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const generatePDF = async () => {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text('Reporte de Clientes', 14, 15);
  
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 25);
  
  // Agregar tabla
  doc.autoTable({
    head: [['Cliente', 'Categoría', 'Ingresos', 'Estado']],
    body: dashboardData.topClients.map(c => [
      c.name,
      c.category,
      c.revenue,
      c.status
    ])
  });
  
  doc.save('reporte-clientes.pdf');
};
```

### Generar Excel

```tsx
import ExcelJS from 'exceljs';

const generateExcel = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Clientes');
  
  worksheet.columns = [
    { header: 'Cliente', key: 'name', width: 30 },
    { header: 'Categoría', key: 'category', width: 15 },
    { header: 'Ingresos', key: 'revenue', width: 15 },
    { header: 'Estado', key: 'status', width: 15 }
  ];
  
  dashboardData.topClients.forEach(client => {
    worksheet.addRow(client);
  });
  
  await workbook.xlsx.writeFile('reporte-clientes.xlsx');
};
```

---

## Optimizar Rendimiento

### Lazy Loading de Componentes

```tsx
import { lazy, Suspense } from 'react';

const ChartContainer = lazy(() => 
  import('./components/ChartContainer')
);

<Suspense fallback={<LoadingSpinner />}>
  <ChartContainer data={dashboardData} />
</Suspense>
```

### Memoización

```tsx
import { memo } from 'react';

const StatCard = memo(({ title, value, change, icon }) => (
  <div className="stat-card">
    {/* ... */}
  </div>
));
```

### Virtualización de Listas

```tsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={dashboardData.topClients.length}
  itemSize={50}
>
  {({ index, style }) => (
    <div style={style}>
      {/* Renderizar cliente */}
    </div>
  )}
</FixedSizeList>
```

---

## Agregar Filtros Avanzados

### Filtro por Rango de Fechas

```tsx
import DatePicker from 'react-datepicker';

const [dateRange, setDateRange] = useState({
  startDate: new Date(),
  endDate: new Date()
});

<div className="filter-section">
  <label>Fecha Inicio:</label>
  <DatePicker
    selected={dateRange.startDate}
    onChange={(date) => setDateRange({...dateRange, startDate: date})}
  />
  
  <label>Fecha Fin:</label>
  <DatePicker
    selected={dateRange.endDate}
    onChange={(date) => setDateRange({...dateRange, endDate: date})}
  />
</div>
```

### Filtro Avanzado de Clientes

```tsx
const [filters, setFilters] = useState({
  categoria: '',
  estado: '',
  ingresosMin: 0,
  ingresosMax: 1000000,
  busqueda: ''
});

const filteredClients = dashboardData.topClients.filter(client => {
  const matchesSearch = client.name
    .toLowerCase()
    .includes(filters.busqueda.toLowerCase());
  const matchesCategory = !filters.categoria || 
    client.category === filters.categoria;
  const matchesStatus = !filters.estado || 
    client.status === filters.estado;
  
  return matchesSearch && matchesCategory && matchesStatus;
});
```

---

## Exportar Configuraciones

Crea un archivo `dashboardConfig.ts` para centralizar configuraciones:

```typescript
export const DASHBOARD_CONFIG = {
  REFRESH_INTERVAL: 30000, // ms
  CHARTS_HEIGHT: 300,
  MAX_ROWS_TABLE: 10,
  API_BASE_URL: process.env.REACT_APP_API_URL,
  THEME: 'light',
  ANIMATIONS_ENABLED: true,
  CHART_COLORS: {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    success: '#10B981',
    danger: '#EF4444',
  },
  PERMISSIONS: {
    VIEW_DASHBOARD: 'ver_dashboard',
    MANAGE_CLIENTS: 'gestionar_clientes',
    VIEW_REPORTS: 'ver_reportes',
  },
};
```

---

## Mejoras Futuras Sugeridas

- ✅ Agregar gráficos comparativos de períodos
- ✅ Exportar reportes automáticos por email
- ✅ Dashboard personalizado por usuario
- ✅ Predicciones con IA
- ✅ Integración con Google Analytics
- ✅ Alertas automáticas de umbral

---

**Última actualización**: Noviembre 2025
