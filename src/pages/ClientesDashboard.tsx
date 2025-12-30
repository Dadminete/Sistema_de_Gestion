import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Users, TrendingUp, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';
import './ClientesDashboard.css';

interface ClientStats {
  totalClientes: number;
  clientesActivos: number;
  suscripcionesActivas: number;
  ingresoMesActual: number;
  ticketsAbiertos: number;
  clientesPorCategoria: Record<string, number>;
  clientesRecientes: Array<{
    id: string;
    nombre: string;
    apellidos: string;
    categoria_cliente: string;
    estado: string;
    fecha_ingreso: string;
  }>;
}

const ClientesDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const getAPIBaseURL = () => {
        const envUrl = import.meta.env.VITE_API_BASE_URL;
        if (envUrl && envUrl.trim()) {
          const trimmed = envUrl.replace(/\/$/, '');
          return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
        }
        const hostname = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const protocol = window.location.protocol.replace(':', '');
        return `${protocol}://${hostname}${port}/api`;
      };
      const API_BASE_URL = getAPIBaseURL();

      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No hay sesión activa');

      const response = await fetch(`${API_BASE_URL}/clients/dashboard/overview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error ${response.status}: ${errorData.error || 'Error al cargar datos'}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const categoryChartData = stats ? Object.entries(stats.clientesPorCategoria).map(([name, value]) => ({
    name,
    value
  })) : [];

  const COLORS = ['#00BFA5', '#00C853', '#FFC107', '#F44336', '#9C27B0', '#2196F3'];

  if (loading) {
    return (
      <div className="clients-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="clients-dashboard">
        <div className="error-state">
          <AlertCircle size={48} />
          <h2>Error al cargar el dashboard</h2>
          <p>{error}</p>
          <button onClick={loadData} className="btn-retry">
            <RefreshCw size={18} />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="clients-dashboard">
      {/* Simple Header */}
      <div className="dashboard-header">
        <div className="header-title">
          <Users size={28} />
          <div>
            <h1>Dashboard de Clientes</h1>
            <p>Resumen de métricas y estadísticas</p>
          </div>
        </div>
        <button onClick={loadData} className="btn-refresh">
          <RefreshCw size={20} />
          Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-container">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#00BFA5' }}>
            <Users size={24} />
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Total Clientes</p>
            <h2 className="kpi-value">{stats.totalClientes}</h2>
            <p className="kpi-subtitle">{stats.clientesActivos} activos</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#00C853' }}>
            <TrendingUp size={24} />
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Suscripciones</p>
            <h2 className="kpi-value">{stats.suscripcionesActivas}</h2>
            <p className="kpi-subtitle">Activas</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#FFC107' }}>
            <DollarSign size={24} />
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Ingresos del Mes</p>
            <h2 className="kpi-value">RD$ {stats.ingresoMesActual.toLocaleString()}</h2>
            <p className="kpi-subtitle">Mes actual</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: '#F44336' }}>
            <AlertCircle size={24} />
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Tickets Abiertos</p>
            <h2 className="kpi-value">{stats.ticketsAbiertos}</h2>
            <p className="kpi-subtitle">{stats.ticketsAbiertos > 0 ? 'Requieren atención' : 'Todo al día'}</p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Recent Clients */}
        <div className="dashboard-card card-large">
          <div className="card-header">
            <h3>Clientes Recientes</h3>
          </div>
          <div className="card-body">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Categoría</th>
                  <th>Fecha Ingreso</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {stats.clientesRecientes.slice(0, 5).map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <div className="client-name-cell">
                        <div className="client-avatar">
                          {cliente.nombre.charAt(0)}{cliente.apellidos.charAt(0)}
                        </div>
                        <span>{cliente.nombre} {cliente.apellidos}</span>
                      </div>
                    </td>
                    <td>{cliente.categoria_cliente}</td>
                    <td>{new Date(cliente.fecha_ingreso).toLocaleDateString('es-DO')}</td>
                    <td>
                      <span className={`badge badge-${cliente.estado.toLowerCase()}`}>
                        {cliente.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Distribución por Categoría</h3>
          </div>
          <div className="card-body">
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(((percent ?? 0) * 100)).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Clientes por Categoría</h3>
          </div>
          <div className="card-body">
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryChartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#00BFA5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientesDashboard;