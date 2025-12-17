import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { getTopIncomeSources } from '../../services/cajaService';
import type { ChartFilter } from '../../services/cajaService';
import { FaSpinner } from 'react-icons/fa';
import './IngresosTopSourcesChart.css';

interface IncomeSource {
  name: string;
  value: number;
  percentage?: number | string;
}

interface IngresosTopSourcesChartProps {
  period?: 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
}

// Colores para el gráfico
const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const IngresosTopSourcesChart: React.FC<IngresosTopSourcesChartProps> = ({ 
  period = 'week',
  startDate,
  endDate 
}) => {
  const [data, setData] = useState<IncomeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const sources = await getTopIncomeSources(startDate, endDate);
      
      console.log('Raw sources from API:', sources);
      
      if (sources && sources.length > 0) {
        // Calcular total para porcentajes
        const total = sources.reduce((sum, item) => sum + item.value, 0);
        
        console.log('Individual values:', sources.map(s => ({ name: s.name, value: s.value })));
        console.log('Calculated total:', total);
        
        const formattedData: IncomeSource[] = sources.map(item => ({
          name: item.name,
          value: item.value,
          percentage: total > 0 ? (item.value / total) * 100 : 0
        }));
        
        console.log('Formatted data:', formattedData);
        setData(formattedData);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error cargando fuentes de ingreso:', err);
      setError('No se pudieron cargar las fuentes de ingreso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, startDate, endDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-DO', { 
      style: 'currency', 
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const totalAmount = data.reduce((sum, item) => {
    console.log('Adding to total:', item.name, item.value, typeof item.value);
    return sum + item.value;
  }, 0);
  
  console.log('Final total amount:', totalAmount);

  if (loading) {
    return (
      <div className="chart-loading">
        <FaSpinner className="spinner-icon" />
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-error">
        <p>{error}</p>
        <button onClick={fetchData} className="retry-btn">Reintentar</button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <p>No hay datos de ingresos disponibles</p>
      </div>
    );
  }

  return (
    <div className="ingresos-chart-container">
      <div className="chart-controls">
        <div className="toggle-buttons">
          <button 
            className={`toggle-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
            title="Vista de barras"
          >
            📊 Barras
          </button>
          <button 
            className={`toggle-btn ${chartType === 'pie' ? 'active' : ''}`}
            onClick={() => setChartType('pie')}
            title="Vista circular"
          >
            🥧 Circular
          </button>
        </div>
        <div className="total-amount">
          <span className="label">Total Ingresos:</span>
          <span className="amount">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Vista de barras */}
      {chartType === 'bar' && (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                style={{ fontSize: '12px', fill: '#6b7280' }}
              />
              <YAxis 
                style={{ fontSize: '12px', fill: '#6b7280' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Vista circular */}
      {chartType === 'pie' && (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percentage }) => `${name}: ${typeof percentage === 'number' ? percentage.toFixed(1) : percentage}%`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabla de detalles */}
      <div className="sources-detail-table">
        <table>
          <thead>
            <tr>
              <th className="rank">#</th>
              <th className="name">Fuente de Ingreso</th>
              <th className="amount">Monto</th>
              <th className="percentage">Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            {data.map((source, index) => (
              <tr key={index} className="table-row">
                <td className="rank">
                  <span className={`badge badge-rank rank-${index + 1}`}>
                    {index + 1}
                  </span>
                </td>
                <td className="name">
                  <div className="source-name">
                    <span className="color-indicator" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                    <span>{source.name}</span>
                  </div>
                </td>
                <td className="amount">
                  <strong>{formatCurrency(source.value)}</strong>
                </td>
                <td className="percentage">
                  <div className="percentage-bar">
                    <div 
                      className="percentage-fill" 
                      style={{ 
                        width: `${source.percentage}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                      }}
                    ></div>
                  </div>
                  <span className="percentage-text">{typeof source.percentage === 'number' ? source.percentage.toFixed(1) : source.percentage}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IngresosTopSourcesChart;
