import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import type { ChartDataPoint } from '../../services/cajaService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface IngresosGastosChartProps {
  data: ChartDataPoint[];
  period: 'semanal' | 'mensual';
}

const IngresosGastosChart: React.FC<IngresosGastosChartProps> = ({ data, period }) => {
  const chartData: ChartData<'bar'> = {
    labels: data.map(d => d.name),
    datasets: [
      {
        label: 'Ingresos',
        data: data.map(d => (d.IngresoCaja ?? 0) + (d.IngresoBanco ?? 0) + (d.IngresoPapeleria ?? 0)),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Gastos',
        data: data.map(d => (d.GastoCaja ?? 0) + (d.GastoBanco ?? 0) + (d.GastoPapeleria ?? 0)),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Resumen de Ingresos y Gastos - Vista ${period === 'semanal' ? 'Semanal' : 'Mensual'}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Bar options={options} data={chartData} />;
};

export default IngresosGastosChart;
