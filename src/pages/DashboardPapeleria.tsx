import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import PapeleriaSalesChart from '@/components/charts/PapeleriaSalesChart';
import TopProductsCard from '@/components/ui/TopProductsCard';
import LatestSalesCard from '@/components/ui/LatestSalesCard';
import LowStockCard from '@/components/ui/LowStockCard';
import { ShoppingCart, Package, Warehouse, TrendingUp, RefreshCw } from 'lucide-react';
import KpiWidget from '@/components/ui/KpiWidget';
import InfoCard from '@/components/ui/InfoCard';
import '../styles/DashboardPapeleria.css';

interface KpiData {
  salesToday: number;
  salesYesterday: number;
  productsSoldLast24h: number;
  totalStockValue: number;
  salesThisMonth: number;
  ingresosThisMonth: number;
  totalIngresosMes: number;
  expensesThisMonth: number;
}

const DashboardPapeleria: React.FC = () => {
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKpiData = async () => {
      try {
        const response = await api.get<KpiData>('/papeleria/dashboard-kpis');
        setKpiData(response.data);
      } catch (error) {
        console.error('Error fetching KPI data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKpiData();
  }, []);

  const formatCurrency = (value: any) => {
    const num = parseFloat(value);
    return `$${(isNaN(num) ? 0 : num).toFixed(2)}`;
  };

  const salesDiff = kpiData ? kpiData.salesToday - kpiData.salesYesterday : 0;
  const salesPercentageNum = kpiData && kpiData.salesYesterday > 0
    ? (salesDiff / kpiData.salesYesterday) * 100
    : (kpiData && kpiData.salesToday > 0 ? 100 : 0);

  const salesDiffText = salesPercentageNum >= 0
    ? `↑ ${salesPercentageNum.toFixed(0)}%`
    : `↓ ${Math.abs(salesPercentageNum).toFixed(0)}%`;
  const salesDiffClass = salesPercentageNum >= 0 ? 'positive' : 'negative';

  const monthlyNet = kpiData ? kpiData.totalIngresosMes - kpiData.expensesThisMonth : 0;

  return (
    <div className="dashboard-layout fade-in">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb">
            <h1>Dashboard de Papelería</h1>
            <p>Resumen y estadísticas de la papelería</p>
          </div>
        </div>
        <div className="header-right">
          <div className="date-range-picker">
            {new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="header-actions">
            <button title="Refresh" onClick={() => window.location.reload()}>
              <RefreshCw size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-kpis">
        <KpiWidget
          title="VENTAS DE HOY"
          value={loading ? '...' : formatCurrency(kpiData?.salesToday || 0)}
          percentage={loading ? '' : salesDiffText}
          percentageClass={salesDiffClass}
          icon={<ShoppingCart className="w-5 h-5" />}
          barColor="#3b82f6" // Blue
        />
        <KpiWidget
          title="PRODUCTOS VENDIDOS (24H)"
          value={loading ? '...' : (kpiData?.productsSoldLast24h || 0).toString()}
          percentage="Últimas 24h"
          percentageClass=""
          icon={<Package className="w-5 h-5" />}
          barColor="#f97316" // Orange
        />
        <KpiWidget
          title="VALOR INVENTARIO"
          value={loading ? '...' : formatCurrency(kpiData?.totalStockValue || 0)}
          percentage="Total Activos"
          percentageClass="positive"
          icon={<Warehouse className="w-5 h-5" />}
          barColor="#10b981" // Emerald
        />
        <KpiWidget
          title="INGRESOS DEL MES"
          value={loading ? '...' : formatCurrency(kpiData?.totalIngresosMes || 0)}
          percentage={`Neto: ${formatCurrency(monthlyNet)}`}
          percentageClass="positive"
          icon={<TrendingUp className="w-5 h-5" />}
          barColor="#ec4899" // Pink
        />
      </div>

      <div className="dashboard-main-content">
        <div className="dashboard-row">
          <div className="card-revenue" style={{ gridColumn: 'span 8' }}>
            <InfoCard title="Rendimiento de Ventas">
              <PapeleriaSalesChart />
            </InfoCard>
          </div>
          <div className="card-sales" style={{ gridColumn: 'span 4' }}>
            <TopProductsCard />
          </div>
        </div>

        <div className="dashboard-row">
          <div style={{ gridColumn: 'span 6' }}>
            <InfoCard title="Últimas Ventas">
              <LatestSalesCard />
            </InfoCard>
          </div>
          <div style={{ gridColumn: 'span 6' }}>
            <InfoCard title="Productos con Bajo Stock">
              <LowStockCard />
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPapeleria;
