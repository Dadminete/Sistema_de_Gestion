import React, { useState, useEffect } from 'react';
import './Banks.css';
import { getBanks, getMonthlyStats } from '../services/bankService';
import type { Bank } from '../services/bankService';
import KpiWidget from '../components/ui/KpiWidget';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import {
  RefreshCw,
  Settings,
  TrendingUp,
  Wallet,
  TrendingDown,
  Clock,
  Landmark,
  CheckCircle,
  Activity,
  AlertCircle,
  BarChart2,
  PieChart
} from 'lucide-react';

const getPercentageClass = (percentage: string) => {
  if (percentage.startsWith('+') || percentage.startsWith('↑')) {
    return 'positive';
  }
  if (percentage.startsWith('-') || percentage.startsWith('↓')) {
    return 'negative';
  }
  return '';
};

const BanksDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalBanks: 0,
    activeBanks: 0,
    totalAccounts: 0,
    averageAccountsPerBank: 0,
    totalBalance: 0
  });
  const [monthlyStats, setMonthlyStats] = useState({
    ingresosDelMes: 0,
    gastosDelMes: 0,
    balanceActual: 0,
    transaccionesPendientes: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token) {
      fetchBanks();
      fetchMonthlyStats();
    } else {
      setError('Debes iniciar sesión para acceder a esta página');
    }
  }, []);

  const calculateStats = (banksData: Bank[]) => {
    const totalBanks = banksData.length;
    const activeBanks = banksData.filter(b => b.activo).length;
    const totalAccounts = banksData.reduce((sum, bank) => sum + (bank.cuentas?.length || 0), 0);
    const averageAccountsPerBank = totalBanks > 0 ? totalAccounts / totalBanks : 0;
    const seenAccountIds = new Set<string>();
    let totalBalance = 0;

    banksData.forEach(bank => {
      (bank.cuentas || []).forEach(cuenta => {
        const cuentaContableId = cuenta.cuentaContable?.id;
        if (cuentaContableId && !seenAccountIds.has(cuentaContableId)) {
          seenAccountIds.add(cuentaContableId);
          totalBalance += Number(cuenta.cuentaContable?.saldoActual ?? 0);
        }
      });
    });

    setStats({
      totalBanks,
      activeBanks,
      totalAccounts,
      averageAccountsPerBank,
      totalBalance
    });
  };

  const fetchBanks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBanks();
      const sortedBanks = data.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      setBanks(sortedBanks);
      calculateStats(sortedBanks);
    } catch (err) {
      console.error('Error al cargar bancos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar bancos';
      setError(errorMessage);
      setBanks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const data = await getMonthlyStats();
      setMonthlyStats(data);
    } catch (err) {
      console.error('Error al cargar estadísticas mensuales:', err);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <div className="dashboard-header">
          <div className="header-left">
            <div className="breadcrumb"><h1>Dashboard de Bancos</h1>
              <p>Visualiza las estadísticas de tus instituciones financieras.</p></div>
          </div>
        </div>
        <div className="loading-message" style={{
          textAlign: 'center',
          padding: '4rem',
          color: 'var(--colors-text-secondary)'
        }}>
          <RefreshCw size={48} className="animate-spin" strokeWidth={2.5} style={{ marginBottom: '1rem', color: 'var(--av-primary)' }} />
          <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Cargando bancos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="breadcrumb"><h1>Dashboard de Bancos</h1>
            <p>
              Resumen general de instituciones financieras y cuentas bancarias.
            </p></div>
        </div>
        <div className="header-right">
          <div className="header-actions">
            <button title="Refrescar" className="action-button" onClick={fetchBanks} disabled={loading}>
              <RefreshCw size={20} strokeWidth={2.5} />
            </button>
            <button title="Ir a Gestión" className="action-button" onClick={() => navigate('/banks/management')} disabled={loading}>
              <Settings size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-kpis">
        <KpiWidget
          title="INGRESOS DEL MES"
          value={new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(monthlyStats.ingresosDelMes)}
          percentage={monthlyStats.ingresosDelMes > 0 ? '↑ Este mes' : 'Sin ingresos'}
          percentageClass={monthlyStats.ingresosDelMes > 0 ? 'positive' : ''}
          icon={<TrendingUp size={24} strokeWidth={2.5} />}
          barColor="#4CAF50"
        />
        <KpiWidget
          title="SALDO EN CUENTAS"
          value={new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(monthlyStats.balanceActual)}
          percentage="Monto actual"
          percentageClass={monthlyStats.balanceActual > 0 ? 'positive' : monthlyStats.balanceActual < 0 ? 'negative' : ''}
          icon={<Wallet size={24} strokeWidth={2.5} />}
          barColor="#2196F3"
        />
        <KpiWidget
          title="GASTOS DEL MES"
          value={new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(monthlyStats.gastosDelMes)}
          percentage={monthlyStats.gastosDelMes > 0 ? '↓ Este mes' : 'Sin gastos'}
          percentageClass={monthlyStats.gastosDelMes > 0 ? 'negative' : ''}
          icon={<TrendingDown size={24} strokeWidth={2.5} />}
          barColor="#F44336"
        />
        <KpiWidget
          title="TRANSACCIONES PENDIENTES"
          value={monthlyStats.transaccionesPendientes.toString()}
          percentage={monthlyStats.transaccionesPendientes > 0 ? 'Por procesar' : 'Todo al día'}
          percentageClass={monthlyStats.transaccionesPendientes > 0 ? 'warning' : 'positive'}
          icon={<Clock size={24} strokeWidth={2.5} />}
          barColor="#FF9800"
        />
        <KpiWidget
          title="BALANCE TOTAL"
          value={new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(stats.totalBalance)}
          percentage={stats.totalBanks > 0 ? `${stats.totalBanks} bancos` : 'Sin cuentas'}
          percentageClass={stats.totalBalance > 0 ? 'positive' : stats.totalBalance < 0 ? 'negative' : ''}
          icon={<Landmark size={24} strokeWidth={2.5} />}
          barColor="#00BFA5"
        />
        <KpiWidget
          title="BANCOS ACTIVOS"
          value={stats.activeBanks.toString()}
          percentage={stats.totalBanks > 0 ? `${((stats.activeBanks / stats.totalBanks) * 100).toFixed(0)}%` : 'N/A'}
          percentageClass={getPercentageClass("↑")}
          icon={<CheckCircle size={24} strokeWidth={2.5} />}
          barColor="#4CAF50"
        />
        <KpiWidget
          title="CUENTAS TOTALES"
          value={stats.totalAccounts.toString()}
          percentage={stats.totalAccounts > 0 ? `↑ ${stats.totalAccounts} cuentas` : 'Sin cuentas'}
          percentageClass={stats.totalAccounts > 0 ? 'positive' : ''}
          icon={<Activity size={24} strokeWidth={2.5} />}
          barColor="#2196F3"
        />
        <KpiWidget
          title="PROMEDIO CUENTAS/BANCO"
          value={stats.averageAccountsPerBank.toFixed(1)}
          percentage={stats.totalBanks > 0 ? `Total ${stats.totalBanks} bancos` : 'N/A'}
          percentageClass={stats.averageAccountsPerBank > 0 ? 'positive' : ''}
          icon={<TrendingUp size={24} strokeWidth={2.5} />}
          barColor="#FF9800"
        />
      </div>

      {/* Main Content */}
      <div className="dashboard-main-content">
        <div className="dashboard-row">
          {/* Gráfica: Ingresos vs Gastos */}
          <div className="glass-container" style={{ gridColumn: 'span 6' }}>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--av-text)', fontSize: '1.25rem', fontWeight: 600 }}>
                <BarChart2 size={24} strokeWidth={2.5} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                Ingresos vs Gastos (Mes Actual)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: 'Ingresos',
                      monto: monthlyStats.ingresosDelMes,
                    },
                    {
                      name: 'Gastos',
                      monto: monthlyStats.gastosDelMes,
                    },
                    {
                      name: 'Balance',
                      monto: monthlyStats.ingresosDelMes - monthlyStats.gastosDelMes,
                    },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                  <XAxis dataKey="name" stroke="var(--av-text)" />
                  <YAxis stroke="var(--av-text)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      color: 'var(--av-text)'
                    }}
                    formatter={(value: number) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(value)}
                  />
                  <Legend />
                  <Bar dataKey="monto" name="Monto" radius={[8, 8, 0, 0]}>
                    <Cell fill="#4CAF50" />
                    <Cell fill="#F44336" />
                    <Cell fill="#2196F3" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfica: Distribución por Banco */}
          <div className="glass-container" style={{ gridColumn: 'span 6' }}>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--av-text)', fontSize: '1.25rem', fontWeight: 600 }}>
                <PieChart size={24} strokeWidth={2.5} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                Distribución por Banco
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={banks.map(bank => ({
                    nombre: bank.nombre.length > 15 ? bank.nombre.substring(0, 15) + '...' : bank.nombre,
                    cuentas: bank.cuentas?.length || 0
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                  <XAxis dataKey="nombre" stroke="var(--av-text)" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="var(--av-text)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      color: 'var(--av-text)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="cuentas" name="Número de Cuentas" fill="#00BFA5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {error && (
          <div className="dashboard-row" style={{ marginBottom: '1rem' }}>
            <div className="error-message" style={{
              backgroundColor: 'var(--colors-error-main)',
              color: 'white',
              padding: '1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              gridColumn: '1 / -1'
            }}>
              <AlertCircle size={24} strokeWidth={2.5} />
              <div>
                <strong>Error:</strong> {error}
                <button
                  onClick={() => setError(null)}
                  style={{
                    marginLeft: '1rem',
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BanksDashboard;
