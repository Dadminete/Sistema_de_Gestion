import React, { useState, useEffect } from 'react';
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
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CajasChart = () => {
  const [chartData, setChartData] = useState<ChartData<'bar'>>({
    labels: [],
    datasets: [
      {
        label: 'Ingresos Caja Principal',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        stack: 'Stack 0',
      },
      {
        label: 'Gastos Caja Principal',
        data: [],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        stack: 'Stack 1',
      },
      {
        label: 'Ingresos Papelería',
        data: [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        stack: 'Stack 0',
      },
      {
        label: 'Gastos Papelería',
        data: [],
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
        stack: 'Stack 1',
      },
    ],
  });
  const [timeFrame, setTimeFrame] = useState('monthly'); // 'monthly' or 'weekly'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/movimientos-contables/summary?timeFrame=${timeFrame}`);
        const data = response.data;

        setChartData({
          labels: data.labels,
          datasets: [
            { ...chartData.datasets[0], data: data.ingresosCajaPrincipal },
            { ...chartData.datasets[1], data: data.gastosCajaPrincipal },
            { ...chartData.datasets[2], data: data.ingresosPapeleria },
            { ...chartData.datasets[3], data: data.gastosPapeleria },
          ],
        });
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchData();
  }, [timeFrame]);

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Resumen de Ingresos y Gastos (${timeFrame === 'monthly' ? 'Mensual' : 'Semanal'})`,
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setTimeFrame('weekly')}
          className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
            timeFrame === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Semanal
        </button>
        <button
          onClick={() => setTimeFrame('monthly')}
          className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
            timeFrame === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Mensual
        </button>
      </div>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default CajasChart;
