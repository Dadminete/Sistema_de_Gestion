import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { getVentas, type VentaPapeleria } from '@/services/papeleriaApi';
import './PapeleriaSalesChart.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Helper to process sales data
const processSalesData = (sales: VentaPapeleria[]) => {
  const salesByDay: { [key: string]: number } = {};
  sales.forEach(sale => {
    const date = new Date(sale.fechaVenta);
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    if (!salesByDay[dayKey]) {
      salesByDay[dayKey] = 0;
    }
    salesByDay[dayKey] += Number(sale.total);
  });
  return salesByDay;
};

const PapeleriaSalesChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [sales, setSales] = useState<VentaPapeleria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const response = await getVentas();
        setSales(response.data);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const chartData = useMemo(() => {
    if (loading || sales.length === 0) {
      return { labels: [], datasets: [] };
    }

    const dailySales = processSalesData(sales);
    let labels: string[] = [];
    let data: number[] = [];

    if (timeRange === 'daily') {
      labels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const today = new Date();
      data = labels.map((_, i) => {
        const day = new Date(today);
        day.setDate(today.getDate() - (today.getDay() - i));
        const dayKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        return dailySales[dayKey] || 0;
      });
    } else if (timeRange === 'weekly') {
      // Mostrar las últimas 4 semanas
      const weeklySales: { [key: string]: number } = {};
      const today = new Date();
      
      // Crear las últimas 4 semanas
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (today.getDay() + i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekKey = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
        weeklySales[weekKey] = 0;
        
        // Sumar ventas de esa semana
        for (let j = 0; j < 7; j++) {
          const currentDay = new Date(weekStart);
          currentDay.setDate(weekStart.getDate() + j);
          const dayKey = `${currentDay.getFullYear()}-${String(currentDay.getMonth() + 1).padStart(2, '0')}-${String(currentDay.getDate()).padStart(2, '0')}`;
          weeklySales[weekKey] += dailySales[dayKey] || 0;
        }
      }
      
      labels = Object.keys(weeklySales);
      data = Object.values(weeklySales);
    } else if (timeRange === 'monthly') {
      // Mostrar los últimos 12 meses
      const monthlySales: { [key: string]: number } = {};
      const today = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${month.toLocaleString('es-ES', { month: 'short' })} ${month.getFullYear()}`;
        monthlySales[monthKey] = 0;
        
        // Sumar todas las ventas de ese mes
        Object.keys(dailySales).forEach(dayKey => {
          const saleDate = new Date(dayKey);
          if (saleDate.getFullYear() === month.getFullYear() && saleDate.getMonth() === month.getMonth()) {
            monthlySales[monthKey] += dailySales[dayKey];
          }
        });
      }
      
      labels = Object.keys(monthlySales);
      data = Object.values(monthlySales);
    } else if (timeRange === 'yearly') {
      // Mostrar los últimos 5 años
      const yearlySales: { [key: string]: number } = {};
      const currentYear = new Date().getFullYear();
      
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        const yearKey = year.toString();
        yearlySales[yearKey] = 0;
        
        // Sumar todas las ventas de ese año
        Object.keys(dailySales).forEach(dayKey => {
          const saleDate = new Date(dayKey);
          if (saleDate.getFullYear() === year) {
            yearlySales[yearKey] += dailySales[dayKey];
          }
        });
      }
      
      labels = Object.keys(yearlySales);
      data = Object.values(yearlySales);
    }

    return {
      labels,
      datasets: [
        {
          label: `Ventas ${
            timeRange === 'daily' ? '(RD$ por día)' : 
            timeRange === 'weekly' ? '(RD$ por semana)' : 
            timeRange === 'monthly' ? '(RD$ por mes)' : 
            '(RD$ por año)'
          }`,
          data,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [sales, timeRange, loading]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return `${context.dataset.label}: RD$ ${value.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return `RD$ ${value.toLocaleString('es-DO')}`;
          }
        }
      },
    },
  };

  return (
    <div className="papeleria-sales-chart-container">
      <div className="chart-header">
        <h3>Rendimiento de Ventas</h3>
        <div className="chart-tabs">
          <button
            onClick={() => setTimeRange('daily')}
            className={timeRange === 'daily' ? 'active' : ''}
          >
            Semanal
          </button>
          <button
            onClick={() => setTimeRange('weekly')}
            className={timeRange === 'weekly' ? 'active' : ''}
          >
            4 Semanas
          </button>
          <button
            onClick={() => setTimeRange('monthly')}
            className={timeRange === 'monthly' ? 'active' : ''}
          >
            Mensual
          </button>
          <button
            onClick={() => setTimeRange('yearly')}
            className={timeRange === 'yearly' ? 'active' : ''}
          >
            Anual
          </button>
        </div>
      </div>
      <div className="chart-content">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default PapeleriaSalesChart;
