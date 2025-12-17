import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './RevenueChart.css';
import type { ChartDataPoint } from '@/services/cajaService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface RevenueChartProps {
  data: ChartDataPoint[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.name),
    datasets: [
      // INGRESOS (Stack 0)
      {
        label: 'Ingreso Caja',
        data: data.map(d => d.IngresoCaja),
        backgroundColor: '#2e7d32', // Dark Green
        stack: 'Stack 0',
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      {
        label: 'Ingreso Banco',
        data: data.map(d => d.IngresoBanco),
        backgroundColor: '#2196f3', // Blue
        stack: 'Stack 0',
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      {
        label: 'Ingreso Papelería',
        data: data.map(d => d.IngresoPapeleria),
        backgroundColor: '#81c784', // Light Green
        stack: 'Stack 0',
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      // GASTOS (Stack 1)
      {
        label: 'Gasto Caja',
        data: data.map(d => d.GastoCaja),
        backgroundColor: '#c62828', // Dark Red
        stack: 'Stack 1',
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      {
        label: 'Gasto Banco',
        data: data.map(d => d.GastoBanco),
        backgroundColor: '#f8bbd9', // Light Pink
        stack: 'Stack 1',
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      {
        label: 'Gasto Papelería',
        data: data.map(d => d.GastoPapeleria),
        backgroundColor: '#e57373', // Light Red
        stack: 'Stack 1',
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        align: 'center' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      title: {
        display: true,
        text: 'Ingresos vs Gastos (Mensual)',
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <div className="chart-container">
      <Bar options={options} data={chartData} />
    </div>
  );
};

export default RevenueChart;
