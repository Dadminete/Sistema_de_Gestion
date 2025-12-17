# 🚀 QUICK START - Referencia Rápida

## 📋 Archivos Principales

| Archivo | Ubicación | Líneas | Tipo |
|---------|-----------|--------|------|
| **CajasDashboard.tsx** | `src/pages/` | 303 | Main |
| **CajasDashboard.css** | `src/styles/` | 868 | Styles |
| **IngresosTopSourcesChart.tsx** | `src/components/Cajas/` | 310 | New ✨ |
| **IngresosTopSourcesChart.css** | `src/components/Cajas/` | 400+ | New ✨ |
| **RecentTransactionsTable.tsx** | `src/components/Cajas/` | 300+ | New ✨ |
| **RecentTransactionsTable.css** | `src/components/Cajas/` | 450+ | New ✨ |

---

## 🎯 Cómo Usar

### Importar en Dashboard
```tsx
import IngresosTopSourcesChart from '../components/Cajas/IngresosTopSourcesChart';
import RecentTransactionsTable from '../components/Cajas/RecentTransactionsTable';
```

### Usar componentes
```tsx
// Gráfico de Ingresos
<IngresosTopSourcesChart 
  period={selectedPeriod}  // 'week' | 'month' | 'custom'
/>

// Tabla de Transacciones
<RecentTransactionsTable 
  period={selectedPeriod}
  limit={15}
  onRowClick={(transaction) => console.log(transaction)}
/>
```

---

## 🎨 Colores CSS

```css
--color-income: #10b981     /* Verde */
--color-expense: #ef4444    /* Rojo */
--color-balance: #3b82f6    /* Azul */
--color-status: #f59e0b     /* Naranja */
```

---

## 📊 APIs Requeridas

```typescript
// Get top 5 income sources
getTopIncomeSources(startDate?: string, endDate?: string)
→ { name: string; value: number }[]

// Get recent transactions
getRecentTransactions(limit: number = 10)
→ Transaction[]

// Get dashboard stats
getDashboardData(filter: ChartFilter)
→ DashboardData
```

---

## ✨ Features Destacadas

### IngresosTopSourcesChart
✅ Barras vs Circular (Toggle)  
✅ Tabla con rankings (1, 2, 3)  
✅ Porcentajes automáticos  
✅ Total visible  
✅ Responsive completo  

### RecentTransactionsTable
✅ Filtro por tipo  
✅ Ordenamiento (Fecha/Monto)  
✅ Exportar CSV  
✅ Resumen (Ingresos, Gastos, Neto)  
✅ Row clickeable  
✅ Responsive completo  

---

## 🔧 Configuración Rápida

### Cambiar período por defecto
```tsx
// En CajasDashboard.tsx
const [selectedPeriod, setSelectedPeriod] = useState<ChartFilter>('month');
```

### Cambiar límite de transacciones
```tsx
<RecentTransactionsTable limit={20} /> {/* era 15 */}
```

### Cambiar colores
```css
:root {
  --color-income: #nuevo-verde;
  --color-expense: #nuevo-rojo;
}
```

---

## 📱 Breakpoints

```css
Desktop:  >1024px  (4 columnas)
Tablet:   768-1024px (2 columnas)
Móvil:    480-768px (1 columna)
Xs:       <480px (ultra compacto)
```

---

## 🧪 Testing Esencial

```
✅ Ver gráfico de ingresos
✅ Toggle barras ↔ circular
✅ Filtrar transacciones
✅ Exportar a CSV
✅ Clickear fila
✅ Ver en móvil
✅ Ver en tablet
```

---

## 📚 Documentación Completa

- [INGRESOS_TRANSACCIONES_IMPLEMENTATION.md](INGRESOS_TRANSACCIONES_IMPLEMENTATION.md)
- [DASHBOARD_FINAL_COMPLETE_SUMMARY.md](DASHBOARD_FINAL_COMPLETE_SUMMARY.md)
- [CAJAS_DASHBOARD_UI_REDESIGN.md](CAJAS_DASHBOARD_UI_REDESIGN.md)
- [DASHBOARD_TESTING_GUIDE.md](DASHBOARD_TESTING_GUIDE.md)

---

**Última actualización:** 27 de Noviembre de 2025  
**Status:** ✅ Producción
