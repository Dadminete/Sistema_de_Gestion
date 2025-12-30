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

const ResumenFinancieroChart = () => {
  const [view, setView] = useState<'semanal' | 'mensual'>('semanal');
  const [chartData, setChartData] = useState<ChartData<'bar'>>({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get dynamic API base URL
  const API_BASE_URL = (() => {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && envUrl.trim()) {
      const trimmed = envUrl.replace(/\/$/, '');
      return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
    }
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const protocol = window.location.protocol.replace(':', '');
    return `${protocol}://${hostname}${port}/api`;
  })();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const response = await axios.get(`${API_BASE_URL}/cajas/dashboard/financial-summary`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = response.data;

        const processData = (view: 'semanal' | 'mensual') => {
          const source = data[view];
          if (!source) {
            setChartData({ labels: [], datasets: [] });
            return;
          }
          setChartData({
            labels: source.labels,
            datasets: [
              {
                label: 'Ingresos - Caja Principal',
                data: source.cajaPrincipal.ingresos,
                backgroundColor: 'rgba(13, 71, 161, 0.8)',
                borderColor: 'rgba(13, 71, 161, 1)',
                borderWidth: 1,
              },
              {
                label: 'Gastos - Caja Principal',
                data: source.cajaPrincipal.gastos,
                backgroundColor: 'rgba(198, 40, 40, 0.8)',
                borderColor: 'rgba(198, 40, 40, 1)',
                borderWidth: 1,
              },
              {
                label: 'Ingresos - Papelería',
                data: source.papeleria.ingresos,
                backgroundColor: 'rgba(102, 187, 106, 0.8)',
                borderColor: 'rgba(102, 187, 106, 1)',
                borderWidth: 1,
              },
              {
                label: 'Gastos - Papelería',
                data: source.papeleria.gastos,
                backgroundColor: 'rgba(194, 63, 118, 0.8)',
                borderColor: 'rgba(194, 63, 118, 1)',
                borderWidth: 1,
              },
            ],
          });
        };

        processData(view);

      } catch (err) {
        setError('Error al cargar los datos del gráfico.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Fetch data only once on mount

  useEffect(() => {
    // This effect will re-process data when the view changes
    const reprocessData = async () => {
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        const response = await axios.get(`${API_BASE_URL}/cajas/dashboard/financial-summary`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = response.data;
        const source = data[view];
        if (!source) {
          setChartData({ labels: [], datasets: [] });
          return;
        }
        setChartData({
          labels: source.labels,
          datasets: [
            {
              label: 'Ingresos - Caja Principal',
              data: source.cajaPrincipal.ingresos,
              backgroundColor: 'rgba(13, 71, 161, 0.8)',
              borderColor: 'rgba(13, 71, 161, 1)',
              borderWidth: 1,
            },
            {
              label: 'Gastos - Caja Principal',
              data: source.cajaPrincipal.gastos,
              backgroundColor: 'rgba(198, 40, 40, 0.8)',
              borderColor: 'rgba(198, 40, 40, 1)',
              borderWidth: 1,
            },
            {
              label: 'Ingresos - Papelería',
              data: source.papeleria.ingresos,
              backgroundColor: 'rgba(102, 187, 106, 0.8)',
              borderColor: 'rgba(102, 187, 106, 1)',
              borderWidth: 1,
            },
            {
              label: 'Gastos - Papelería',
              data: source.papeleria.gastos,
              backgroundColor: 'rgba(194, 63, 118, 0.8)',
              borderColor: 'rgba(194, 63, 118, 1)',
              borderWidth: 1,
            },
          ],
        });
      } catch (err) {
        setError('Error al procesar los datos del gráfico.');
        console.error(err);
      }
    };

    reprocessData();
  }, [view]);


  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
          },
          padding: 15,
        },
      },
      title: {
        display: true,
        text: `Resumen de Ingresos y Gastos - Vista ${view === 'semanal' ? 'Semanal' : 'Mensual'}`,
        font: {
          size: 14,
        },
        padding: 10,
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 11,
          },
        },
      }
    }
  };

  if (loading) return <p>Cargando gráfico...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-center mb-4">
        <button
          onClick={() => setView('semanal')}
          className={`px-4 py-2 rounded-l-lg ${view === 'semanal' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Semanal
        </button>
        <button
          onClick={() => setView('mensual')}
          className={`px-4 py-2 rounded-r-lg ${view === 'mensual' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Mensual
        </button>
      </div>
      <div style={{ position: 'relative', height: '350px' }}>
        <Bar options={options} data={chartData} />
      </div>
    </div>
  );
};

export default ResumenFinancieroChart;
