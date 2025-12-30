import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardData } from '../services/cajaService';
import type { DashboardData, ChartFilter } from '../services/cajaService';
import '../styles/CajasDashboard.css';
import { FaBalanceScale, FaBoxes, FaChartLine, FaCashRegister, FaArrowRight, FaSync, FaCalendar, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import ResumenFinancieroChart from '../components/Cajas/ResumenFinancieroChart';
import IngresosTopSourcesChart from '../components/Cajas/IngresosTopSourcesChart';
import RecentTransactionsTable from '../components/Cajas/RecentTransactionsTable';

const CajasDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<ChartFilter>('week');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (period: ChartFilter = 'week') => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardData(period);
      setDashboardData(data);
      setSelectedPeriod(period);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los datos del dashboard. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData(selectedPeriod);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  useEffect(() => {
    fetchDashboardData('week');
  }, [fetchDashboardData]);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(amount);
  };

  const handleTransactionClick = (transaction: any) => {
    // Navegar a la página de listados correspondiente según el tipo
    if (transaction.tipo === 'ingreso') {
      navigate('/listados/ingresos');
    } else {
      navigate('/listados/gastos');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando Dashboard...</p>
        <span className="loading-subtitle">Por favor espera mientras se cargan los datos</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">❌</div>
        <span>{error}</span>
        <button onClick={() => fetchDashboardData(selectedPeriod)} className="btn-retry">
          <FaSync /> Reintentar
        </button>
      </div>
    );
  }

  const stats = dashboardData?.stats;

  return (
    <div className="cajas-dashboard">
      {/* Header Mejorado */}
      <div className="dashboard-header-enhanced">
        <div className="header-content">
          <div className="header-text">
            <h1><FaCashRegister className="header-icon" /> Dashboard de Cajas</h1>
            <p>Resumen financiero y estado de las cajas</p>
          </div>
          <div className="header-actions">
            <button 
              className={`btn-refresh ${isRefreshing ? 'spinning' : ''}`}
              onClick={handleRefresh}
              title="Actualizar datos"
            >
              <FaSync /> Actualizar
            </button>
          </div>
        </div>
        
        {/* Period Selector */}
        <div className="period-selector">
          <button 
            className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
            onClick={() => fetchDashboardData('week')}
          >
            <FaCalendar /> Esta Semana
          </button>
          <button 
            className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
            onClick={() => fetchDashboardData('month')}
          >
            <FaCalendar /> Este Mes
          </button>
          <button 
            className={`period-btn ${selectedPeriod === 'custom' ? 'active' : ''}`}
            onClick={() => fetchDashboardData('custom')}
          >
            <FaCalendar /> Personalizado
          </button>
        </div>
      </div>

      {/* Stats Cards Mejoradas */}
      <div className="stats-cards-container">
        <div className="card card-income">
          <div className="card-badge">Ingresos</div>
          <div className="card-content">
            <div className="card-top">
              <div className="card-info">
                <h3>Ingresos Totales</h3>
                <div className="card-value">{formatCurrency((stats?.ingresosHoyCajaPrincipal || 0) + (stats?.ingresosHoyPapeleria || 0))}</div>
              </div>
              <div className="card-icon-box income">
                <FaArrowUp />
              </div>
            </div>
            <div className="card-details">
              <div className="detail-item">
                <span>Caja Principal</span>
                <strong>{formatCurrency(stats?.ingresosHoyCajaPrincipal ?? 0)}</strong>
              </div>
              <div className="detail-item">
                <span>Papelería</span>
                <strong>{formatCurrency(stats?.ingresosHoyPapeleria ?? 0)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="card card-expense">
          <div className="card-badge">Gastos</div>
          <div className="card-content">
            <div className="card-top">
              <div className="card-info">
                <h3>Gastos Totales</h3>
                <div className="card-value">{formatCurrency(stats?.gastosHoy)}</div>
              </div>
              <div className="card-icon-box expense">
                <FaArrowDown />
              </div>
            </div>
            <div className="card-details">
              <div className="detail-item">
                <span>Caja Principal</span>
                <strong>{formatCurrency(stats?.gastosHoyCajaPrincipal ?? 0)}</strong>
              </div>
              <div className="detail-item">
                <span>Papelería</span>
                <strong>{formatCurrency(stats?.gastosHoyPapeleria ?? 0)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="card card-balance">
          <div className="card-badge">Balance</div>
          <div className="card-content">
            <div className="card-top">
              <div className="card-info">
                <h3>Balance Total</h3>
                <div className="card-value">{formatCurrency((stats?.balanceCajaPrincipal || 0) + (stats?.balancePapeleria || 0))}</div>
              </div>
              <div className="card-icon-box balance">
                <FaBalanceScale />
              </div>
            </div>
            <div className="card-details">
              <div className="detail-item">
                <span>Caja Principal</span>
                <strong>{formatCurrency(stats?.balanceCajaPrincipal ?? 0)}</strong>
              </div>
              <div className="detail-item">
                <span>Papelería</span>
                <strong>{formatCurrency(stats?.balancePapeleria ?? 0)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="card card-status">
          <div className="card-badge">Estado</div>
          <div className="card-content">
            <div className="card-top">
              <div className="card-info">
                <h3>Estado de Cajas</h3>
                <div className="card-value-status">
                  <span className="status-opened">{stats?.cajasAbiertas ?? 0}</span>
                  <span className="status-separator">/</span>
                  <span className="status-closed">{stats?.cajasCerradas ?? 0}</span>
                </div>
              </div>
              <div className="card-icon-box status">
                <FaBoxes />
              </div>
            </div>
            <div className="card-details">
              <div className="detail-item">
                <span>Abiertas</span>
                <strong className="status-opened">{stats?.cajasAbiertas ?? 0}</strong>
              </div>
              <div className="detail-item">
                <span>Cerradas</span>
                <strong className="status-closed">{stats?.cajasCerradas ?? 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <div className="chart-header">
            <h2><FaChartLine /> Resumen Financiero</h2>
          </div>
          <ResumenFinancieroChart />
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h2>📊 Fuentes de Ingreso (Top 5)</h2>
          </div>
          <IngresosTopSourcesChart period={selectedPeriod} />
        </div>
      </div>

      {/* Transacciones Recientes */}
      <div className="datatable-card">
        <div className="datatable-header">
          <h2>💳 Transacciones Recientes</h2>
          <span className="datatable-subtitle">Últimas operaciones realizadas</span>
        </div>
        <RecentTransactionsTable 
          period={selectedPeriod} 
          limit={10} 
          onRowClick={handleTransactionClick}
        />
      </div>

      {/* Historial de Aperturas y Cierres */}
      <div className="datatable-card">
        <div className="datatable-header">
          <h2>⏱️ Historial de Aperturas y Cierres</h2>
          <span className="datatable-subtitle">Movimientos de cajas</span>
        </div>
        <div className="datatable-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Caja</th>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Usuario</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData?.historial && dashboardData.historial.length > 0 ? (
                dashboardData.historial.slice(0, 8).map((item) => (
                  <tr key={item.id} className="table-row">
                    <td>
                      <span className={`badge badge-${item.tipo}`}>
                        {item.tipo === 'apertura' ? '📖 Apertura' : '📕 Cierre'}
                      </span>
                    </td>
                    <td>
                      <span className="caja-name">{item.origen || item.destino || 'N/A'}</span>
                    </td>
                    <td>{new Date(item.fecha).toLocaleString('es-ES')}</td>
                    <td className="amount-cell">
                      {formatCurrency(item.tipo === 'apertura' ? item.montoInicial : item.montoFinal)}
                    </td>
                    <td>{item.usuario}</td>
                    <td>
                      <button className="btn-view" title="Ver detalles">
                        <FaArrowRight />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="empty-row">
                  <td colSpan={5}>
                    <div className="empty-state">
                      <p>No hay historial disponible</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


export default CajasDashboard;