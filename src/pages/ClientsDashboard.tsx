import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  User,
  DollarSign,
  Activity,
  Bell,
  FileText,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Download,
  Eye,
  MoreVertical,
} from 'lucide-react';
import '../styles/ClientsDashboard.css';
import { clientService } from '../services/clientService';
import { type DashboardData, type Client } from '../services/clientService';
import KpiWidget from '@/components/ui/KpiWidget';
import InfoCard from '@/components/ui/InfoCard';

// Icon mapping helper for Material Icons
const getMaterialIcon = (iconName: string) => {
  switch (iconName) {
    case 'Users': return <span className="material-icons">people</span>;
    case 'DollarSign': return <span className="material-icons">attach_money</span>;
    case 'Activity': return <span className="material-icons">trending_up</span>;
    case 'FileText': return <span className="material-icons">description</span>;
    default: return <span className="material-icons">analytics</span>;
  }
};

// Color mapping for KPI widgets
const getBarColor = (stat: any) => {
  // Priorizar el color del backend si está disponible
  if (stat.color) {
    switch (stat.color) {
      case 'red': return '#F44336'; // Red
      case 'green': return '#00BFA5'; // Teal/Green
      case 'blue': return '#2196F3'; // Blue
      case 'purple': return '#9C27B0'; // Purple
      case 'orange': return '#FFC107'; // Orange
      default: return stat.color; // Use the color directly if it's a hex code
    }
  }
  
  // Fallback to icon-based colors
  switch (stat.icon) {
    case 'Users': return '#2196F3'; // Blue
    case 'DollarSign': return '#00BFA5'; // Teal
    case 'Activity': return '#FFC107'; // Orange
    case 'FileText': return '#9C27B0'; // Purple
    default: return '#607D8B'; // Blue Grey
  }
};

// Percentage class mapping
const getPercentageClass = (trend: string) => {
  return trend === 'up' ? 'positive' : trend === 'down' ? 'negative' : 'neutral';
};

const ClientsDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filtrar clientes basado en el término de búsqueda
  const filteredClients = allClients.filter(client => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const name = (client.name || client.nombre || '').toLowerCase();
    const email = (client.email || '').toLowerCase();
    const id = (client.id || '').toString().toLowerCase();
    const phone = (client.telefono || client.phone || '').toLowerCase();
    return name.includes(search) || email.includes(search) || id.includes(search) || phone.includes(search);
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientService.getDashboardData();
      setDashboardData(data);
      // Set the recent clients data
      if (data.allClients) {
        setAllClients(data.allClients);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="dashboard-error">
        <p>{error || 'No se pudieron cargar los datos'}</p>
        <button onClick={loadDashboardData} className="retry-button">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="clients-dashboard-container">
      {/* Header */}
      <div className="dashboard-header-enhanced">
        <div className="header-content">
          <div className="header-text">
            <h1><User className="header-icon" /> Dashboard de Clientes</h1>
            <p>Gestión y análisis de clientes</p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>



      {/* Sidebar */}
      {sidebarOpen && (
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <div className="logo">
              <span className="logo-text"></span>
            </div>
          </div>

          <nav className="sidebar-nav">
          </nav>
        </aside>
      )}

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Main Panel */}
        <main className="dashboard-main">
          {/* Stats Grid */}
          <section className="stats-section">
            <h2 className="section-title">Resumen Ejecutivo</h2>
            <div className="dashboard-kpis">
              {dashboardData.stats.map((stat, idx) => (
                <KpiWidget
                  key={idx}
                  title={stat.title}
                  value={stat.value}
                  percentage={`${stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : ''} ${stat.change}`}
                  percentageClass={getPercentageClass(stat.trend)}
                  icon={getMaterialIcon(stat.icon)}
                  barColor={getBarColor(stat)}
                />
              ))}
            </div>
          </section>

          {/* Charts Section */}
          <section className="charts-section">
            <InfoCard title="Crecimiento de Clientes" className="chart-container large">
              <div className="chart-controls">
                <select className="filter-select">
                  <option>Últimos 6 meses</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.clientGrowth}>
                  <defs>
                    <linearGradient id="colorNuevos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFF',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="nuevos"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorNuevos)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </InfoCard>

            <InfoCard title="Distribución de Ingresos" className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dashboardData.revenueData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} (${value})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </InfoCard>
          </section>

          {/* Clients Table */}
          <section className="clients-table-section">
            <InfoCard 
              title={`Últimos 5 Clientes Ingresados ${searchTerm ? `(${filteredClients.length} encontrados)` : `(${allClients.length} total)`}`} 
              className="clients-table-container"
            >
              <div className="table-wrapper">
                <table className="clients-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Fecha Ingreso</th>
                      <th>Estado</th>
                      <th>Categoría</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <tr key={client.id} className="table-row">
                          <td className="client-cell">
                            <div className="client-avatar">
                              {client.avatar ? (
                                <img src={client.avatar} alt="avatar" />
                              ) : (
                                <User size={20} />
                              )}
                            </div>
                            <div className="client-details">
                              <span className="client-name">
                                {client.name || client.nombre || 'Sin nombre'}
                              </span>
                              <span className="client-id">ID: {client.id}</span>
                            </div>
                          </td>
                          <td className="email-cell">
                            {client.email || 'Sin email'}
                          </td>
                          <td className="phone-cell">
                            {client.telefono || client.phone || 'Sin teléfono'}
                          </td>
                          <td className="date-cell">
                            {client.fecha_ingreso ? new Date(client.fecha_ingreso).toLocaleDateString('es-ES', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            }) : 'Sin fecha'}
                          </td>
                          <td className="status-cell">
                            <span className={`status-badge status-${(client.status || client.estado || 'activo').toLowerCase()}`}>
                              {client.status || client.estado || 'Activo'}
                            </span>
                          </td>
                          <td className="category-cell">
                            {client.category || client.categoria || 'General'}
                          </td>
                          <td className="actions-cell">
                            <button className="action-btn view-btn" title="Ver perfil">
                              <Eye size={16} />
                            </button>
                            <button className="action-btn more-btn" title="Más opciones">
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="no-results">
                          {searchTerm ? `No se encontraron clientes con "${searchTerm}"` : 'No hay clientes disponibles'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </InfoCard>
          </section>

        </main>


      </div>
    </div>
  );
};

export default ClientsDashboard;
